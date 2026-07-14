import { useEffect } from 'react';
import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/constants/theme';
import { onNotificationTap } from '@/notifications/scheduler';
import { useGame } from '@/state/game';

const ForestTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    primary: palette.steel,
    notification: palette.blood,
  },
};

export default function RootLayout() {
  const hydrate = useGame((s) => s.hydrate);

  useEffect(() => {
    hydrate().catch((err) => console.error('hydrate failed', err));
    return onNotificationTap(() => router.push('/encounter'));
  }, [hydrate]);

  return (
    <ThemeProvider value={ForestTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
        }}
      />
    </ThemeProvider>
  );
}
