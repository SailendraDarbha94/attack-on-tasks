// Scene overlay: a radial edge darkening that pulls the eye to the star.
// Everything else in the sky is drawn in Skia at runtime.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? './scenery';
mkdirSync(OUT, { recursive: true });

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

await sharp(Buffer.from(vignetteSvg())).resize(780, 1560).png().toFile(join(OUT, 'vignette.png'));
console.log('vignette rendered');
