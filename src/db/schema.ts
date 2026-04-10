import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('pixeltrade.db');
  }
  return _db;
}

export async function initDb(): Promise<void> {
  const db = getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS brokers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      fee_rate   REAL    NOT NULL DEFAULT 0.015,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS trades (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT    NOT NULL,
      stock_name  TEXT    NOT NULL,
      ticker      TEXT    NOT NULL DEFAULT '',
      trade_type  TEXT    NOT NULL CHECK(trade_type IN ('BUY','SELL')),
      price       REAL    NOT NULL,
      quantity    INTEGER NOT NULL,
      fee         REAL    NOT NULL DEFAULT 0,
      broker_id   INTEGER REFERENCES brokers(id) ON DELETE SET NULL,
      memo        TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
  `);
}
