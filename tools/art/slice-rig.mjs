// Slice the colorized Beast side profile into Rive-ready rig parts.
// Each part: polygon mask (joint overlap included), feathered, trimmed with
// padding, plus a README of pivot points in each part's local coordinates.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = './side/smoke-walk-cut.png';
const OUT = process.argv[2] ?? '/Users/batman/Desktop/beast-rive-parts';
mkdirSync(OUT, { recursive: true });

const PAD = 18;

// polygons in source coordinates (729x1940), joints overlap on purpose
const PARTS = {
  'beast-head': {
    poly: [
      [335, 12], [335, 42], [330, 98], [310, 150], [295, 210], [300, 262],
      [510, 262], [502, 220], [489, 185], [509, 138], [479, 70], [416, 12],
    ],
    pivot: [400, 240], // neck
    z: 5,
  },
  'beast-torso': {
    poly: [
      [310, 150], [245, 255], [200, 380], [230, 520], [197, 690], [228, 850],
      [248, 1000], [262, 1080], [440, 1085], [455, 1000], [500, 800],
      [527, 650], [547, 520], [588, 470], [548, 330], [502, 220], [502, 240],
    ],
    pivot: [350, 1030], // hips
    z: 3,
  },
  'beast-arm-back': {
    poly: [
      [230, 360], [180, 520], [160, 600], [122, 850], [85, 1150], [62, 1320],
      [45, 1420], [30, 1480], [58, 1505], [95, 1420], [120, 1150], [150, 950],
      [175, 800], [197, 690], [230, 560],
    ],
    pivot: [212, 470], // shoulder
    z: 1,
  },
  'beast-arm-front': {
    poly: [
      [545, 420], [560, 440], [588, 470], [622, 700], [640, 950], [650, 1150],
      [657, 1298], [674, 1432], [612, 1350], [602, 1200], [587, 950],
      [567, 700], [540, 520], [528, 460],
    ],
    pivot: [570, 480], // shoulder
    z: 6,
  },
  'beast-leg-back': {
    poly: [
      [248, 980], [228, 1280], [172, 1600], [128, 1745], [140, 1815],
      [258, 1822], [275, 1615], [322, 1330], [345, 1050], [340, 990],
    ],
    pivot: [285, 1030], // hip
    z: 2,
  },
  'beast-leg-front': {
    poly: [
      [345, 1050], [378, 1300], [368, 1600], [390, 1740], [400, 1815],
      [558, 1850], [552, 1812], [495, 1605], [482, 1320], [462, 1100],
      [455, 990], [355, 990],
    ],
    pivot: [410, 1035], // hip
    z: 4,
  },
};

const meta = await sharp(SRC).metadata();
const readme = [
  'BEAST TITAN — RIVE RIG KIT',
  '==========================',
  '',
  'Import all PNGs into one Rive artboard. Suggested draw order (bottom to top):',
  '  1. beast-arm-back   2. beast-leg-back   3. beast-torso',
  '  4. beast-leg-front  5. beast-head       6. beast-arm-front',
  '',
  'beast-reference.png is the assembled figure — drop it in at 20% opacity,',
  'arrange the parts over it, then delete it.',
  '',
  "PIVOTS (place each part's origin/bone joint at these local pixel coords):",
  '',
];

for (const [name, part] of Object.entries(PARTS)) {
  const points = part.poly.map(([x, y]) => `${x},${y}`).join(' ');
  const mask = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${meta.width} ${meta.height}" width="${meta.width}" height="${meta.height}">
        <polygon points="${points}" fill="#fff"/>
      </svg>`,
    ),
  )
    .blur(1.5)
    .png()
    .toBuffer();

  const cut = await sharp(SRC).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  // trim to content, add padding
  const { data, info } = await sharp(cut).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  await sharp(cut)
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .extend({
      top: PAD,
      bottom: PAD,
      left: PAD,
      right: PAD,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(OUT, `${name}.png`));

  const localX = part.pivot[0] - minX + PAD;
  const localY = part.pivot[1] - minY + PAD;
  readme.push(
    `${name}.png  →  pivot at (${localX}, ${localY})  [size ${maxX - minX + 1 + 2 * PAD}x${maxY - minY + 1 + 2 * PAD}]`,
  );
  console.log(name, 'ok');
}

await sharp(SRC).png().toFile(join(OUT, 'beast-reference.png'));
readme.push(
  '',
  'NOTES',
  '- Joint areas overlap on purpose: keep rotations subtle (±10-15°) and no',
  '  gaps will ever show. For bigger swings, add a fill shape behind joints.',
  '- Suggested state machine: inputs `walkSpeed` (number), `flinch` (trigger),',
  '  `dead` (bool). Timelines: idle (breathing), walk (gait), flinch, collapse.',
  '- Export as beast.riv — the app wiring takes it from there.',
);
writeFileSync(join(OUT, 'README.txt'), readme.join('\n'));
console.log('kit written to', OUT);
