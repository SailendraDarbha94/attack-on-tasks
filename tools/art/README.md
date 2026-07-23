# Art & sound pipeline

Procedural generators for everything in `assets/scenery/`, `assets/sfx/`,
and the titan pose sprites in `assets/titans/`. All deterministic — every
script reproduces the committed assets byte-for-byte (verified).

Setup: `npm install` in this directory (only dependency: sharp).

| Script | Inputs | Outputs |
|---|---|---|
| `gen-sfx.mjs [out]` | none (pure synthesis) | strike/kill/grow `.wav` |
| `gen-scene.mjs [out]` | none (vector art) | forest-bg, tree-branch, trunk, shaft, vignette, leaf `.png` |
| `chart-cut.mjs` | `~/Desktop/titans.png` (size-comparison chart) | `./chart/{drink,chore,smoke}.png` cutouts |
| `process.mjs [out]` | `./chart/*.png` (run chart-cut first) | 12 pose sprites (idle/grown/flinch/dying × 3 titans) |
| `side-cut3.mjs preview\|cut` | `~/Downloads/smoke_titan_side_profile.jpg` | `./side/smoke-walk.png` (Beast walk sprite) |
| `slice-rig.mjs [out]` | `./side/smoke-walk-cut.png` (run side-cut3 first) | Rive rig kit (6 body parts + reference + pivots README) |

After regenerating, copy outputs into the repo:
`cp out2/titans/*.png ../../assets/titans/` etc.

Notes:
- Reference images live outside the repo (Desktop/Downloads) for IP reasons;
  if they're gone, the committed assets are the source of truth.
- `side-cut3.mjs preview` renders the silhouette-trace polygon over the raw
  cut for visual iteration; edit `POLY`, re-preview, then `cut`.
- The original vector "shadow giant" titan generator (pre-character-art) was
  superseded and intentionally not preserved.
