// Titan pose generator: takes the chart cutouts (run chart-cut.mjs first),
// places each figure on a 960x1440 canvas, and derives the four poses with
// prop/effect overlays. Idempotent — rerun any time placements change.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? './out2';
mkdirSync(join(OUT, 'titans'), { recursive: true });

const W = 960;
const H = 1440;

// place the cutout on a 2:3 canvas, bottom-anchored
async function onCanvas(buf, { scale = 1 } = {}) {
  const meta = await sharp(buf).metadata();
  const maxW = Math.round(W * 0.86 * scale);
  const maxH = Math.round(H * 0.94 * scale);
  const s = Math.min(maxW / meta.width, maxH / meta.height);
  const rw = Math.round(meta.width * s);
  const rh = Math.round(meta.height * s);
  const resized = await sharp(buf).resize(rw, rh).png().toBuffer();
  const margin = Math.round(H * 0.03);
  const cw = Math.max(W, rw);
  const ch = Math.max(H, rh + margin);
  return sharp({
    create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left: Math.round((cw - rw) / 2), top: ch - margin - rh }])
    .png()
    .toBuffer()
    .then((big) =>
      sharp(big)
        .extract({ left: Math.round((cw - W) / 2), top: ch - H, width: W, height: H })
        .png()
        .toBuffer(),
    );
}

const svg = (inner) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="emberGlow">
      <stop offset="0%" stop-color="#FFB35C" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#FF7A1A" stop-opacity="0"/>
    </radialGradient>
  </defs>${inner}</svg>`);

// --- effect layers (coordinates in 960x1440 canvas space) ---
const cigar = (x, y, angle, plume, s = 1) => `
  <g transform="rotate(${angle} ${x} ${y}) translate(${x * (1 - s)} ${y * (1 - s)}) scale(${s})">
    <rect x="${x}" y="${y - 9}" width="86" height="18" rx="8" fill="#5C4630"/>
    <rect x="${x}" y="${y - 9}" width="14" height="18" rx="6" fill="#C8A15E"/>
    <circle cx="${x + 88}" cy="${y}" r="26" fill="url(#emberGlow)"/>
    <circle cx="${x + 88}" cy="${y}" r="10" fill="#FF9B3D"/>
  </g>
  ${
    plume
      ? `<path d="M ${x + 96} ${y - 24} C ${x + 128} ${y - 90} ${x + 70} ${y - 130} ${x + 110} ${y - 200} C ${x + 142} ${y - 260} ${x + 100} ${y - 300} ${x + 124} ${y - 360}" stroke="#93A696" stroke-opacity="0.5" stroke-width="16" fill="none" stroke-linecap="round"/>
         <path d="M ${x + 70} ${y - 30} C ${x + 92} ${y - 80} ${x + 60} ${y - 110} ${x + 80} ${y - 160}" stroke="#93A696" stroke-opacity="0.3" stroke-width="11" fill="none" stroke-linecap="round"/>`
      : `<path d="M ${x + 92} ${y - 26} C ${x + 116} ${y - 80} ${x + 76} ${y - 110} ${x + 100} ${y - 170} C ${x + 118} ${y - 214} ${x + 100} ${y - 236} ${x + 110} ${y - 270}" stroke="#93A696" stroke-opacity="0.35" stroke-width="12" fill="none" stroke-linecap="round"/>`
  }`;

const bottle = (x, y, angle, raised, s = 1) => `
  <g transform="rotate(${angle} ${x} ${y}) translate(${x * (1 - s)} ${y * (1 - s)}) scale(${s})">
    <rect x="${x - 27}" y="${y - 150}" width="54" height="30" rx="8" fill="#6B4A33"/>
    <rect x="${x - 22}" y="${y - 128}" width="44" height="70" rx="14" fill="#47222B"/>
    <rect x="${x - 55}" y="${y - 66}" width="110" height="230" rx="30" fill="#47222B"/>
    <rect x="${x - 55}" y="${y}" width="110" height="164" rx="30" fill="#7E3644"/>
    <rect x="${x - 40}" y="${y - 46}" width="16" height="190" rx="8" fill="#FFFFFF" opacity="0.1"/>
  </g>
  ${
    raised
      ? `<path d="M ${x + 40} ${y - 160} q 30 -40 18 -84" stroke="#7E3644" stroke-opacity="0.7" stroke-width="10" fill="none" stroke-linecap="round"/>
         <circle cx="${x + 70}" cy="${y - 250}" r="9" fill="#7E3644" opacity="0.7"/>`
      : ''
  }`;

const steamBurst = (cx, cy) => {
  const rays = [
    [cx, cy, cx + 150, cy - 130],
    [cx + 10, cy + 20, cx + 180, cy - 10],
    [cx, cy + 40, cx + 150, cy + 90],
    [cx - 15, cy - 15, cx + 80, cy - 170],
    [cx + 10, cy + 30, cx + 190, cy + 60],
  ]
    .map(
      ([a, b, c, d]) =>
        `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#E7EFE8" stroke-opacity="0.85" stroke-width="13" stroke-linecap="round"/>`,
    )
    .join('');
  return `${rays}
    <line x1="70" y1="${cy}" x2="220" y2="${cy}" stroke="#93A696" stroke-opacity="0.3" stroke-width="10" stroke-linecap="round"/>
    <line x1="100" y1="${cy + 130}" x2="240" y2="${cy + 130}" stroke="#93A696" stroke-opacity="0.2" stroke-width="10" stroke-linecap="round"/>`;
};

const dyingSteam = () => `
  <path d="M 330 470 C 350 400 315 370 340 300 C 358 250 340 230 352 190" stroke="#C9D6CC" stroke-opacity="0.4" stroke-width="15" fill="none" stroke-linecap="round"/>
  <path d="M 600 490 C 620 430 590 400 610 340" stroke="#C9D6CC" stroke-opacity="0.3" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M 470 260 C 488 210 462 190 478 140" stroke="#C9D6CC" stroke-opacity="0.28" stroke-width="12" fill="none" stroke-linecap="round"/>`;

async function rotateOnCanvas(buf, deg) {
  const rotated = await sharp(buf)
    .rotate(deg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const m = await sharp(rotated).metadata();
  return sharp(rotated)
    .extract({
      left: Math.max(0, Math.round((m.width - W) / 2)),
      top: Math.max(0, Math.round((m.height - H) / 2)),
      width: Math.min(W, m.width),
      height: Math.min(H, m.height),
    })
    .png()
    .toBuffer();
}

async function poses(cutBuf, name, propFor) {
  const stack = async (baseBuf, { under = '', over = '' }, file) => {
    const layers = [];
    if (under) layers.push({ input: svg(under) });
    layers.push({ input: baseBuf });
    if (over) layers.push({ input: svg(over) });
    await sharp({
      create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(layers)
      .png()
      .toFile(join(OUT, 'titans', file));
  };

  const idleBase = await onCanvas(cutBuf);
  await stack(idleBase, propFor('idle'), `${name}-idle.png`);

  const grownBase = await sharp(await onCanvas(cutBuf, { scale: 1.08 }))
    .modulate({ brightness: 1.07, saturation: 1.12 })
    .png()
    .toBuffer();
  await stack(grownBase, propFor('grown'), `${name}-grown.png`);

  const flinchBase = await rotateOnCanvas(
    await sharp(idleBase).modulate({ saturation: 0.85 }).png().toBuffer(),
    6,
  );
  await stack(flinchBase, propFor('flinch'), `${name}-flinch.png`);

  const dyingBase = await rotateOnCanvas(
    await sharp(await onCanvas(cutBuf, { scale: 0.94 }))
      .modulate({ brightness: 0.68, saturation: 0.55 })
      .png()
      .toBuffer(),
    -5,
  );
  const d = propFor('dying');
  await stack(dyingBase, { under: d.under ?? '', over: (d.over ?? '') + dyingSteam() }, `${name}-dying.png`);
}

const beast = await sharp('./chart/smoke.png').png().toBuffer();
const attack = await sharp('./chart/drink.png').png().toBuffer();
const female = await sharp('./chart/chore.png').png().toBuffer();

// Beast Titan = smoking titan. Small head top-centre; cigar scaled down.
await poses(beast, 'smoke', (pose) => {
  if (pose === 'dying') return { over: '' };
  if (pose === 'grown') return { over: cigar(497, 128, -8, true, 0.62) };
  const fx = pose === 'flinch' ? steamBurst(700, 330) : '';
  return { over: cigar(497, 128, -8, false, 0.62) + fx };
});

// Attack Titan = drinking titan. Bottle gripped at the side fist, under the figure.
await poses(attack, 'drink', (pose) => {
  if (pose === 'dying') return { over: '' };
  const fx = pose === 'flinch' ? steamBurst(640, 480) : '';
  return { under: bottle(296, 852, -8, false, 0.8), over: fx };
});

// Female Titan = chore titan. No prop.
await poses(female, 'chore', () => ({ over: '' }));

console.log('titan poses done');
