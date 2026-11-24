import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

// Opening a deeper screen directly (a link, a reload) still puts the shop
// underneath it, so there is always a way back.
export const unstable_settings = { anchor: 'index' };

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Shop' }} />
      <Stack.Screen name="location" options={{ title: 'Delivery location' }} />
      <Stack.Screen name="cart" options={{ title: 'Your cart' }} />
      <Stack.Screen name="addresses" options={{ title: 'Saved addresses' }} />
      <Stack.Screen name="address-new" options={{ title: 'New address' }} />
      <Stack.Screen name="orders" options={{ title: 'Your orders' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
    </Stack>
  );
}
