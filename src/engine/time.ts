// Time constants live in a leaf module with no imports, so every other
// engine module can use them at init time. (schedule <-> system once formed
// an import cycle; a module-level `24 * HOUR` evaluated to NaN whenever the
// import order ran the wrong way round. Never again.)
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
