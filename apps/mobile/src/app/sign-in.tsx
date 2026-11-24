import type { DemoAccount, Session } from '@nukkad/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { ListRow } from '@/components/controls';
import { Text } from '@/components/text';
import { Banner, Button, ErrorText, Field, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import { startSession, useSession } from '@/lib/session';

/**
 * The demo sign-in: tap a ready-made account, or (customers) make a new one
 * with no password. Real sign-in replaces this screen and nothing else.
 */
export default function SignInScreen() {
  const { chosenRole, chooseRole } = useSession();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const accounts = useQuery({ queryKey: ['demo-accounts'], queryFn: () => api<DemoAccount[]>('/auth/dev/accounts') });
  const signIn = useMutation({
    mutationFn: (accountEmail: string) =>
      api<Session>('/auth/dev/sign-in', { method: 'POST', body: { email: accountEmail } }),
    onSuccess: startSession,
  });
  const signUp = useMutation({
    mutationFn: () =>
      api<Session>('/auth/dev/sign-up', {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), phone: phone.trim() },
      }),
    onSuccess: startSession,
  });

  // The root layout only shows this screen once a role is chosen.
  if (!chosenRole) return null;

  const isStore = chosenRole === 'store';
  const mine = (accounts.data ?? []).filter((account) => account.role === chosenRole);
  const busy = signIn.isPending || signUp.isPending;
  const canCreate = name.trim().length >= 2 && email.trim().length > 3 && phone.trim().length >= 8;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Screen noHeader>
        <View style={styles.heading}>
          <Text type="title">{isStore ? 'Sign in to your store' : creating ? 'Create your account' : 'Sign in'}</Text>
          <Text color="textSecondary">
            {isStore ? 'Choose the store you work at.' : 'Pick a demo customer, or start fresh with your own details.'}
          </Text>
        </View>

        <Banner tone="info" title="Demo sign-in">
          There are no passwords yet. Everyone here is made up, and real sign-in comes later.
        </Banner>

        <ErrorText>{friendlyError(accounts.error ?? signIn.error ?? signUp.error)}</ErrorText>

        {!creating && (
          <View style={styles.list}>
            {mine.map((account) => (
              <ListRow
                key={account.email}
                icon={isStore ? 'store' : 'person'}
                title={isStore ? account.note : account.name}
                subtitle={isStore ? account.name : account.note}
                onPress={busy ? undefined : () => signIn.mutate(account.email)}
              />
            ))}
            {accounts.isPending && <Text color="textSecondary">Loading accounts…</Text>}
          </View>
        )}

        {creating && (
          <View style={styles.list}>
            <Field label="Your name" placeholder="Asha Verma" autoComplete="name" value={name} onChangeText={setName} />
            <Field
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Phone"
              placeholder="+91 90000 00000"
              hint="So the store can reach you about an order."
              autoComplete="tel"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              onSubmitEditing={() => canCreate && signUp.mutate()}
            />
            <Button label="Create account" onPress={() => signUp.mutate()} disabled={!canCreate} busy={signUp.isPending} />
          </View>
        )}

        <View>
          {!isStore && (
            <Button
              variant="text"
              label={creating ? 'Use a demo account instead' : 'Create a new account'}
              onPress={() => setCreating(!creating)}
            />
          )}
          <Button variant="text" label={isStore ? 'I’m here to order instead' : 'I run a store instead'} onPress={() => chooseRole(null)} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heading: { gap: Spacing.two, marginTop: Spacing.five },
  list: { gap: Spacing.three },
});
