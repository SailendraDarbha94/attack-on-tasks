/**
 * Nukkad's colours, type and spacing. Warm paper surfaces, near-black ink,
 * and tomato red for anything that acts. The app is light-only for now.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#1A1613',
  textSecondary: '#6E655C',
  textTertiary: '#A69C91',
  /** The page behind everything. */
  background: '#FFFBF4',
  /** Cards and sheets on the page. */
  surface: '#FFFFFF',
  /** Fields, tiles and quiet buttons. */
  element: '#F6EFE3',
  /** Pressed and unselected-control states. */
  elementStrong: '#EDE3D2',
  /** Hairlines and outlines. */
  line: '#EBE2D3',
  /** Buttons, links and anything else that acts. */
  primary: '#E8472B',
  primaryPressed: '#CC3A20',
  primarySoft: '#FFE9E3',
  onPrimary: '#FFFFFF',
  /** Selected chips and the floating cart bar. */
  ink: '#1A1613',
  onInk: '#FFFFFF',
  /** Offer tags. */
  mango: '#FFC83D',
  onMango: '#3D2A00',
  successText: '#17753F',
  successBackground: '#E1F5E8',
  warningText: '#8F5200',
  warningBackground: '#FFF1D0',
  dangerText: '#B42318',
  dangerBackground: '#FDE7E4',
  infoText: '#3D4FB8',
  infoBackground: '#E6E9FB',
} as const;

export type Color = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
} as const;

export const Radius = {
  /** Badges and small tiles. */
  small: 8,
  /** Fields, buttons and rows. */
  field: 14,
  /** Cards. */
  card: 18,
  /** Sheets and big panels. */
  sheet: 26,
  pill: 999,
} as const;

export const Shadows = {
  card: '0px 1px 2px rgba(26, 22, 19, 0.06), 0px 4px 14px rgba(26, 22, 19, 0.05)',
  floating: '0px 10px 28px rgba(26, 22, 19, 0.28)',
} as const;

/** On a tablet or in a browser the app stays a phone-width column. */
export const MaxContentWidth = 560;
