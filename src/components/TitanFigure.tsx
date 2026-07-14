import { View, type ViewStyle } from 'react-native';

import { palette } from '@/constants/theme';
import type { HabitId } from '@/engine/types';

// Placeholder silhouette until the art pass: a looming shape with lantern
// eyes and each boss's telltale prop. Swap for illustrations without
// touching any screen code.
export function TitanFigure({ habit, height = 180 }: { habit: HabitId; height?: number }) {
  const u = height / 180;
  const eye: ViewStyle = {
    width: 9 * u,
    height: 9 * u,
    borderRadius: 5 * u,
    backgroundColor: palette.amber,
    shadowColor: palette.amber,
    shadowOpacity: 0.9,
    shadowRadius: 6 * u,
    shadowOffset: { width: 0, height: 0 },
  };

  return (
    <View style={{ width: 120 * u, height, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: 96 * u,
          height: 118 * u,
          borderTopLeftRadius: 34 * u,
          borderTopRightRadius: 34 * u,
          backgroundColor: palette.raised,
          borderColor: palette.border,
          borderWidth: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 104 * u,
          width: 56 * u,
          height: 62 * u,
          borderRadius: 20 * u,
          backgroundColor: palette.raised,
          borderColor: palette.border,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 10 * u }}>
          <View style={eye} />
          <View style={eye} />
        </View>
        <View
          style={{
            width: 26 * u,
            height: 3 * u,
            backgroundColor: palette.border,
            marginTop: 10 * u,
            borderRadius: 2,
          }}
        />
      </View>
      {habit === 'smoke' ? (
        <View
          style={{
            position: 'absolute',
            bottom: 62 * u,
            right: 0,
            width: 24 * u,
            height: 5 * u,
            borderRadius: 3,
            backgroundColor: '#D8D2C4',
            transform: [{ rotate: '-24deg' }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: -3 * u,
              top: -1.5 * u,
              width: 8 * u,
              height: 8 * u,
              borderRadius: 4 * u,
              backgroundColor: palette.amber,
              shadowColor: palette.amber,
              shadowOpacity: 0.9,
              shadowRadius: 5 * u,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        </View>
      ) : (
        <View
          style={{
            position: 'absolute',
            bottom: 44 * u,
            right: -2 * u,
            width: 18 * u,
            height: 46 * u,
            borderRadius: 6 * u,
            backgroundColor: '#5A2B33',
            borderColor: palette.border,
            borderWidth: 1,
          }}
        />
      )}
    </View>
  );
}
