import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

// Opening a deeper screen directly (a link, a reload) still puts the
// dashboard underneath it, so there is always a way back.
export const unstable_settings = { anchor: 'index' };

export default function StoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Store' }} />
      <Stack.Screen name="orders" options={{ title: 'Orders' }} />
      <Stack.Screen name="inventory" options={{ title: 'Shelf' }} />
      <Stack.Screen name="add" options={{ title: 'Add products' }} />
      <Stack.Screen name="item/[id]" options={{ title: 'Product' }} />
    </Stack>
  );
}
