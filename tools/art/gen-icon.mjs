// App identity: a star and three orbits on an ink field.
// Deterministic vector synthesis — same contract as the other generators.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? './icon';
mkdirSync(OUT, { recursive: true });

const INK = '#05070E';

// `bleed` fills the whole square (iOS icons are opaque and get masked);
// `mark` centres the glyph with transparent margins for splash/monochrome.
function iconSvg({ size = 1024, bleed = true, mono = false } = {}) {
  const c = size / 2;
  const u = size / 1024; // scale unit

  const star = mono ? '#FFFFFF' : '#FFF3D0';
  const starMid = mono ? '#FFFFFF' : '#F0B45E';
  const starEdge = mono ? '#FFFFFF' : '#E4703A';
  const ring = mono ? '#FFFFFF' : '#8FC7D6';
  const world = mono ? '#FFFFFF' : '#8FC7D6';

  // three orbits, tilted to read as a plane seen at an angle
  const orbits = [
    { rx: 210, ry: 76, op: 0.85, w: 9 },
    { rx: 322, ry: 116, op: 0.6, w: 8 },
    { rx: 430, ry: 156, op: 0.4, w: 7 },
  ];

  // one world riding the middle orbit, at 10 o'clock
  const wx = c - 322 * u * 0.72;
  const wy = c - 116 * u * 0.68;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="core">
      <stop offset="0%" stop-color="${star}"/>
      <stop offset="45%" stop-color="${starMid}"/>
      <stop offset="100%" stop-color="${starEdge}"/>
    </radialGradient>
    <radialGradient id="corona">
      <stop offset="0%" stop-color="${starEdge}" stop-opacity="${mono ? 0.5 : 0.55}"/>
      <stop offset="60%" stop-color="${starEdge}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${starEdge}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${bleed ? `<rect width="${size}" height="${size}" fill="${INK}"/>` : ''}
  <g transform="rotate(-14 ${c} ${c})">
    ${orbits
      .map(
        (o) =>
          `<ellipse cx="${c}" cy="${c}" rx="${o.rx * u}" ry="${o.ry * u}" fill="none"
             stroke="${ring}" stroke-opacity="${o.op}" stroke-width="${o.w * u}"/>`,
      )
      .join('\n    ')}
    <circle cx="${wx}" cy="${wy}" r="${34 * u}" fill="${world}"/>
  </g>
  <circle cx="${c}" cy="${c}" r="${250 * u}" fill="url(#corona)"/>
  <circle cx="${c}" cy="${c}" r="${96 * u}" fill="url(#core)"/>
</svg>`;
}

const jobs = [
  ['icon.png', { size: 1024, bleed: true }],
  ['splash-icon.png', { size: 512, bleed: false }],
  ['favicon.png', { size: 48, bleed: true }],
  ['android-icon-foreground.png', { size: 432, bleed: false }],
  ['android-icon-monochrome.png', { size: 432, bleed: false, mono: true }],
];

for (const [name, opts] of jobs) {
  await sharp(Buffer.from(iconSvg(opts))).resize(opts.size, opts.size).png().toFile(join(OUT, name));
  console.log(name, opts.size + 'px');
}

// the android adaptive background is a flat ink plate
await sharp({
  create: { width: 432, height: 432, channels: 4, background: { r: 5, g: 7, b: 14, alpha: 1 } },
})
  .png()
  .toFile(join(OUT, 'android-icon-background.png'));
console.log('android-icon-background.png 432px');
