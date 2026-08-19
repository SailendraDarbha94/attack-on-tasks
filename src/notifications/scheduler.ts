import * as Notifications from 'expo-notifications';

import { lineForSlot } from '@/content/notifications';
import { HOUR, notificationTimes } from '@/engine/schedule';
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

// iOS caps pending local notifications at 64. Observation windows take at
// most 40 of that budget; asteroid alerts (warnings and impacts together,
// soonest first) take at most 12.
const WINDOW_CAP = 40;
const ASTEROID_CAP = 12;

interface AsteroidAlert {
  ts: number;
  title: string;
  body: string;
}

function asteroidAlerts(inbound: { name: string; dueTs: number }[], nowTs: number): AsteroidAlert[] {
  const alerts: AsteroidAlert[] = [];
  for (const { name, dueTs } of inbound) {
    if (dueTs <= nowTs) continue;
    const warnTs = dueTs - 2 * HOUR;
    if (warnTs > nowTs) {
      alerts.push({
        ts: warnTs,
        title: `Inbound: ${name}`,
        body: 'Impact in two hours. One act deflects it.',
      });
    }
    alerts.push({
      ts: dueTs,
      title: `Impact: ${name}`,
      body: 'It struck home. The crater is in the record — the record goes on.',
    });
  }
  return alerts.sort((a, b) => a.ts - b.ts).slice(0, ASTEROID_CAP);
}

// Notifications are just doorbells; the engine is the clock.
// Cancel-and-reschedule the rolling horizon on every refresh.
export async function refreshNotificationSchedule(
  settings: ScheduleSettings,
  inbound: { name: string; dueTs: number }[] = [],
): Promise<void> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const times = notificationTimes(now, settings).slice(0, WINDOW_CAP);
  await Promise.all([
    ...times.map((slotTs) =>
      Notifications.scheduleNotificationAsync({
        content: {
          ...lineForSlot(slotTs),
          sound: true,
          data: { slotTs },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(slotTs),
        },
      }),
    ),
    ...asteroidAlerts(inbound, now).map((alert) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.body,
          sound: true,
          data: { asteroidTs: alert.ts },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(alert.ts),
        },
      }),
    ),
  ]);
}

export function onNotificationTap(handler: () => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}
