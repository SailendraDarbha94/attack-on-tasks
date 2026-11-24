import { formatPaise } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListRow, SearchField } from '@/components/controls';
import { Text } from '@/components/text';
import { Empty, ErrorText, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useMissingProducts } from '@/features/desk/api';
import { friendlyError } from '@/lib/errors';

/** Catalogue products this store does not sell yet. Tap one to set a price and put it on the shelf. */
export default function AddProductsScreen() {
  const router = useRouter();
  const missing = useMissingProducts();
  const [query, setQuery] = useState('');

  if (missing.isPending) return <Loading />;

  const words = query.trim().toLowerCase();
  const visible = (missing.data ?? []).filter((product) => !words || product.name.toLowerCase().includes(words));

  return (
    <Screen>
      <ErrorText>{friendlyError(missing.error)}</ErrorText>
      {(missing.data?.length ?? 0) === 0 ? (
        <Empty emoji="🎉" title="You stock everything" body="Every product in the Nukkad catalogue is already on your shelf." />
      ) : (
        <>
          <Text type="small" color="textSecondary">
            These are in the Nukkad catalogue but not on your shelf.
          </Text>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search the catalogue" />
          <View style={styles.list}>
            {visible.map((product) => (
              <ListRow
                key={product.productId}
                title={`${product.emoji}  ${product.name}`}
                subtitle={`${product.unitLabel} · MRP ${formatPaise(product.mrpPaise)}`}
                onPress={() => router.push(`/store/item/${product.productId}`)}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
