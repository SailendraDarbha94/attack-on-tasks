// Cut the three titans out of the size-comparison chart:
// white background + ruled horizontal lines (gray + one red) all become alpha.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '/Users/batman/Desktop/titans.png';
const OUT = './chart';
mkdirSync(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
console.log('chart', meta.width, 'x', meta.height);

// crop windows [left, width] as fractions — figures left/middle/right
const windows = {
  drink: [0.0, 0.27],
  chore: [0.24, 0.4],
  smoke: [0.6, 0.4],
};

function cutout(data, w, h) {
  const at = (x, y) => (y * w + x) * 4;
  const isWhite = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mn > 225 && mx - mn < 22;
  };
  const whiteOrOut = (x, y) => x < 0 || y < 0 || x >= w || y >= h || isWhite(at(x, y));
  const isLineColor = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 14) return true; // neutral gray of any luminance
    return r > 150 && g < 150 && b < 150 && r - Math.max(g, b) > 40; // red rule
  };

  // 1. structural ruled-line removal: line pixels live on white background
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = at(x, y);
      if (data[i + 3] === 0 || isWhite(i)) continue;
      if (isLineColor(i) && whiteOrOut(x, y - 3) && whiteOrOut(x, y + 3)) data[i + 3] = 0;
      else {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const redLine = r > 180 && Math.abs(g - b) < 14 && r - g > 60 && g > 90;
        if (redLine && (whiteOrOut(x, y - 3) || whiteOrOut(x, y + 3))) data[i + 3] = 0;
      }
    }
  }

  // 2. flood-fill the white background from the borders
  const seen = new Uint8Array(w * h);
  const queue = [];
  for (let x = 0; x < w; x++) queue.push(x, x + (h - 1) * w);
  for (let y = 0; y < h; y++) queue.push(y * w, y * w + w - 1);
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

  // 3. keep only the largest connected component (drops neighbours' arms)
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
      const x = p % w, y = (p / w) | 0;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h) continue;
        const qx = q % w;
        if (Math.abs(qx - x) > 1) continue;
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

  // 3b. enclosed white pockets: clear white components bigger than glints
  const wlabel = new Int32Array(w * h).fill(-1);
  let wnext = 0;
  for (let start = 0; start < w * h; start++) {
    const pw = (i) => { const r = data[i], g = data[i+1], b = data[i+2]; const mx = Math.max(r,g,b), mn = Math.min(r,g,b); return mn > 195 && mx - mn < 28; };
    if (wlabel[start] !== -1 || data[start * 4 + 3] <= 8 || !pw(start * 4)) continue;
    const members = [start];
    const stack = [start];
    wlabel[start] = wnext;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h) continue;
        if (Math.abs((q % w) - x) > 1) continue;
        if (wlabel[q] === -1 && data[q * 4 + 3] > 8 && pw(q * 4)) {
          wlabel[q] = wnext;
          stack.push(q);
          members.push(q);
        }
      }
    }
    if (members.length > 150) for (const p of members) data[p * 4 + 3] = 0;
    wnext++;
  }

  // 4. feather the edge
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (data[p * 4 + 3] === 0) continue;
      if (
        data[(p - 1) * 4 + 3] === 0 ||
        data[(p + 1) * 4 + 3] === 0 ||
        data[(p - w) * 4 + 3] === 0 ||
        data[(p + w) * 4 + 3] === 0
      ) {
        data[p * 4 + 3] = Math.min(data[p * 4 + 3], 140);
      }
    }
  }
  return data;
}

for (const [name, [lf, wf]] of Object.entries(windows)) {
  const left = Math.round(meta.width * lf);
  const width = Math.round(meta.width * wf);
  const { data, info } = await sharp(SRC)
    .extract({ left, top: 0, width: Math.min(width, meta.width - left), height: meta.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cleaned = cutout(data, info.width, info.height);

  // trim to content
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (cleaned[(y * info.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  await sharp(cleaned, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toFile(join(OUT, `${name}.png`));
  console.log(name, 'cut', maxX - minX + 1, 'x', maxY - minY + 1);
}
