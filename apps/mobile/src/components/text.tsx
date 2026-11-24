import { StyleSheet, Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { Colors, Fonts, type Color } from '@/constants/theme';

export type TextType =
  /** 30/36: the opening line of a welcome screen. */
  | 'display'
  /** 24/30: screen headings. */
  | 'title'
  /** 19/24: section headings. */
  | 'heading'
  /** 16/22 semibold: names, row titles, button labels. */
  | 'headline'
  /** 16/22. */
  | 'body'
  /** 14/19: secondary lines and descriptions. */
  | 'small'
  | 'smallBold'
  /** 12/16 medium: labels, badges, small print. */
  | 'caption'
  /** 11/14 bold, spaced capitals: the label over a group. */
  | 'overline';

export type TextProps = NativeTextProps & { type?: TextType; color?: Color };

export function Text({ style, type = 'body', color = 'text', ...rest }: TextProps) {
  return <NativeText style={[{ color: Colors[color] }, styles[type], style]} {...rest} />;
}

const rounded = { fontFamily: Fonts?.rounded, fontWeight: 800 } as const;

const styles = StyleSheet.create({
  display: { ...rounded, fontSize: 30, lineHeight: 36 },
  title: { ...rounded, fontSize: 24, lineHeight: 30 },
  heading: { ...rounded, fontSize: 19, lineHeight: 24 },
  headline: { fontSize: 16, lineHeight: 22, fontWeight: 600 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: 400 },
  small: { fontSize: 14, lineHeight: 19, fontWeight: 400 },
  smallBold: { fontSize: 14, lineHeight: 19, fontWeight: 600 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: 500 },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' },
});
