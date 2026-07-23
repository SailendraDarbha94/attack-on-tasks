// Forest scenery v2: backdrop with real depth (pale far trunks, rim-lit
// near trunks, canopy foliage, ground plane), polished tree + branch,
// narrow parallel light shaft, and an edge vignette.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? './scenery';
mkdirSync(OUT, { recursive: true });

// ── backdrop ──────────────────────────────────────────────────────────────
function backdropSvg() {
  const W = 1170;
  const H = 1560;

  // FAR trunks: LIGHTER than the background — fog eats the dark
  const far = [
    [140, 82, 14, 0.9],
    [370, 110, -18, 0.7],
    [640, 66, 10, 0.85],
    [830, 96, -12, 0.65],
  ]
    .map(
      ([x, w, lean, o]) =>
        `<path d="M ${x} ${H * 0.895} L ${x + lean + w * 0.12} ${H * 0.05} L ${x + lean + w * 0.72} ${H * 0.05} L ${x + w} ${H * 0.895} Z" fill="#1E2E22" opacity="${o}"/>`,
    )
    .join('');

  // NEAR trunks: colossal, dark, with a moonlit rim and root flares
  const near = (x, w, rimSide) => {
    const rimX = rimSide === 'r' ? x + w - 10 : x + 10;
    const roots = '';
    const ridges = [0.3, 0.55, 0.8]
      .map(
        (f) =>
          `<path d="M ${x + w * f} 0 q 10 ${H * 0.5} -6 ${H}" stroke="#060B07" stroke-width="${w * 0.05}" fill="none" opacity="0.6"/>`,
      )
      .join('');
    return `<rect x="${x}" y="0" width="${w}" height="${H}" fill="#0D1710"/>
      ${ridges}
      <path d="M ${rimX} 0 q ${rimSide === 'r' ? 8 : -8} ${H * 0.5} 0 ${H}" stroke="#33503C" stroke-width="8" fill="none" opacity="0.5"/>
      ${roots}`;
  };

  // canopy: hanging foliage masses with lit top edges
  const clump = (cx, cy, r) => `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#13211A"/>
    <circle cx="${cx - r * 0.8}" cy="${cy + r * 0.3}" r="${r * 0.7}" fill="#111E17"/>
    <circle cx="${cx + r * 0.85}" cy="${cy + r * 0.25}" r="${r * 0.65}" fill="#15241C"/>
    <circle cx="${cx - r * 0.25}" cy="${cy + r * 0.55}" r="${r * 0.55}" fill="#101C15"/>
    <circle cx="${cx + r * 0.3}" cy="${cy - r * 0.4}" r="${r * 0.5}" fill="#1C3023" opacity="0.8"/>`;
  const canopy = [
    [90, -30, 150],
    [360, -60, 190],
    [660, -20, 160],
    [950, -50, 200],
    [1160, -10, 140],
  ]
    .map(([x, y, r]) => clump(x, y, r))
    .join('');

  // grass tufts along the horizon
  const tufts = Array.from({ length: 26 }, (_, i) => {
    const x = 30 + i * 44 + (i % 3) * 9;
    const h = 10 + (i % 4) * 5;
    return `<path d="M ${x} ${H * 0.885} q 3 ${-h} 6 0 M ${x + 8} ${H * 0.885} q 2 ${-h * 0.7} 5 0" stroke="#1E3023" stroke-width="3" fill="none" opacity="0.8"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14231A"/>
      <stop offset="45%" stop-color="#101B14"/>
      <stop offset="100%" stop-color="#0A100D"/>
    </linearGradient>
    <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#93A696" stop-opacity="0"/>
      <stop offset="55%" stop-color="#A3BBA0" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#93A696" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0F1811"/>
      <stop offset="100%" stop-color="#070C09"/>
    </linearGradient>
    <filter id="soften" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <g filter="url(#soften)">${far}</g>
  <rect x="0" y="${H * 0.3}" width="${W}" height="${H * 0.34}" fill="url(#fog)" filter="url(#soften)"/>
  <!-- ground plane -->
  <rect x="0" y="${H * 0.885}" width="${W}" height="${H * 0.115}" fill="url(#ground)"/>
  <path d="M 0 ${H * 0.885} Q ${W * 0.22} ${H * 0.878} ${W * 0.45} ${H * 0.886} T ${W} ${H * 0.883}" stroke="#24382B" stroke-width="4" fill="none" opacity="0.5"/>
  ${tufts}
  <!-- colossal near trunks, rooted in the ground -->
  ${near(-120, 320, 'r')}
  ${near(970, 320, 'l')}
  ${canopy}
</svg>`;
}

// ── foreground tree + branch (clumps get lit tops, irregular shapes) ─────
function treeSvg() {
  const W = 1000;
  const H = 760;
  // a fan of pointed leaves drooping from a stem point — not circles
  const oneLeaf = (cx, cy, angle, len, wd, fill, o) =>
    `<path d="M 0 0 Q ${len * 0.38} ${-wd} ${len} 0 Q ${len * 0.38} ${wd} 0 0 Z" fill="${fill}" opacity="${o}"
       transform="translate(${cx} ${cy}) rotate(${angle})"/>
     <path d="M 0 0 L ${len * 0.9} 0" stroke="#0F1B12" stroke-width="1.6" opacity="${o * 0.5}"
       transform="translate(${cx} ${cy}) rotate(${angle})"/>`;
  const leafClump = (cx, cy, r, o = 0.92) => {
    const palette = ['#1B2E20', '#26402C', '#2C4832', '#22381F', '#39573F'];
    let leaves = '';
    const n = 11;
    for (let i = 0; i < n; i++) {
      const angle = 18 + (i / (n - 1)) * 144 + ((i * 37) % 11) - 5; // droop fan, jittered
      const len = r * (0.9 + ((i * 29) % 10) / 22);
      const wd = len * 0.22;
      leaves += oneLeaf(cx, cy - r * 0.2, angle, len, wd, palette[i % palette.length], o);
    }
    // a few catching the light on top
    leaves += oneLeaf(cx, cy - r * 0.25, -12, r * 0.85, r * 0.18, '#39573F', o * 0.9);
    leaves += oneLeaf(cx, cy - r * 0.25, -46, r * 0.7, r * 0.15, '#2C4832', o * 0.85);
    return `<circle cx="${cx}" cy="${cy - r * 0.15}" r="${r * 0.22}" fill="#14231A" opacity="${o}"/>` + leaves;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1A1209"/>
      <stop offset="55%" stop-color="#241A10"/>
      <stop offset="100%" stop-color="#170F08"/>
    </linearGradient>
    <linearGradient id="branchBark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3A2A18"/>
      <stop offset="30%" stop-color="#241A10"/>
      <stop offset="100%" stop-color="#150E07"/>
    </linearGradient>
  </defs>

  <path d="M 196 424
    C 360 406 520 438 700 426
    C 810 418 900 404 968 390
    L 972 428
    C 900 448 812 462 706 470
    C 522 484 366 458 204 502 Z" fill="url(#branchBark)"/>
  <path d="M 206 430 C 370 412 530 442 700 431 C 808 424 896 410 960 396" stroke="#4A3520" stroke-width="8" fill="none" opacity="0.8"/>
  <path d="M 560 470 q 10 46 -18 84" stroke="#1D140B" stroke-width="10" fill="none"/>
  <path d="M 830 458 q 14 38 -6 78" stroke="#1D140B" stroke-width="8" fill="none"/>
  ${leafClump(548, 568, 56)}
  ${leafClump(832, 552, 46)}
  ${leafClump(956, 372, 40, 0.85)}
  <path d="M 192 408 C 236 416 254 458 218 508 C 198 486 192 442 192 408 Z" fill="#170F08"/>
</svg>`;
}


// ── full-height trunk the branch grows from (buttons live on this) ───────
function trunkSvg() {
  const W = 300;
  const H = 1600;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1A1209"/>
      <stop offset="55%" stop-color="#241A10"/>
      <stop offset="100%" stop-color="#170F08"/>
    </linearGradient>
  </defs>
  <path d="M 0 0 L 268 0 C 252 400 262 900 248 1300 C 244 1450 254 1550 246 1600 L 0 1600 Z" fill="url(#bark)"/>
  <path d="M 62 0 C 54 420 68 980 56 1600" stroke="#120B05" stroke-width="18" fill="none" opacity="0.7"/>
  <path d="M 128 0 C 136 460 118 1040 130 1600" stroke="#120B05" stroke-width="13" fill="none" opacity="0.55"/>
  <path d="M 192 0 C 184 400 202 940 190 1500" stroke="#120B05" stroke-width="10" fill="none" opacity="0.45"/>
  <path d="M 252 60 q 10 240 -4 520 q -10 300 4 640" stroke="#33503C" stroke-width="7" fill="none" opacity="0.45"/>
  <path d="M 240 640 q 22 60 6 150 q -18 70 4 160" stroke="#2E4A33" stroke-width="16" fill="none" opacity="0.5" stroke-linecap="round"/>
  <path d="M 246 180 q 16 44 2 100" stroke="#2E4A33" stroke-width="11" fill="none" opacity="0.4" stroke-linecap="round"/>
</svg>`;
}

// ── narrow, soft light shaft (use several, all leaning the same way) ─────
function shaftSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 900">
  <defs>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#DFF5E3" stop-opacity="0.26"/>
      <stop offset="60%" stop-color="#CFEBD4" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#CFEBD4" stop-opacity="0"/>
    </linearGradient>
    <filter id="soften" x="-60%" y="-20%" width="220%" height="140%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>
  <path d="M 128 0 L 172 0 L 208 900 L 92 900 Z" fill="url(#beam)" filter="url(#soften)"/>
</svg>`;
}


// ── a single falling leaf sprite ─────────────────────────────────────────
function leafSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 48">
  <path d="M 6 24 Q 30 2 74 20 Q 46 46 6 24 Z" fill="#2E4A33"/>
  <path d="M 6 24 Q 34 14 74 20 Q 42 34 6 24 Z" fill="#3A5C40" opacity="0.75"/>
  <path d="M 6 24 Q 40 20 72 21" stroke="#1B2E20" stroke-width="2.4" fill="none"/>
  <path d="M 6 24 q -5 2 -6 6" stroke="#1B2E20" stroke-width="2.6" fill="none"/>
</svg>`;
}

// ── edge vignette overlay ─────────────────────────────────────────────────
function vignetteSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 1560">
  <defs>
    <radialGradient id="v" cx="50%" cy="46%" r="74%">
      <stop offset="52%" stop-color="#05080A" stop-opacity="0"/>
      <stop offset="100%" stop-color="#05080A" stop-opacity="0.55"/>
    </radialGradient>
  </defs>
  <rect width="780" height="1560" fill="url(#v)"/>
</svg>`;
}

await sharp(Buffer.from(backdropSvg())).resize(1170, 1560).png().toFile(join(OUT, 'forest-bg.png'));
await sharp(Buffer.from(treeSvg())).resize(1000, 760).png().toFile(join(OUT, 'tree-branch.png'));
await sharp(Buffer.from(trunkSvg())).resize(300, 1600).png().toFile(join(OUT, 'trunk.png'));
await sharp(Buffer.from(shaftSvg())).resize(300, 900).png().toFile(join(OUT, 'shaft.png'));
await sharp(Buffer.from(vignetteSvg())).resize(780, 1560).png().toFile(join(OUT, 'vignette.png'));
await sharp(Buffer.from(leafSvg())).resize(80, 48).png().toFile(join(OUT, 'leaf.png'));
console.log('scenery v2 rendered');
