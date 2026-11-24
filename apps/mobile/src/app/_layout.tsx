import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { Button, Notice } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { queryClient } from '@/lib/query';
import { signOut, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

// Refresh data when the app comes back to the foreground, e.g. to pick up a
// new order. Browsers do this on window focus already.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
}

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.line,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootStack />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function RootStack() {
  const { status, me, chosenRole, retry } = useSession();
  const loading = status === 'loading';

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  if (status === 'unreachable') {
    return (
      <Notice title="Can’t reach Nukkad" body="Check your connection and try again. Your cart is safe.">
        <Button label="Try again" onPress={retry} />
        <Button variant="text" label="Sign out" onPress={signOut} />
      </Notice>
    );
  }

  // Only an active account with a role this app serves gets a home screen.
  const role = status === 'signed-in' && me?.status === 'active' ? me.role : null;
  const signedOut = status === 'signed-out';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedOut && chosenRole === null}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={signedOut && chosenRole !== null}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'customer'}>
        <Stack.Screen name="customer" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'store'}>
        <Stack.Screen name="store" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signed-in' && role !== 'customer' && role !== 'store'}>
        <Stack.Screen name="account-unavailable" />
      </Stack.Protected>
    </Stack>
  );
}
