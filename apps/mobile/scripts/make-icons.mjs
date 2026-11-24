// Draws the app icon, splash mark and favicon from one SVG, so they can be
// regenerated after a colour change:  node scripts/make-icons.mjs
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const out = (name) => fileURLToPath(new URL(`../assets/images/${name}`, import.meta.url));

const TOMATO = '#E8472B';
const MANGO = '#FFC83D';

// A lowercase "n" drawn as one arch, with a dot for the street corner the name means.
const mark = (stroke) => `
  <path d="M 352 716 V 500 a 160 160 0 0 1 320 0 V 716" fill="none" stroke="${stroke}" stroke-width="116" stroke-linecap="round"/>
  <circle cx="730" cy="296" r="50" fill="${MANGO}"/>`;

const svg = (body, background) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${background ?? ''}${body}</svg>`);

const square = `<rect width="1024" height="1024" fill="${TOMATO}"/>`;
const rounded = `<rect width="1024" height="1024" rx="232" fill="${TOMATO}"/>`;
// Android crops the foreground to the middle two thirds, so the mark is drawn smaller there.
const inset = (body) => `<g transform="translate(205 205) scale(0.6)">${body}</g>`;

await sharp(svg(mark('#FFFFFF'), square)).resize(1024).png().toFile(out('icon.png'));
await sharp(svg(inset(mark('#FFFFFF')))).resize(1024).png().toFile(out('android-icon-foreground.png'));
await sharp(svg(mark('#FFFFFF'), rounded)).resize(512).png().toFile(out('splash-icon.png'));
await sharp(svg(mark('#FFFFFF'), rounded)).resize(96).png().toFile(out('favicon.png'));
console.log('Wrote icon.png, android-icon-foreground.png, splash-icon.png and favicon.png');
