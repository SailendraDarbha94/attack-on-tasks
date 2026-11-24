import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * SF Symbols on iOS, the matching Material Symbol on Android and the web.
 * The weight only applies on iOS; elsewhere the regular font is used, so the
 * app loads just one icon font.
 */
const ICONS = {
  pin: { ios: 'mappin.and.ellipse', android: 'location_on' },
  locate: { ios: 'location.fill', android: 'my_location' },
  chevronDown: { ios: 'chevron.down', android: 'keyboard_arrow_down' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  receipt: { ios: 'receipt', android: 'receipt_long' },
  person: { ios: 'person.crop.circle', android: 'account_circle' },
  search: { ios: 'magnifyingglass', android: 'search' },
  clock: { ios: 'clock', android: 'schedule' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  check: { ios: 'checkmark', android: 'check' },
  close: { ios: 'xmark', android: 'close' },
  bag: { ios: 'bag', android: 'shopping_bag' },
  store: { ios: 'storefront', android: 'storefront' },
  shelf: { ios: 'shippingbox', android: 'inventory_2' },
  home: { ios: 'house', android: 'home' },
  work: { ios: 'briefcase', android: 'work' },
  cash: { ios: 'banknote', android: 'payments' },
  upi: { ios: 'qrcode', android: 'qr_code_2' },
  phone: { ios: 'phone', android: 'call' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning' },
  trash: { ios: 'trash', android: 'delete' },
  scooter: { ios: 'scooter', android: 'moped' },
} satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color: string;
  weight?: 'regular' | 'semibold' | 'bold';
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 20, color, weight = 'semibold', style }: Props) {
  const { ios, android } = ICONS[name];
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={size}
      tintColor={color}
      weight={weight}
      style={style}
      // Decorative: whatever it sits in carries the label.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
