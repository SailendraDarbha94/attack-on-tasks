import type { SQLiteDatabase } from 'expo-sqlite';

// Append-only migrations: never edit a shipped entry, only push new ones.
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL DEFAULT '{}'
  );
  CREATE INDEX idx_events_ts ON events (ts);
  CREATE INDEX idx_events_type_ts ON events (type, ts);

  CREATE TABLE chores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    frequency_hours INTEGER NOT NULL,
    flavor TEXT,
    created_ts INTEGER NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE asteroids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    due_ts INTEGER NOT NULL,
    created_ts INTEGER NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0
  );
  `,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let v = row?.user_version ?? 0; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
