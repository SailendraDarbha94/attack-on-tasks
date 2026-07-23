// Beast walk sprite: flood-cut the manga side profile, hand-traced
// silhouette polygon, colorize to the fur/tan palette, canvas placement.
// Modes: `node side-cut3.mjs preview` (mask overlay) | `node side-cut3.mjs cut`
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

const MODE = process.argv[2] ?? 'preview';
const SOURCE = '/Users/batman/Downloads/smoke_titan_side_profile.jpg';
mkdirSync('./side', { recursive: true });

// ── prep: white-flood cut of the raw manga panel (side/smoke-raw.png) ────
if (!existsSync('./side/smoke-raw.png')) {
  const { data, info } = await sharp(SOURCE)
    .resize(740)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const isWhite = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return Math.min(r, g, b) > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 26;
  };
  const queue = [];
  for (let x = 0; x < w; x++) queue.push(x, x + (h - 1) * w);
  for (let y = 0; y < h; y++) queue.push(y * w, y * w + w - 1);
  const seen = new Uint8Array(w * h);
  while (queue.length) {
    const p = queue.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (data[p * 4 + 3] !== 0 && !isWhite(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) queue.push(p - 1);
    if (x < w - 1) queue.push(p + 1);
    if (y > 0) queue.push(p - w);
    if (y < h - 1) queue.push(p + w);
  }
  // largest connected component
  const label = new Int32Array(w * h).fill(-1);
  let best = -1, bestSize = 0, next = 0;
  for (let start = 0; start < w * h; start++) {
    if (data[start * 4 + 3] <= 8 || label[start] !== -1) continue;
    let size = 0;
    const stack = [start];
    label[start] = next;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % w;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h) continue;
        if (Math.abs((q % w) - x) > 1) continue;
        if (data[q * 4 + 3] > 8 && label[q] === -1) {
          label[q] = next;
          stack.push(q);
        }
      }
    }
    if (size > bestSize) { bestSize = size; best = next; }
    next++;
  }
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] > 0 && label[p] !== best) data[p * 4 + 3] = 0;
  }
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toFile('./side/smoke-raw.png');
  console.log('prep: smoke-raw', maxX - minX + 1, 'x', maxY - minY + 1);
}

// traced on side/smoke-raw.png (729x1940), clockwise from skull
const POLY = [
  [335, 12], [335, 42], [330, 98], [310, 150], [245, 255], [200, 380],
  [160, 600], [122, 850], [85, 1150], [62, 1320], [45, 1420], [30, 1480],
  [58, 1505], [95, 1420], [120, 1150], [150, 950], [175, 800], [197, 690],
  [228, 850], [248, 1000], [228, 1280], [172, 1600], [128, 1745], [140, 1815],
  [258, 1822], [275, 1615], [322, 1330], [345, 1050], [378, 1300], [368, 1600],
  [390, 1740], [400, 1815], [558, 1850], [552, 1812], [495, 1605], [482, 1320],
  [462, 1100], [455, 1000], [500, 800], [527, 650], [547, 520], [567, 700],
  [587, 950], [602, 1200], [612, 1350], [674, 1432], [657, 1298], [650, 1150],
  [640, 950], [622, 700], [588, 470], [548, 330], [502, 220], [489, 185],
  [509, 138], [479, 70], [416, 12],
];

const points = POLY.map(([x, y]) => `${x},${y}`).join(' ');
const meta = await sharp('./side/smoke-raw.png').metadata();

if (MODE === 'preview') {
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${meta.width} ${meta.height}" width="${meta.width}" height="${meta.height}">
      <polygon points="${points}" fill="#FF2020" fill-opacity="0.35" stroke="#FF0000" stroke-width="4"/>
    </svg>`,
  );
  await sharp('./side/smoke-raw.png')
    .composite([{ input: overlay }])
    .png()
    .toFile('./side/smoke-mask-preview.png');
  console.log('preview written');
} else {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${meta.width} ${meta.height}" width="${meta.width}" height="${meta.height}">
      <polygon points="${points}" fill="#fff"/>
    </svg>`,
  );
  const maskPng = await sharp(mask).blur(1.2).png().toBuffer();
  const cut = await sharp('./side/smoke-raw.png')
    .composite([{ input: maskPng, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // colorize: manga grayscale -> previous Beast palette (fur browns, tan belly)
  const { data, info } = await sharp(cut).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const stops = [
    [0, [26, 13, 7]],
    [60, [58, 29, 18]],
    [110, [92, 46, 28]],
    [160, [138, 85, 53]],
    [210, [201, 168, 126]],
    [255, [232, 210, 172]],
  ];
  for (let p = 0; p < info.width * info.height; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let k = 1;
    while (k < stops.length - 1 && stops[k][0] < lum) k++;
    const [l0, c0] = stops[k - 1];
    const [l1, c1] = stops[k];
    const f = Math.max(0, Math.min(1, (lum - l0) / (l1 - l0)));
    data[i] = Math.round(c0[0] + (c1[0] - c0[0]) * f);
    data[i + 1] = Math.round(c0[1] + (c1[1] - c0[1]) * f);
    data[i + 2] = Math.round(c0[2] + (c1[2] - c0[2]) * f);
  }
  // light background remnants (manga steps) only exist low in the frame,
  // where the legs are dark — drop bright pixels there
  for (let y = 1380; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] === 0) continue;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum > 150) data[i + 3] = Math.round(data[i + 3] * 0.15);
    }
  }
  const fade = 200;
  for (let y = info.height - fade; y < info.height; y++) {
    const f = (info.height - y) / fade;
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4 + 3;
      data[i] = Math.round(data[i] * f);
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile('./side/smoke-walk-cut.png');

  // canvas placement: 960x1440, bottom-anchored like every other sprite
  const buf = await sharp('./side/smoke-walk-cut.png').png().toBuffer();
  const m = await sharp(buf).metadata();
  const s = Math.min((960 * 0.86) / m.width, (1440 * 0.94) / m.height);
  const rw = Math.round(m.width * s), rh = Math.round(m.height * s);
  const resized = await sharp(buf).resize(rw, rh).png().toBuffer();
  await sharp({ create: { width: 960, height: 1440, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left: Math.round((960 - rw) / 2), top: 1440 - 43 - rh }])
    .png()
    .toFile('./side/smoke-walk.png');
  console.log('colorized cut + smoke-walk.png written');
}
