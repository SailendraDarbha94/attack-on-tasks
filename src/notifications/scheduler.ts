import * as Notifications from 'expo-notifications';

import { notificationTimes } from '@/engine/schedule';
import type { ScheduleSettings } from '@/engine/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return requested.granted;
}

// Notifications are just doorbells; the engine is the clock.
// Cancel-and-reschedule the rolling horizon on every refresh.
export async function refreshNotificationSchedule(settings: ScheduleSettings): Promise<void> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const times = notificationTimes(Date.now(), settings);
  await Promise.all(
    times.map((slotTs) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Titans emerge from the treeline',
          body: 'They are waiting between the trunks. Face them.',
          sound: true,
          data: { slotTs },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(slotTs),
        },
      }),
    ),
  );
}

export function onNotificationTap(handler: () => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}
