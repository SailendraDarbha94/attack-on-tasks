import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Image as SkiaImage,
  LinearGradient,
  Path,
  RadialGradient,
  useImage,
  vec,
  type SkPoint,
} from '@shopify/react-native-skia';

import { palette } from '@/constants/theme';
import { BODY_SPRITES } from './bodyImages.gen';
import { BARE_NUCLEUS_MASS, MAX_MASS } from '@/engine/system';
import type { HabitId } from '@/engine/types';

// The star sits just off the bottom-left corner of every frame. Everything a
// comet does follows from that one vector: the tail points away from it, the
// jets point back at it, and the lit limb faces it.
const STAR = { x: -0.06, y: 1.06 };
const NUCLEUS = { x: 0.34, y: 0.63 };

const TINT: Record<HabitId, string> = { smoke: palette.flare, drink: palette.ice };

// A nucleus is a rock, not a ball. Fixed lumps, and the vertices are pushed
// off their even spacing too — evenly spaced lumps just read as a polygon.
const LUMPS = [1, 0.9, 1.08, 0.94, 1.12, 0.88, 1.02, 1.1, 0.92, 1.06, 0.87, 1.09, 0.96];

// Ashfall's dust lags behind: each streak is shorter, softer and far more bent
// than the one before it, and the fan that opens between them is the curve.
const DUST = [
  { len: 1, bow: 0.1, width: 0.03, alpha: 0.62, amber: false },
  { len: 0.95, bow: 0.24, width: 0.038, alpha: 0.48, amber: true },
  { len: 0.86, bow: 0.4, width: 0.034, alpha: 0.36, amber: true },
  { len: 0.74, bow: 0.58, width: 0.028, alpha: 0.26, amber: false },
  { len: 0.6, bow: 0.78, width: 0.022, alpha: 0.18, amber: true },
];

// Stillwater's ion tail is ruler-straight — thin parallel filaments, no bow,
// offset far enough apart that they stay separate all the way out.
const ION = [
  { off: 0, len: 1, bow: 0, width: 0.014, alpha: 0.8 },
  { off: -1.6, len: 0.9, bow: 0, width: 0.008, alpha: 0.5 },
  { off: 1.8, len: 0.95, bow: 0, width: 0.009, alpha: 0.55 },
];

const ION_SPREAD = 0.03; // filament offset unit, as a fraction of the short side
const STREAK_ROOM = 0.07; // widest a streak ever sits off the axis, same units
const RIBBON_STEPS = 18;
const SPAN_SAMPLES = [0.4, 0.65, 0.85, 1];

export interface CometGlyphProps {
  habit: HabitId;
  mass: number;
  width: number;
  height: number;
  /** volatiles spent: nucleus and jets only. Defaults from mass. */
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function CometGlyph({ habit, mass, width, height, bare, style }: CometGlyphProps) {
  const spent = bare ?? mass <= BARE_NUCLEUS_MASS;
  const dust = habit === 'smoke';
  const g = useMemo(
    () => layout(width, height, mass, dust ? DUST : ION),
    [width, height, mass, dust],
  );
  const tint = TINT[habit];
  const rockImg = useImage(BODY_SPRITES.asteroid.source);
  const rockSide = (2 * g.rockR * 1.06) / BODY_SPRITES.asteroid.discFrac;

  if (!width || !height) return null;

  return (
    <Canvas pointerEvents="none" style={[{ width, height }, style]}>
      {!spent && (
        <Group>
          {dust
            ? DUST.map((s, i) => {
                const len = g.tail * s.len;
                const color = s.amber ? palette.amber : palette.flare;
                return (
                  <Streak
                    key={i}
                    path={ribbon(g.nx, g.ny, g.ux, g.uy, len, s.bow, (t) =>
                      g.min * s.width * (0.4 + 0.6 * t) * Math.pow(1 - t, 0.9),
                    )}
                    from={vec(g.nx, g.ny)}
                    to={tipOf(g, len, s.bow)}
                    color={color}
                    alpha={s.alpha * (0.7 + 0.55 * g.m)}
                    blur={g.min * 0.035}
                  />
                );
              })
            : ION.map((s, i) => {
                const len = g.tail * s.len;
                const off = g.min * ION_SPREAD * s.off;
                const ox = g.nx + g.px * off;
                const oy = g.ny + g.py * off;
                return (
                  <Streak
                    key={i}
                    path={ribbon(ox, oy, g.ux, g.uy, len, 0, (t) =>
                      g.min * s.width * Math.pow(1 - t, 0.55),
                    )}
                    from={vec(ox, oy)}
                    to={vec(ox + g.ux * len, oy + g.uy * len)}
                    color={palette.ice}
                    alpha={s.alpha * (0.7 + 0.55 * g.m)}
                    blur={g.min * 0.012}
                  />
                );
              })}
        </Group>
      )}

      {!spent && (
        <Group>
          <Circle cx={g.nx} cy={g.ny} r={g.coma}>
            <RadialGradient
              c={vec(g.nx, g.ny)}
              r={g.coma}
              colors={[withAlpha(tint, 0.5), withAlpha(tint, 0.16), withAlpha(tint, 0)]}
              positions={[0, 0.45, 1]}
            />
            <BlurMask blur={g.coma * 0.16} style="normal" />
          </Circle>
          <Circle cx={g.nx} cy={g.ny} r={g.coma * 0.3} color={withAlpha(tint, 0.35)}>
            <BlurMask blur={g.coma * 0.3} style="normal" />
          </Circle>
        </Group>
      )}

      {spent &&
        g.jets.map((j, i) => (
          <Streak
            key={i}
            path={ribbon(g.nx, g.ny, j.dx, j.dy, j.len, 0, (t) =>
              g.min * 0.011 * Math.pow(1 - t, 0.5),
            )}
            from={vec(g.nx, g.ny)}
            to={vec(g.nx + j.dx * j.len, g.ny + j.dy * j.len)}
            color={palette.text}
            alpha={0.85}
            blur={g.min * 0.008}
          />
        ))}

      <Group>
        {rockImg ? (
          <SkiaImage
            image={rockImg}
            x={g.nx - rockSide / 2}
            y={g.ny - rockSide / 2}
            width={rockSide}
            height={rockSide}
            fit="fill"
          />
        ) : (
          <Path path={g.rock} color="#0D111C" />
        )}
        {/* the comet's own light washes its nucleus */}
        <Circle
          cx={g.nx}
          cy={g.ny}
          r={g.rockR * 1.02}
          color={withAlpha(spent ? palette.ice : tint, spent ? 0.3 : 0.22)}
          blendMode="plus"
        />
        {/* the limb turned toward the star */}
        <Circle
          cx={g.nx - g.ux * g.rockR * 0.5}
          cy={g.ny - g.uy * g.rockR * 0.5}
          r={g.rockR * 0.34}
          color={withAlpha(spent ? palette.ice : tint, 0.5)}
        >
          <BlurMask blur={g.rockR * 0.45} style="normal" />
        </Circle>
      </Group>
    </Canvas>
  );
}

function Streak({
  path,
  from,
  to,
  color,
  alpha,
  blur,
}: {
  path: string;
  from: SkPoint;
  to: SkPoint;
  color: string;
  alpha: number;
  blur: number;
}) {
  return (
    <Path path={path}>
      <LinearGradient
        start={from}
        end={to}
        colors={[withAlpha(color, alpha), withAlpha(color, alpha * 0.45), withAlpha(color, 0)]}
        positions={[0, 0.45, 1]}
      />
      <BlurMask blur={blur} style="normal" />
    </Path>
  );
}

type Streaks = readonly { len: number; bow: number }[];

interface Geometry {
  nx: number;
  ny: number;
  ux: number;
  uy: number;
  px: number;
  py: number;
  min: number;
  m: number;
  tail: number;
  coma: number;
  rock: string;
  rockR: number;
  jets: { dx: number; dy: number; len: number }[];
}

function layout(width: number, height: number, mass: number, profile: Streaks): Geometry {
  const min = Math.min(width, height);
  // written this way so an unreadable mass falls to 0 rather than NaN — a NaN
  // coordinate poisons every path in the frame
  const m = mass > 0 ? Math.min(1, mass / MAX_MASS) : 0;
  const nx = NUCLEUS.x * width;
  const ny = NUCLEUS.y * height;

  const ax = nx - STAR.x * width;
  const ay = ny - STAR.y * height;
  const alen = Math.hypot(ax, ay) || 1;
  const ux = ax / alen;
  const uy = ay / alen;
  const px = -uy;
  const py = ux;

  // The longest tail this frame can hold. Every streak is walked at its own
  // bow, because running out and bowing sideways push toward the same edge —
  // bounding them separately lets a curved streak escape a narrow frame.
  const pad = Math.max(1, min * (0.02 + STREAK_ROOM));
  let span = Infinity;
  for (const s of profile) {
    for (const t of SPAN_SAMPLES) {
      const along = s.len * t;
      const side = s.bow * s.len * t * t;
      span = Math.min(
        span,
        reach(nx, ny, ux * along + px * side, uy * along + py * side, width, height, pad),
      );
    }
  }
  const tail = Number.isFinite(span) ? span * (0.16 + 0.9 * m) : 0;

  const room = Math.min(nx, ny, width - nx, height - ny);
  const coma = Math.min(min * (0.07 + 0.32 * m), room * 0.7);

  const rockR = min * (0.055 + 0.05 * m);
  const jetAngle = Math.atan2(-uy, -ux);
  const jets = [-1, 1].map((side) => {
    const a = jetAngle + side * 0.36;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    return { dx, dy, len: Math.min(min * 0.3, reach(nx, ny, dx, dy, width, height, pad)) };
  });

  return { nx, ny, ux, uy, px, py, min, m, tail, coma, rock: lumpyPath(nx, ny, rockR), rockR, jets };
}

/** How far a ray from (x,y) can travel before it leaves the padded frame. */
function reach(
  x: number,
  y: number,
  dx: number,
  dy: number,
  width: number,
  height: number,
  pad: number,
): number {
  const tx = dx > 0 ? (width - pad - x) / dx : dx < 0 ? (pad - x) / dx : Infinity;
  const ty = dy > 0 ? (height - pad - y) / dy : dy < 0 ? (pad - y) / dy : Infinity;
  return Math.max(0, Math.min(tx, ty));
}

function lumpyPath(cx: number, cy: number, r: number): string {
  const n = LUMPS.length;
  const points = LUMPS.map((lump, i) => {
    const a = ((i + (LUMPS[(i + 5) % n] - 0.98) * 1.6) / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * r * lump;
    const y = cy + Math.sin(a) * r * lump * 0.86;
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `M ${points[0]} L ${points.slice(1).join(' L ')} Z`;
}

// A tapering ribbon: one centre line bowed sideways by `bow`, walked up one
// edge and back down the other. Filled paths taper; stroked ones cannot.
function ribbon(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  len: number,
  bow: number,
  half: (t: number) => number,
): string {
  const px = -dy;
  const py = dx;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= RIBBON_STEPS; i++) {
    const t = i / RIBBON_STEPS;
    const side = bow * len * t * t;
    const cx = ox + dx * len * t + px * side;
    const cy = oy + dy * len * t + py * side;
    const tx = dx + px * 2 * bow * t;
    const ty = dy + py * 2 * bow * t;
    const tl = Math.hypot(tx, ty) || 1;
    const w = half(t);
    const wx = (-ty / tl) * w;
    const wy = (tx / tl) * w;
    left.push(`${(cx + wx).toFixed(2)} ${(cy + wy).toFixed(2)}`);
    right.push(`${(cx - wx).toFixed(2)} ${(cy - wy).toFixed(2)}`);
  }
  right.reverse();
  return `M ${left[0]} L ${[...left.slice(1), ...right].join(' L ')} Z`;
}

function tipOf(g: Geometry, len: number, bow: number): SkPoint {
  return vec(g.nx + g.ux * len + g.px * bow * len, g.ny + g.uy * len + g.py * bow * len);
}

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
