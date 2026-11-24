import { matchStore } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton, ListRow } from '@/components/controls';
import { Text } from '@/components/text';
import { Button, Empty, ErrorText, Loading, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addressLine, useAddresses, useDeleteAddress } from '@/features/addresses/api';
import { useCart } from '@/features/cart/store';
import { useDelivery, useStores } from '@/features/delivery/store';
import { friendlyError } from '@/lib/errors';

/** Saved addresses: tap one to deliver the current order there. */
export default function AddressesScreen() {
  const router = useRouter();
  const addresses = useAddresses();
  const remove = useDeleteAddress();
  const stores = useStores();
  const cartStoreId = useCart((state) => state.storeId);
  const addressId = useDelivery((state) => state.addressId);
  const setAddressId = useDelivery((state) => state.setAddressId);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (addresses.isPending) return <Loading />;

  // With a cart, say up front which addresses its store cannot reach.
  const cartStore = stores.data?.find((store) => store.id === cartStoreId);
  const saved = addresses.data ?? [];

  return (
    <Screen>
      <ErrorText>{friendlyError(addresses.error ?? remove.error)}</ErrorText>

      {saved.length === 0 && (
        <Empty emoji="🏠" title="No saved addresses" body="Add one and it will be ready the next time you order." />
      )}

      {saved.map((address) => {
        const outside = cartStore ? !matchStore(cartStore, address).deliverable : false;
        return (
          <View key={address.id} style={styles.item}>
            <ListRow
              icon={address.label === 'Work' ? 'work' : 'home'}
              title={address.label}
              subtitle={`${addressLine(address)}, ${address.pincode}${outside ? `\nOutside ${cartStore?.name}’s delivery area` : ''}`}
              selected={address.id === addressId}
              right={<IconButton icon="trash" label={`Delete ${address.label}`} size={36} onPress={() => setDeleting(address.id)} />}
              onPress={() => {
                setAddressId(address.id);
                router.back();
              }}
            />
            {deleting === address.id && (
              <Row>
                <Text type="small" style={styles.flex}>
                  Delete this address?
                </Text>
                <Button variant="text" label="Keep" onPress={() => setDeleting(null)} />
                <Button
                  variant="danger"
                  label="Delete"
                  busy={remove.isPending}
                  onPress={() =>
                    remove.mutate(address.id, {
                      onSuccess: () => {
                        if (addressId === address.id) setAddressId(null);
                        setDeleting(null);
                      },
                    })
                  }
                />
              </Row>
            )}
          </View>
        );
      })}

      <Button variant="secondary" icon="plus" label="Add a new address" onPress={() => router.push('/customer/address-new')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { gap: Spacing.two },
  flex: { flex: 1 },
});
