import { getDb } from './schema';

export function exportAllData(): object {
  const db = getDb();
  const brokers = db.getAllSync('SELECT * FROM brokers');
  const trades = db.getAllSync('SELECT * FROM trades');
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    brokers,
    trades,
  };
}

export function importAllData(data: any): void {
  const db = getDb();

  db.withTransactionSync(() => {
    db.runSync('DELETE FROM trades');
    db.runSync('DELETE FROM brokers');

    for (const b of data.brokers ?? []) {
      db.runSync(
        'INSERT INTO brokers (id, name, fee_rate, created_at) VALUES (?, ?, ?, ?)',
        [b.id, b.name, b.fee_rate, b.created_at]
      );
    }
    for (const t of data.trades ?? []) {
      db.runSync(
        `INSERT INTO trades
           (id, date, stock_name, ticker, trade_type, price, quantity, fee, broker_id, memo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.date, t.stock_name, t.ticker, t.trade_type,
         t.price, t.quantity, t.fee, t.broker_id, t.memo, t.created_at]
      );
    }
  });
}
