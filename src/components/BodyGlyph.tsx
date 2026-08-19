import type { StyleProp, ViewStyle } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  useImage,
} from '@shopify/react-native-skia';

import type { Body } from '@/engine/bodies';
import { BODY_SPRITES } from './bodyImages.gen';

// Every world is a NASA photograph now — Mariner, Viking, Voyager, Cassini,
// MESSENGER, LRO, Apollo — masked to a disc offline in tools/art. The app
// still owns the motion; the missions own the light.
const MIN_PT = 20;
const MAX_PT = 56;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Standard luminance-preserving saturation matrix; s=1 is identity.
function saturationMatrix(s: number): number[] {
  const R = 0.213 * (1 - s);
  const G = 0.715 * (1 - s);
  const B = 0.072 * (1 - s);
  return [R + s, G, B, 0, 0, R, G + s, B, 0, 0, R, G, B + s, 0, 0, 0, 0, 0, 1, 0];
}

export interface BodyGlyphProps {
  body: Body;
  size?: number;
  /** 0..1; dims and desaturates. Nothing here ever scales with drift. */
  drift?: number;
  style?: StyleProp<ViewStyle>;
}

export function BodyGlyph({ body, size, drift = 0, style }: BodyGlyphProps) {
  const pt = clamp(size ?? body.glyphPt, MIN_PT, MAX_PT);
  const d = clamp(drift, 0, 1);
  const c = pt / 2;
  const sprite = BODY_SPRITES[body.id];
  const img = useImage(sprite.source);

  // Ringless worlds keep the old disc footprint (71% of the canvas); Saturn's
  // sprite carries its rings, so the whole photograph gets the full footprint.
  const side = Math.min(pt, (pt * 0.71) / sprite.discFrac);
  const discR = (side * sprite.discFrac) / 2;

  return (
    <Canvas pointerEvents="none" style={[{ width: pt, height: pt }, style]}>
      <Group opacity={1 - 0.55 * d}>
        <Group opacity={0.5 - 0.3 * d}>
          <BlurMask blur={pt * 0.07} style="normal" />
          <Circle cx={c} cy={c} r={discR} color={body.color} />
        </Group>
        {img ? (
          <SkiaImage
            image={img}
            x={c - side / 2}
            y={c - side / 2}
            width={side}
            height={side}
            fit="fill"
          >
            {d > 0.01 ? <ColorMatrix matrix={saturationMatrix(1 - 0.6 * d)} /> : null}
          </SkiaImage>
        ) : (
          <Circle cx={c} cy={c} r={discR} color={body.color} opacity={0.35} />
        )}
      </Group>
    </Canvas>
  );
}
