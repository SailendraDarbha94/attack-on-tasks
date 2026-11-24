import { formatPaise } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { ListRow } from '@/components/controls';
import { Text } from '@/components/text';
import { Button, Card, Empty, ErrorText, Loading, Row, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useDashboard, useSetOpen } from '@/features/desk/api';
import { useStoreOrders } from '@/features/orders/api';
import { StoreOrderCard } from '@/features/orders/store-order-card';
import { friendlyError } from '@/lib/errors';
import { plural } from '@/lib/format';
import { signOut, useSession } from '@/lib/session';

/** The store's home: is it open, how is today going, and which orders are waiting on it. */
export default function StoreHomeScreen() {
  const router = useRouter();
  const { me } = useSession();
  const dashboard = useDashboard();
  const active = useStoreOrders('active');
  const setOpen = useSetOpen();

  if (dashboard.isPending) return <Loading />;
  if (!dashboard.data) {
    return (
      <Screen noHeader>
        <ErrorText>{friendlyError(dashboard.error) ?? 'Could not load your store.'}</ErrorText>
        <Button variant="secondary" label="Sign out" onPress={signOut} />
      </Screen>
    );
  }

  const { store, today, waiting, inProgress, lowStock } = dashboard.data;
  // Show the switch where the tap put it while the request is on its way.
  const isOpen = setOpen.isPending ? setOpen.variables : store.isOpen;
  const fresh = (active.data ?? []).filter((order) => order.status === 'placed');

  const stats = [
    { label: 'Orders today', value: String(today.orders) },
    { label: 'Sales today', value: formatPaise(today.revenuePaise) },
    { label: 'Waiting for you', value: String(waiting), alert: waiting > 0 },
    { label: 'In progress', value: String(inProgress) },
  ];

  return (
    <Screen noHeader>
      <View style={styles.heading}>
        <Text type="overline" color="textSecondary">
          Your store
        </Text>
        <Text type="display">{store.name}</Text>
      </View>

      <Card style={!isOpen && styles.closed}>
        <Row>
          <View style={styles.flex}>
            <Text type="headline">{isOpen ? 'Open for orders' : 'Closed'}</Text>
            <Text type="small" color="textSecondary">
              {isOpen ? 'Customers nearby can order from you now.' : 'Customers can browse but not order.'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Open for orders"
            value={isOpen}
            onValueChange={(value) => setOpen.mutate(value)}
            trackColor={{ true: Colors.successText, false: Colors.elementStrong }}
            thumbColor={Colors.surface}
          />
        </Row>
        <ErrorText>{friendlyError(setOpen.error)}</ErrorText>
      </Card>

      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.stat, stat.alert && styles.statAlert]}>
            <Text type="title" color={stat.alert ? 'warningText' : 'text'}>
              {stat.value}
            </Text>
            <Text type="caption" color={stat.alert ? 'warningText' : 'textSecondary'}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.group}>
        <Text type="heading">New orders</Text>
        <ErrorText>{friendlyError(active.error)}</ErrorText>
        {fresh.length === 0 && (
          <Card>
            <Empty emoji="🛎️" title="Nothing waiting" body="New orders appear here by themselves. No need to refresh." />
          </Card>
        )}
        {fresh.map((order) => (
          <StoreOrderCard key={order.id} order={order} />
        ))}
      </View>

      <View style={styles.group}>
        <ListRow
          icon="receipt"
          title="All orders"
          subtitle={inProgress > 0 ? `${plural(inProgress, 'order')} to pack or send out` : 'Orders in progress and finished'}
          onPress={() => router.push('/store/orders')}
        />
        <ListRow
          icon="shelf"
          title="Shelf"
          subtitle={lowStock > 0 ? `${plural(lowStock, 'product')} running low` : 'Prices, stock and what you sell'}
          onPress={() => router.push('/store/inventory')}
        />
      </View>

      <View style={styles.footer}>
        <Text type="caption" color="textSecondary">
          Signed in as {me?.name}
        </Text>
        <Button variant="text" label="Sign out" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: Spacing.half },
  flex: { flex: 1 },
  closed: { backgroundColor: Colors.warningBackground },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: Spacing.four,
    borderRadius: Radius.card,
    backgroundColor: Colors.element,
    gap: Spacing.half,
  },
  statAlert: { backgroundColor: Colors.warningBackground },
  group: { gap: Spacing.three },
  footer: { alignItems: 'center' },
});
