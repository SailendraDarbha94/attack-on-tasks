# Art & sound pipeline

Deterministic generators for the app's non-drawn assets. Every script
reproduces its committed output byte-for-byte, so the workflow is: run it,
diff the output, commit.

Setup: `npm install` in this directory (only dependency: sharp).

| Script | Inputs | Outputs |
|---|---|---|
| `gen-icon.mjs [out]` | none (vector source) | `icon`, `splash-icon`, `favicon`, the three android icons |
| `gen-scene.mjs [out]` | none (vector source) | `vignette.png` |
| `gen-sfx.mjs [out]` | none (pure synthesis) | `pulse`/`resolve`/`surge` wavs (still named strike/kill/grow on disk) |

Copy outputs into the repo after regenerating:

```bash
node gen-icon.mjs ./out && cp out/*.png ../../assets/images/
```

Notes:
- The eight planet glyphs and both comets are **not** here — they are drawn in
  Skia at runtime from `src/engine/bodies.ts`, so they scale and animate.
- No photographic or licensed source material is used anywhere in this project.
