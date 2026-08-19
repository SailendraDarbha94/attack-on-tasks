import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  BlurMask,
  Canvas,
  Image as SkiaImage,
  LinearGradient,
  Path,
  useImage,
  vec,
  type SkPoint,
} from '@shopify/react-native-skia';

import { palette } from '@/constants/theme';
import { BODY_SPRITES } from './bodyImages.gen';

// Every asteroid flies the same heading: inbound toward the lower-left, where
// home sits in the frame, so the motion streak trails away up-right. The
// parent decides where on the plane the glyph goes; the glyph only agrees
// about direction.
const HEAD = { x: -0.615, y: 0.788 };
const NUCLEUS = { x: 0.38, y: 0.6 };
const RIBBON_STEPS = 10;

const STREAK = '#A7ADBD';

export interface AsteroidGlyphProps {
  size: number;
  /** 0..1, how near the deadline looms. More urgency, more streak. */
  urgency?: number;
  style?: StyleProp<ViewStyle>;
}

export function AsteroidGlyph({ size, urgency = 0, style }: AsteroidGlyphProps) {
  const u = Math.min(1, Math.max(0, urgency));
  const g = useMemo(() => layout(size, u), [size, u]);
  const rock = useImage(BODY_SPRITES.asteroid.source);
  // OSIRIS-REx's Bennu, masked offline; the sprite's bright box is the rock
  const rockSide = (g.rockR * 2.3) / BODY_SPRITES.asteroid.discFrac;

  if (!size) return null;

  return (
    <Canvas pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Path path={g.trail}>
        <LinearGradient
          start={g.trailFrom}
          end={g.trailTo}
          colors={[
            withAlpha(STREAK, g.trailAlpha),
            withAlpha(STREAK, g.trailAlpha * 0.4),
            withAlpha(STREAK, 0),
          ]}
          positions={[0, 0.4, 1]}
        />
        <BlurMask blur={g.blur} style="normal" />
      </Path>
      {/* past 0.8 the air itself starts to notice */}
      {g.hot > 0 && (
        <Path path={g.hotTrail}>
          <LinearGradient
            start={g.trailFrom}
            end={g.trailTo}
            colors={[
              withAlpha(palette.flare, 0.38 * g.hot),
              withAlpha(palette.flare, 0.16 * g.hot),
              withAlpha(palette.flare, 0),
            ]}
            positions={[0, 0.45, 1]}
          />
          <BlurMask blur={g.blur * 1.4} style="normal" />
        </Path>
      )}

      {rock ? (
        <SkiaImage
          image={rock}
          x={g.nx - rockSide / 2}
          y={g.ny - rockSide / 2}
          width={rockSide}
          height={rockSide}
          fit="fill"
        />
      ) : null}
    </Canvas>
  );
}

interface Geometry {
  nx: number;
  ny: number;
  rockR: number;
  trail: string;
  hotTrail: string;
  trailFrom: SkPoint;
  trailTo: SkPoint;
  trailAlpha: number;
  hot: number;
  blur: number;
}

function layout(size: number, u: number): Geometry {
  const s = Math.max(1, size);
  const nx = NUCLEUS.x * s;
  const ny = NUCLEUS.y * s;
  const rockR = s * 0.21;

  // the streak points opposite the heading — dust left where the rock was
  const dx = -HEAD.x;
  const dy = -HEAD.y;
  const ox = nx + dx * rockR * 0.2;
  const oy = ny + dy * rockR * 0.2;

  const pad = Math.max(1, s * 0.03);
  const room = reach(ox, oy, dx, dy, s, pad);
  const len = room * (0.18 + 0.82 * u);
  const hot = u > 0.8 ? (u - 0.8) / 0.2 : 0;

  return {
    nx,
    ny,
    rockR,
    trail: ribbon(ox, oy, dx, dy, len, (t) => rockR * 0.5 * Math.pow(1 - t, 0.75)),
    hotTrail: ribbon(ox, oy, dx, dy, len * 0.92, (t) => rockR * 0.28 * Math.pow(1 - t, 0.6)),
    trailFrom: vec(ox, oy),
    trailTo: vec(ox + dx * len, oy + dy * len),
    trailAlpha: 0.18 + 0.5 * u,
    hot,
    blur: Math.max(0.5, s * 0.015),
  };
}

/** How far a ray from (x,y) can travel before it leaves the padded box. */
function reach(x: number, y: number, dx: number, dy: number, s: number, pad: number): number {
  const tx = dx > 0 ? (s - pad - x) / dx : dx < 0 ? (pad - x) / dx : Infinity;
  const ty = dy > 0 ? (s - pad - y) / dy : dy < 0 ? (pad - y) / dy : Infinity;
  return Math.max(0, Math.min(tx, ty));
}

// A tapering ribbon: the centre line walked up one edge and back down the
// other, because filled paths taper and stroked ones cannot.
function ribbon(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  len: number,
  half: (t: number) => number,
): string {
  const px = -dy;
  const py = dx;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= RIBBON_STEPS; i++) {
    const t = i / RIBBON_STEPS;
    const cx = ox + dx * len * t;
    const cy = oy + dy * len * t;
    const w = half(t);
    left.push(`${(cx + px * w).toFixed(2)} ${(cy + py * w).toFixed(2)}`);
    right.push(`${(cx - px * w).toFixed(2)} ${(cy - py * w).toFixed(2)}`);
  }
  right.reverse();
  return `M ${left[0]} L ${[...left.slice(1), ...right].join(' L ')} Z`;
}

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
