import * as SQLite from 'expo-sqlite';

import { DEFAULT_SETTINGS, normalizeSettings } from '@/engine/schedule';
import type { GameEvent, ScheduleSettings } from '@/engine/types';
import { migrate } from './migrations';

const DB_NAME = 'attack-on-tasks.db';
const SETTINGS_KEY = 'schedule';
const GAME_START_KEY = 'game_started';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= openAndMigrate();
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

export async function appendEvent(event: GameEvent): Promise<void> {
  const db = await getDb();
  const { type, ts, ...payload } = event;
  await db.runAsync(
    'INSERT INTO events (ts, type, payload) VALUES (?, ?, ?)',
    ts,
    type,
    JSON.stringify(payload),
  );
}

export async function loadEvents(): Promise<GameEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ ts: number; type: string; payload: string }>(
    'SELECT ts, type, payload FROM events ORDER BY ts ASC, id ASC',
  );
  return rows.map((row) => ({ type: row.type, ts: row.ts, ...JSON.parse(row.payload) }) as GameEvent);
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function loadSettings(): Promise<ScheduleSettings> {
  const raw = await getSetting(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<ScheduleSettings>;
    return normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...parsed,
      habitsEnabled: { ...DEFAULT_SETTINGS.habitsEnabled, ...(parsed.habitsEnabled ?? {}) },
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: ScheduleSettings): Promise<void> {
  await setSetting(SETTINGS_KEY, JSON.stringify(settings));
}

// First app open marks the moment the Scout woke up in the forest —
// slots before it never existed.
export async function ensureGameStart(): Promise<number> {
  const raw = await getSetting(GAME_START_KEY);
  if (raw) return Number(raw);
  const now = Date.now();
  await setSetting(GAME_START_KEY, String(now));
  return now;
}
