import { formatPaise, parseRupees } from '@nukkad/core';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/text';
import { Button, Card, ErrorText, Field, Loading, Row, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAddInventory, useInventory, useMissingProducts, useUpdateInventory } from '@/features/desk/api';
import { friendlyError } from '@/lib/errors';

type Product = { productId: string; name: string; unitLabel: string; emoji: string; mrpPaise: number };
type Shelf = { pricePaise: number; stock: number; isAvailable: boolean };

/** One product on the shelf, or one about to be put there. */
export default function StoreItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inventory = useInventory();
  const missing = useMissingProducts();

  if (inventory.isPending || missing.isPending) return <Loading />;

  const stocked = inventory.data?.items.find((item) => item.productId === id);
  const candidate = missing.data?.find((product) => product.productId === id);
  const product = stocked ?? candidate;
  if (!product) {
    return (
      <Screen>
        <ErrorText>{friendlyError(inventory.error ?? missing.error) ?? 'That product could not be found.'}</ErrorText>
      </Screen>
    );
  }

  // Keyed so the form starts over if the screen is reused for another product.
  return <Editor key={product.productId} product={product} shelf={stocked ?? null} />;
}

function Editor({ product, shelf }: { product: Product; shelf: Shelf | null }) {
  const router = useRouter();
  const update = useUpdateInventory();
  const add = useAddInventory();
  const isNew = shelf === null;

  // A new product starts at the printed price, the most it may be sold for.
  const [price, setPrice] = useState(String((shelf?.pricePaise ?? product.mrpPaise) / 100));
  const [stock, setStock] = useState(String(shelf?.stock ?? 10));
  const [isAvailable, setIsAvailable] = useState(shelf?.isAvailable ?? true);

  const pricePaise = parseRupees(price);
  const stockCount = /^\d{1,4}$/.test(stock.trim()) ? Number(stock.trim()) : null;
  const priceError =
    pricePaise === null || pricePaise < 100
      ? 'Enter a price of at least ₹1.'
      : pricePaise > product.mrpPaise
        ? `Cannot be more than the MRP, ${formatPaise(product.mrpPaise)}.`
        : null;
  const stockError = stockCount === null ? 'Enter a whole number from 0 to 9999.' : null;
  const mutation = isNew ? add : update;

  function save() {
    if (pricePaise === null || stockCount === null || priceError || stockError) return;
    const done = { onSuccess: () => router.back() };
    if (isNew) add.mutate({ productId: product.productId, pricePaise, stock: stockCount }, done);
    else update.mutate({ productId: product.productId, pricePaise, stock: stockCount, isAvailable }, done);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen
        footer={
          <Button
            label={isNew ? 'Add to shelf' : 'Save changes'}
            onPress={save}
            busy={mutation.isPending}
            disabled={priceError !== null || stockError !== null}
          />
        }>
        <View style={styles.product}>
          <View style={styles.tile}>
            <Text style={styles.emoji}>{product.emoji}</Text>
          </View>
          <View style={styles.flex}>
            <Text type="title">{product.name}</Text>
            <Text color="textSecondary">
              {product.unitLabel} · MRP {formatPaise(product.mrpPaise)}
            </Text>
          </View>
        </View>

        <Field
          label="Your price (₹)"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
          error={priceError}
          hint="What customers pay. It can be below the MRP, never above."
        />
        <Field
          label="In stock"
          keyboardType="number-pad"
          maxLength={4}
          value={stock}
          onChangeText={setStock}
          error={stockError}
          hint="How many you have right now. Orders take from this number."
        />

        {!isNew && (
          <Card>
            <Row>
              <View style={styles.flex}>
                <Text type="headline">Show to customers</Text>
                <Text type="small" color="textSecondary">
                  Switch off to hide it without losing its price and stock.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Show to customers"
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ true: Colors.successText, false: Colors.elementStrong }}
                thumbColor={Colors.surface}
              />
            </Row>
          </Card>
        )}

        <ErrorText>{friendlyError(mutation.error)}</ErrorText>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  product: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  tile: {
    width: 84,
    height: 84,
    borderRadius: Radius.card,
    backgroundColor: Colors.element,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 44, lineHeight: 54 },
});
