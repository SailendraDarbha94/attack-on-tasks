// Procedural SFX: blade strike, kill (strike + steam), ominous grow.
// Pure synthesis — no samples, no licensing, tweak and re-run freely.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SR = 44100;
const OUT = process.argv[2] ?? './sfx';
mkdirSync(OUT, { recursive: true });

const seconds = (s) => Math.round(s * SR);
const TAU = Math.PI * 2;

// deterministic noise so re-renders are identical
let seed = 1337;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff - 0.5;
};

function synth(lenS, fn) {
  const n = seconds(lenS);
  const buf = new Float64Array(n);
  for (let i = 0; i < n; i++) buf[i] = fn(i / SR, i);
  return buf;
}

function normalize(buf, peak = 0.88) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max === 0) return buf;
  for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] / max) * peak;
  return buf;
}

// simple one-pole lowpass for steam/rumble shaping
function lowpass(buf, alpha) {
  let y = 0;
  const out = new Float64Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    y += alpha * (buf[i] - y);
    out[i] = y;
  }
  return out;
}

function writeWav(name, buf) {
  const n = buf.length;
  const bytes = Buffer.alloc(44 + n * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(36 + n * 2, 4);
  bytes.write('WAVE', 8);
  bytes.write('fmt ', 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20); // PCM
  bytes.writeUInt16LE(1, 22); // mono
  bytes.writeUInt32LE(SR, 24);
  bytes.writeUInt32LE(SR * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  }
  writeFileSync(join(OUT, name), bytes);
  console.log(name, (n / SR).toFixed(2) + 's', (bytes.length / 1024).toFixed(0) + 'KB');
}

const decay = (t, tau) => Math.exp(-t / tau);

// ── strike: metallic shink — noise snap + two detuned downward sweeps + ring
function strikeBuf(lenS = 0.45) {
  return normalize(
    synth(lenS, (t) => {
      const snap = rand() * decay(t, 0.012) * 0.9;
      const f1 = 5200 - 2600 * Math.min(t / 0.12, 1);
      const f2 = 3900 - 1800 * Math.min(t / 0.1, 1);
      const sweep =
        Math.sin(TAU * f1 * t) * decay(t, 0.05) * 0.6 +
        Math.sin(TAU * f2 * (t - 0.012 > 0 ? t - 0.012 : 0)) * decay(Math.max(t - 0.012, 0), 0.07) * 0.5;
      const ring =
        (Math.sin(TAU * 2400 * t) + Math.sin(TAU * 2417 * t)) * 0.5 * decay(t, 0.12) * 0.35;
      return snap + sweep + ring;
    }),
  );
}

// ── kill: the strike, then steam erupts and a low boom rolls under it
function killBuf() {
  const strike = strikeBuf(0.45);
  const len = seconds(0.95);
  const steamRaw = synth(0.95, (t) => rand() * Math.min(t / 0.06, 1) * decay(t, 0.33));
  const steam = lowpass(steamRaw, 0.22);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const boomF = 130 - 75 * Math.min(t / 0.2, 1);
    const boom = Math.sin(TAU * boomF * t) * decay(t, 0.18) * 0.55;
    out[i] = (i < strike.length ? strike[i] * 0.9 : 0) + steam[i] * 0.8 + boom;
  }
  return normalize(out);
}

// ── grow: low ominous swell with a slow tremble
function growBuf() {
  return normalize(
    synth(0.85, (t) => {
      const env = Math.min(t / 0.25, 1) * decay(Math.max(t - 0.3, 0), 0.28);
      const trem = 1 - 0.25 * (0.5 + 0.5 * Math.sin(TAU * 7 * t));
      const f = 46 - 9 * Math.min(t / 0.8, 1);
      return (
        (Math.sin(TAU * f * t) * 0.8 + Math.sin(TAU * f * 1.5 * t) * 0.28) * env * trem +
        rand() * 0.1 * env
      );
    }).map((v, i, arr) => (i > arr.length - 800 ? v * ((arr.length - i) / 800) : v)),
  );
}

writeWav('strike.wav', strikeBuf());
writeWav('kill.wav', killBuf());
writeWav('grow.wav', growBuf());
