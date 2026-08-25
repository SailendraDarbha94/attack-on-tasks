import { useEffect } from 'react';
import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ImpactCeremony } from '@/components/ImpactCeremony';
import { palette } from '@/constants/theme';
import { onNotificationTap } from '@/notifications/scheduler';
import { useGame } from '@/state/game';

const SkyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    primary: palette.ice,
    notification: palette.flare,
  },
};

export default function RootLayout() {
  const hydrate = useGame((s) => s.hydrate);

  useEffect(() => {
    hydrate().catch((err) => console.error('hydrate failed', err));
    return onNotificationTap(() => router.push('/observation'));
  }, [hydrate]);

  return (
    <ThemeProvider value={SkyTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
        }}
      />
      <ImpactPortal />
    </ThemeProvider>
  );
}

// One mount point above every screen: an Earthfall plays wherever you are,
// whether it landed on an answer just now or was materialized on open.
function ImpactPortal() {
  const pendingImpact = useGame((s) => s.pendingImpact);
  const arkKeeper = useGame((s) => s.settings.arkKeeper);
  const acknowledgeImpact = useGame((s) => s.acknowledgeImpact);

  if (!pendingImpact) return null;
  return (
    <ImpactCeremony
      key={pendingImpact.ts}
      habit={pendingImpact.habit}
      keeper={arkKeeper}
      souls={pendingImpact.ark}
      from={pendingImpact.before}
      onDone={acknowledgeImpact}
    />
  );
}
