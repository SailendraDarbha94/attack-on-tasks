import { Button, Notice } from '@/components/ui';
import { signOut, useSession } from '@/lib/session';

/** Signed in, but with an account this app has no screens for. */
export default function AccountUnavailableScreen() {
  const { me } = useSession();
  const suspended = me?.status === 'suspended';
  return (
    <Notice
      title={suspended ? 'Account suspended' : 'Not available in the app'}
      body={
        suspended
          ? 'This account cannot be used right now. Contact Nukkad support if you think this is a mistake.'
          : 'This account is for the Nukkad website, not the app.'
      }>
      <Button label="Sign out" onPress={signOut} />
    </Notice>
  );
}
