import { getDb } from './schema';
import { Broker } from '../types';

function rowToBroker(row: any): Broker {
  return {
    id: row.id,
    name: row.name,
    feeRate: row.fee_rate,
    createdAt: row.created_at,
  };
}

export function getAllBrokers(): Broker[] {
  const db = getDb();
  const rows = db.getAllSync('SELECT * FROM brokers ORDER BY name ASC');
  return rows.map(rowToBroker);
}

export function getBrokerById(id: number): Broker | null {
  const db = getDb();
  const row = db.getFirstSync('SELECT * FROM brokers WHERE id = ?', [id]);
  return row ? rowToBroker(row) : null;
}

export function createBroker(name: string, feeRate: number): Broker {
  const db = getDb();
  const result = db.runSync(
    'INSERT INTO brokers (name, fee_rate) VALUES (?, ?)',
    [name, feeRate]
  );
  return getBrokerById(result.lastInsertRowId)!;
}

export function updateBroker(id: number, name: string, feeRate: number): void {
  const db = getDb();
  db.runSync('UPDATE brokers SET name = ?, fee_rate = ? WHERE id = ?', [name, feeRate, id]);
}

export function deleteBroker(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM brokers WHERE id = ?', [id]);
}
