import * as SQLite from 'expo-sqlite';

import { DEFAULT_SETTINGS, normalizeSettings } from '@/engine/schedule';
import type { Asteroid, GameEvent, ScheduleSettings, World } from '@/engine/types';
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

export async function loadWorlds(): Promise<World[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    frequency_hours: number;
    created_ts: number;
  }>('SELECT id, name, frequency_hours, created_ts FROM chores WHERE archived = 0 ORDER BY id');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    frequencyHours: r.frequency_hours,
    createdTs: r.created_ts,
  }));
}

export async function insertWorld(name: string, frequencyHours: number): Promise<World> {
  const db = await getDb();
  const createdTs = Date.now();
  const result = await db.runAsync(
    'INSERT INTO chores (name, frequency_hours, created_ts) VALUES (?, ?, ?)',
    name,
    frequencyHours,
    createdTs,
  );
  return { id: result.lastInsertRowId, name, frequencyHours, createdTs };
}

export async function archiveWorld(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE chores SET archived = 1 WHERE id = ?', id);
}

export async function loadAsteroids(): Promise<Asteroid[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    due_ts: number;
    created_ts: number;
  }>('SELECT id, name, due_ts, created_ts FROM asteroids WHERE archived = 0 ORDER BY due_ts');
  return rows.map((r) => ({ id: r.id, name: r.name, dueTs: r.due_ts, createdTs: r.created_ts }));
}

export async function insertAsteroid(name: string, dueTs: number): Promise<Asteroid> {
  const db = await getDb();
  const createdTs = Date.now();
  const result = await db.runAsync(
    'INSERT INTO asteroids (name, due_ts, created_ts) VALUES (?, ?, ?)',
    name,
    dueTs,
    createdTs,
  );
  return { id: result.lastInsertRowId, name, dueTs, createdTs };
}

export async function archiveAsteroid(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE asteroids SET archived = 1 WHERE id = ?', id);
}

// First app open marks the moment the keeper first looked up —
// windows before it never existed.
export async function ensureGameStart(): Promise<number> {
  const raw = await getSetting(GAME_START_KEY);
  if (raw) return Number(raw);
  const now = Date.now();
  await setSetting(GAME_START_KEY, String(now));
  return now;
}
