import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  // Never clean in watch mode: deleting dist/ mid-dev leaves a moment where
  // the apps see index.js without index.d.ts and type-checking fails.
  clean: !options.watch,
}));
