import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ListRow } from '@/components/controls';
import { Text } from '@/components/text';
import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { signOut, useSession } from '@/lib/session';

export default function AccountScreen() {
  const router = useRouter();
  const { me } = useSession();
  if (!me) return null;

  return (
    <Screen>
      <Card>
        <Text type="title">{me.name}</Text>
        <View style={styles.details}>
          <Text type="small" color="textSecondary">
            {me.email}
          </Text>
          {me.phone && (
            <Text type="small" color="textSecondary">
              {me.phone}
            </Text>
          )}
        </View>
      </Card>

      <View style={styles.group}>
        <ListRow icon="receipt" title="Your orders" onPress={() => router.push('/customer/orders')} />
        <ListRow icon="home" title="Saved addresses" onPress={() => router.push('/customer/addresses')} />
        <ListRow icon="pin" title="Delivery location" onPress={() => router.push('/customer/location')} />
      </View>

      <Button variant="secondary" label="Sign out" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  details: { gap: Spacing.half },
  group: { gap: Spacing.two },
});
