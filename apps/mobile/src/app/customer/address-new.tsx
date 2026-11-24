import { LOCALITIES, formatDistance, pickStore, type LatLng } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/controls';
import { Text } from '@/components/text';
import { Banner, Button, ErrorText, Field, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCreateAddress } from '@/features/addresses/api';
import { useDelivery, useStores } from '@/features/delivery/store';
import { friendlyError } from '@/lib/errors';
import { useCurrentLocation } from '@/lib/location';

const LABELS = ['Home', 'Work', 'Other'] as const;

/** The pin: where on the map the address is, and what to call that choice. */
type Pin = LatLng & { from: string };

export default function NewAddressScreen() {
  const router = useRouter();
  const stores = useStores();
  const deliverTo = useDelivery((state) => state.deliverTo);
  const setAddressId = useDelivery((state) => state.setAddressId);
  const create = useCreateAddress();
  const { locate, locating, error: locateError } = useCurrentLocation();

  // Start from where the customer is already shopping from: usually the same place.
  const [pin, setPin] = useState<Pin | null>(deliverTo ? { lat: deliverTo.lat, lng: deliverTo.lng, from: deliverTo.label } : null);
  const [label, setLabel] = useState<(typeof LABELS)[number]>('Home');
  const [line1, setLine1] = useState('');
  const [area, setArea] = useState(deliverTo?.area ?? '');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState(deliverTo?.pincode ?? '');
  const [touched, setTouched] = useState(false);

  const match = pin ? pickStore(stores.data ?? [], pin) : null;
  const errors = {
    line1: line1.trim().length < 3 ? 'Enter your house or flat number and street.' : null,
    area: area.trim().length < 2 ? 'Enter your area.' : null,
    pincode: /^[1-9][0-9]{5}$/.test(pincode) ? null : 'Enter a 6-digit pincode.',
  };
  const valid = pin !== null && !errors.line1 && !errors.area && !errors.pincode;

  async function useMyLocation() {
    const coords = await locate();
    if (coords) setPin({ ...coords, from: 'Current location' });
  }

  function save() {
    setTouched(true);
    if (!valid || !pin) return;
    create.mutate(
      {
        label,
        line1: line1.trim(),
        area: area.trim(),
        landmark: landmark.trim() || null,
        pincode,
        lat: pin.lat,
        lng: pin.lng,
      },
      {
        onSuccess: (address) => {
          setAddressId(address.id);
          router.back();
        },
      },
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen footer={<Button label="Save address" onPress={save} busy={create.isPending} />}>
        <View style={styles.group}>
          <Text type="heading">Where is it?</Text>
          <Button variant="secondary" icon="locate" label="Use my current location" onPress={useMyLocation} busy={locating} />
          <ErrorText>{locateError}</ErrorText>
          <Text type="small" color="textSecondary">
            Or pick the area:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
            {LOCALITIES.map((locality) => (
              <Chip
                key={locality.id}
                label={locality.name}
                selected={pin?.from === locality.name}
                onPress={() => {
                  setPin({ lat: locality.lat, lng: locality.lng, from: locality.name });
                  setArea(locality.name);
                  setPincode(locality.pincode);
                }}
              />
            ))}
          </ScrollView>
          {pin && match && (
            <Banner tone={match.deliverable ? 'success' : 'warning'} icon="pin" title={`Pin: ${pin.from}`}>
              {match.deliverable
                ? `${match.store.name} delivers here, ${formatDistance(match.distanceM)} away.`
                : 'No store delivers here yet. You can save it, but not order to it.'}
            </Banner>
          )}
          {!pin && touched && <ErrorText>Choose where the address is first.</ErrorText>}
        </View>

        <View style={styles.group}>
          <Text type="heading">Address details</Text>
          <View style={styles.labels}>
            {LABELS.map((option) => (
              <Chip key={option} label={option} selected={label === option} onPress={() => setLabel(option)} />
            ))}
          </View>
          <Field
            label="House or flat, and street"
            placeholder="42, 9th Cross"
            autoComplete="address-line1"
            value={line1}
            onChangeText={setLine1}
            error={touched ? errors.line1 : null}
          />
          <Field label="Area" placeholder="Jayanagar" value={area} onChangeText={setArea} error={touched ? errors.area : null} />
          <Field
            label="Landmark (optional)"
            placeholder="Opposite the park"
            value={landmark}
            onChangeText={setLandmark}
          />
          <Field
            label="Pincode"
            placeholder="560041"
            keyboardType="number-pad"
            autoComplete="postal-code"
            maxLength={6}
            value={pincode}
            onChangeText={setPincode}
            error={touched ? errors.pincode : null}
          />
          <ErrorText>{friendlyError(create.error)}</ErrorText>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: Spacing.three },
  chipScroll: { marginHorizontal: -Spacing.four, flexGrow: 0 },
  chips: { gap: Spacing.two, paddingHorizontal: Spacing.four },
  labels: { flexDirection: 'row', gap: Spacing.two },
});
