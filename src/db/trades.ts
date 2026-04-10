import { getDb } from './schema';
import { Trade, TradeType } from '../types';
import { calcTodayPnl, calcPnl } from '../utils/pnl';

function rowToTrade(row: any): Trade {
  return {
    id: row.id,
    date: row.date,
    stockName: row.stock_name,
    ticker: row.ticker,
    tradeType: row.trade_type as TradeType,
    price: row.price,
    quantity: row.quantity,
    fee: row.fee,
    brokerId: row.broker_id,
    memo: row.memo,
    createdAt: row.created_at,
  };
}

// ─── 조회 ────────────────────────────────────────────────────

export function getTradesByDate(date: string): Trade[] {
  const db = getDb();
  const rows = db.getAllSync(
    'SELECT * FROM trades WHERE date = ? ORDER BY id ASC',
    [date]
  );
  return rows.map(rowToTrade);
}

export function getTradesByMonth(yearMonth: string): Trade[] {
  // yearMonth: "YYYY-MM"
  const db = getDb();
  const rows = db.getAllSync(
    "SELECT * FROM trades WHERE date LIKE ? ORDER BY date ASC, id ASC",
    [`${yearMonth}-%`]
  );
  return rows.map(rowToTrade);
}

export function getAllTrades(): Trade[] {
  const db = getDb();
  const rows = db.getAllSync('SELECT * FROM trades ORDER BY date DESC, id DESC');
  return rows.map(rowToTrade);
}

export function getTradeById(id: number): Trade | null {
  const db = getDb();
  const row = db.getFirstSync('SELECT * FROM trades WHERE id = ?', [id]);
  return row ? rowToTrade(row) : null;
}

// ─── 생성 ────────────────────────────────────────────────────

export function createTrade(
  data: Omit<Trade, 'id' | 'createdAt'>
): Trade {
  const db = getDb();
  const result = db.runSync(
    `INSERT INTO trades (date, stock_name, ticker, trade_type, price, quantity, fee, broker_id, memo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.date,
      data.stockName,
      data.ticker,
      data.tradeType,
      data.price,
      data.quantity,
      data.fee,
      data.brokerId,
      data.memo,
    ]
  );
  return getTradeById(result.lastInsertRowId)!;
}

// ─── 수정 ────────────────────────────────────────────────────

export function updateTrade(
  id: number,
  data: Partial<Omit<Trade, 'id' | 'createdAt'>>
): void {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.date !== undefined)       { fields.push('date = ?');        values.push(data.date); }
  if (data.stockName !== undefined)  { fields.push('stock_name = ?');  values.push(data.stockName); }
  if (data.ticker !== undefined)     { fields.push('ticker = ?');      values.push(data.ticker); }
  if (data.tradeType !== undefined)  { fields.push('trade_type = ?');  values.push(data.tradeType); }
  if (data.price !== undefined)      { fields.push('price = ?');       values.push(data.price); }
  if (data.quantity !== undefined)   { fields.push('quantity = ?');    values.push(data.quantity); }
  if (data.fee !== undefined)        { fields.push('fee = ?');         values.push(data.fee); }
  if (data.brokerId !== undefined)   { fields.push('broker_id = ?');   values.push(data.brokerId); }
  if (data.memo !== undefined)       { fields.push('memo = ?');        values.push(data.memo); }

  if (fields.length === 0) return;

  values.push(id);
  db.runSync(`UPDATE trades SET ${fields.join(', ')} WHERE id = ?`, values);
}

// ─── 삭제 ────────────────────────────────────────────────────

export function deleteTrade(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM trades WHERE id = ?', [id]);
}

// ─── 통계용 ──────────────────────────────────────────────────

export function getActiveDatesInMonth(yearMonth: string): Record<string, { hasBuy: boolean; hasSell: boolean }> {
  const db = getDb();
  const rows = db.getAllSync(
    `SELECT date, trade_type FROM trades WHERE date LIKE ?`,
    [`${yearMonth}-%`]
  );

  const result: Record<string, { hasBuy: boolean; hasSell: boolean }> = {};
  for (const r of rows) {
    const row = r as any;
    if (!result[row.date]) result[row.date] = { hasBuy: false, hasSell: false };
    if (row.trade_type === 'BUY')  result[row.date].hasBuy = true;
    if (row.trade_type === 'SELL') result[row.date].hasSell = true;
  }
  return result;
}

export function getTodayPnl(today: string): number {
  // 평균 단가 기준 실현 손익 계산을 위해 전체 이력을 사용합니다.
  const all = getAllTrades();
  return calcTodayPnl(all, today);
}

export function getAllStats() {
  const db = getDb();
  const countRow: any = db.getFirstSync('SELECT COUNT(*) AS trade_count FROM trades');
  const buyRow: any = db.getFirstSync(
    `SELECT COALESCE(SUM(price * quantity + fee), 0) AS total_invested FROM trades WHERE trade_type = 'BUY'`
  );

  const all = getAllTrades();
  const { totalRealizedPnl } = calcPnl(
    [...all].sort((a, b) =>
      a.date !== b.date ? a.date.localeCompare(b.date) : a.id - b.id
    )
  );

  return {
    totalInvested: buyRow?.total_invested ?? 0,
    totalRealizedPnl,
    tradeCount: countRow?.trade_count ?? 0,
  };
}
