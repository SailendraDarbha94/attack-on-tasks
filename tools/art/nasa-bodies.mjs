// Turn raw NASA photographs into masked body sprites for the app.
//   node tools/art/nasa-bodies.mjs <staging-dir>
// Reads  <staging-dir>/<body>.jpg  (full disc on black, verified upstream)
// Writes assets/bodies/<body>.png  (square, transparent, disc centered)
// and    src/components/bodyImages.gen.ts (require map + disc fractions).
//
// Round bodies get a hard circular alpha mask with a 1.5% feather; Saturn and
// the Sun keep everything bright (rings, prominences) via a luminance mask.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const staging = process.argv[2];
if (!staging) throw new Error('usage: node nasa-bodies.mjs <staging-dir> [body ...]');
const only = process.argv.slice(3);
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const outDir = path.join(repo, 'assets', 'bodies');
await mkdir(outDir, { recursive: true });

// Find the bright-content bounding box ourselves (sharp's trim can be fooled
// by JPEG noise in space): scan a downsized grayscale raster.
async function brightBox(file, threshold = 26) {
  const probeW = 512;
  const meta = await sharp(file).metadata();
  const scale = meta.width / probeW;
  const probeH = Math.round(meta.height / scale);
  const { data } = await sharp(file)
    .resize(probeW, probeH, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = probeW, minY = probeH, maxX = 0, maxY = 0;
  for (let y = 0; y < probeH; y++)
    for (let x = 0; x < probeW; x++)
      if (data[y * probeW + x] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  if (maxX <= minX || maxY <= minY) throw new Error(`${file}: nothing bright found`);
  return {
    left: Math.max(0, Math.floor(minX * scale)),
    top: Math.max(0, Math.floor(minY * scale)),
    width: Math.min(meta.width, Math.ceil((maxX - minX + 1) * scale)),
    height: Math.min(meta.height, Math.ceil((maxY - minY + 1) * scale)),
  };
}

function circleMaskSvg(size, discFrac, feather = 0.015) {
  const r = (size * discFrac) / 2;
  const c = size / 2;
  const f = Math.max(1, size * feather);
  return Buffer.from(
    `<svg width="${size}" height="${size}"><defs><radialGradient id="g"><stop offset="${(1 - f / r) * 100}%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></radialGradient></defs><circle cx="${c}" cy="${c}" r="${r}" fill="url(#g)"/></svg>`,
  );
}

// mode 'disc': crop to disc, circular alpha mask. discFrac = disc diameter as
// a fraction of the output square (padding keeps the feather inside).
// mode 'lum': crop to bright box, luminance-as-alpha (rings, prominences).
const JOBS = [
  { id: 'sun', mode: 'lum', size: 1024, pad: 0.03, file: 'sun-171.jpg', modulate: { brightness: 1.28, saturation: 1.45 }, furnace: true, blackout: [[0, 0.935, 0.55, 0.065]], radialFeather: [0.68, 0.96] },
  { id: 'mercury', mode: 'disc', size: 512 },
  { id: 'venus', mode: 'disc', size: 512 },
  { id: 'earth', mode: 'disc', size: 512 },
  { id: 'moon', mode: 'disc', size: 512 },
  { id: 'mars', mode: 'disc', size: 512 },
  { id: 'jupiter', mode: 'disc', size: 512 },
  { id: 'saturn', mode: 'lum', size: 768 },
  { id: 'uranus', mode: 'disc', size: 512 },
  { id: 'neptune', mode: 'disc', size: 512 },
  { id: 'asteroid', mode: 'lum', size: 512 },
];

const manifest = {};
for (const job of JOBS) {
  if (only.length && !only.includes(job.id)) continue;
  let src = path.join(staging, job.file ?? `${job.id}.jpg`);
  if (job.blackout) {
    // erase margin captions before anything measures brightness
    const meta0 = await sharp(src).metadata();
    const rects = job.blackout
      .map(([x, y, w, h]) =>
        `<rect x="${x * meta0.width}" y="${y * meta0.height}" width="${w * meta0.width}" height="${h * meta0.height}" fill="#000"/>`)
      .join('');
    const clean = src.replace(/\.jpg$/, '.clean.jpg');
    await sharp(src)
      .composite([{ input: Buffer.from(`<svg width="${meta0.width}" height="${meta0.height}">${rects}</svg>`) }])
      .jpeg({ quality: 96 })
      .toFile(clean);
    src = clean;
  }
  const box = await brightBox(src);
  // sharp reorders operations inside one pipeline (extend always lands after
  // resize), so every geometric stage gets its own instance via toBuffer
  const side = Math.max(box.width, box.height);
  const pad = job.mode === 'disc' ? 0.03 : (job.pad ?? 0.04);
  const target = Math.round(side * (1 + 2 * pad));
  let buf = await sharp(src).extract(box).toBuffer();
  if (job.mode === 'disc' && box.width !== box.height) {
    // disc sources can carry non-square pixel geometry (Voyager vidicon):
    // force the bright box square so the disc is round
    buf = await sharp(buf).resize(side, side, { fit: 'fill' }).toBuffer();
  }
  const w = job.mode === 'disc' ? side : box.width;
  const h = job.mode === 'disc' ? side : box.height;
  buf = await sharp(buf)
    .extend({
      top: Math.floor((target - h) / 2),
      bottom: Math.ceil((target - h) / 2),
      left: Math.floor((target - w) / 2),
      right: Math.ceil((target - w) / 2),
      background: { r: 0, g: 0, b: 0 },
    })
    .toBuffer();
  let img = sharp(buf).resize(job.size, job.size, { fit: 'fill' });
  if (job.modulate) img = img.modulate(job.modulate);

  let discFrac;
  if (job.mode === 'disc') {
    discFrac = side / target; // the disc's share of the output square
    const rgb = await img.removeAlpha().toBuffer();
    img = sharp(rgb).composite([
      { input: circleMaskSvg(job.size, discFrac), blend: 'dest-in' },
    ]);
  } else {
    // luminance -> alpha, with a floor so faint ring/prominence light survives
    const rgb = await img.removeAlpha().toBuffer();
    const alpha = await sharp(rgb)
      .grayscale()
      .linear(3.2, -14) // steep ramp: space stays 0, body saturates to opaque
      .toColourspace('b-w')
      .toBuffer();
    img = sharp(rgb).joinChannel(alpha);
    if (job.radialFeather) {
      // a luminance mask keeps the glow but also its square crop boundary —
      // a radial falloff retires the corners before the edge can show
      const [from, to] = job.radialFeather;
      const rMask = Buffer.from(
        `<svg width="${job.size}" height="${job.size}"><defs><radialGradient id="f"><stop offset="${from * 100}%" stop-color="#fff"/><stop offset="${to * 100}%" stop-color="#000"/></radialGradient></defs><rect width="${job.size}" height="${job.size}" fill="url(#f)"/></svg>`,
      );
      img = sharp(await img.png().toBuffer()).composite([{ input: rMask, blend: 'dest-in' }]);
    }
    if (job.furnace) {
      // a white-hot heart: the star should read as burning, not painted
      const core = Buffer.from(
        `<svg width="${job.size}" height="${job.size}"><defs><radialGradient id="c"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="34%" stop-color="#FFF3C4" stop-opacity="0.55"/><stop offset="70%" stop-color="#FFD24A" stop-opacity="0"/></radialGradient></defs><rect width="${job.size}" height="${job.size}" fill="url(#c)"/></svg>`,
      );
      img = sharp(await img.png().toBuffer()).composite([{ input: core, blend: 'screen' }]);
    }
    discFrac = side / target;
  }

  const out = path.join(outDir, `${job.id}.png`);
  await img.png({ compressionLevel: 9 }).toFile(out);
  manifest[job.id] = { discFrac: Number(discFrac.toFixed(4)) };
  console.log(`${job.id}: ${job.size}px ${job.mode} discFrac=${discFrac.toFixed(3)}`);
}

if (only.length === 0) {
const ts = `// GENERATED by tools/art/nasa-bodies.mjs — do not edit by hand.
// Each sprite is a square PNG; discFrac is the body disc's diameter as a
// fraction of that square (rings and prominences spill past the disc).
export interface BodySprite {
  source: number;
  discFrac: number;
}

export const BODY_SPRITES = {
${JOBS.map((j) => `  ${j.id}: { source: require('../../assets/bodies/${j.id}.png'), discFrac: ${manifest[j.id].discFrac} },`).join('\n')}
} as const;

export type SpriteId = keyof typeof BODY_SPRITES;
`;
await writeFile(path.join(repo, 'src', 'components', 'bodyImages.gen.ts'), ts);
console.log('wrote src/components/bodyImages.gen.ts');
}
