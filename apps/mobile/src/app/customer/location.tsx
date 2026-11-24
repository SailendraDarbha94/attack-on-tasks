import { LOCALITIES, formatDistance, pickStore } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ListRow } from '@/components/controls';
import { Text } from '@/components/text';
import { Button, ErrorText, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addressLine, useAddresses } from '@/features/addresses/api';
import { useDelivery, useStores, type DeliverTo } from '@/features/delivery/store';
import { useCurrentLocation } from '@/lib/location';

/** Where to deliver: the phone's position, a saved address, or a neighbourhood from the list. */
export default function LocationScreen() {
  const router = useRouter();
  const stores = useStores();
  const addresses = useAddresses();
  const deliverTo = useDelivery((state) => state.deliverTo);
  const setDeliverTo = useDelivery((state) => state.setDeliverTo);
  const { locate, locating, error } = useCurrentLocation();

  if (stores.isPending) return <Loading />;

  function choose(next: DeliverTo) {
    setDeliverTo(next);
    router.back();
  }

  async function useMyLocation() {
    const coords = await locate();
    if (coords) choose({ kind: 'gps', label: 'Current location', ...coords });
  }

  /** "Nukkad Jayanagar · 1.2 km", or that nobody delivers there yet. */
  function servedBy(point: { lat: number; lng: number }): string {
    const match = pickStore(stores.data ?? [], point);
    if (!match) return '';
    return match.deliverable ? `${match.store.name} · ${formatDistance(match.distanceM)}` : 'Not delivering here yet';
  }

  return (
    <Screen>
      <Button label="Use my current location" icon="locate" onPress={useMyLocation} busy={locating} />
      <ErrorText>{error}</ErrorText>

      {(addresses.data?.length ?? 0) > 0 && (
        <View style={styles.group}>
          <Text type="overline" color="textSecondary">
            Saved addresses
          </Text>
          {addresses.data?.map((address) => (
            <ListRow
              key={address.id}
              icon={address.label === 'Work' ? 'work' : 'home'}
              title={address.label}
              subtitle={`${addressLine(address)}\n${servedBy(address)}`}
              selected={deliverTo?.kind === 'address' && deliverTo.addressId === address.id}
              onPress={() =>
                choose({
                  kind: 'address',
                  label: address.label,
                  area: address.area,
                  pincode: address.pincode,
                  addressId: address.id,
                  lat: address.lat,
                  lng: address.lng,
                })
              }
            />
          ))}
        </View>
      )}

      <View style={styles.group}>
        <Text type="overline" color="textSecondary">
          Or choose your area
        </Text>
        {LOCALITIES.map((locality) => (
          <ListRow
            key={locality.id}
            icon="pin"
            title={locality.name}
            subtitle={servedBy(locality)}
            selected={deliverTo?.kind === 'locality' && deliverTo.label === locality.name}
            onPress={() =>
              choose({
                kind: 'locality',
                label: locality.name,
                area: locality.name,
                pincode: locality.pincode,
                lat: locality.lat,
                lng: locality.lng,
              })
            }
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
});
