import { Trade } from '../types';

/**
 * 평균 단가법(Average Cost)으로 종목별 실현 손익을 계산합니다.
 *
 * 로직:
 *  - BUY  → 보유 수량/평균단가 누적
 *  - SELL → (매도가 - 평균매수가) × 수량 - 수수료 = 실현 손익
 *
 * 주의: 매수 기록 없이 매도만 있으면 평균단가 0으로 처리합니다.
 */

export interface StockHolding {
  shares: number;      // 현재 보유 수량
  avgCost: number;     // 평균 매수 단가 (수수료 포함)
  realizedPnl: number; // 누적 실현 손익
}

export interface PnlSummary {
  totalRealizedPnl: number;                    // 전체 실현 손익
  byStock: Record<string, StockHolding>;       // 종목별 현황
}

/** trades는 반드시 날짜 + id 오름차순으로 정렬되어 있어야 합니다. */
export function calcPnl(trades: Trade[]): PnlSummary {
  const byStock: Record<string, StockHolding> = {};
  let totalRealizedPnl = 0;

  for (const t of trades) {
    const key = t.ticker.trim() || t.stockName; // 티커 우선, 없으면 종목명
    if (!byStock[key]) {
      byStock[key] = { shares: 0, avgCost: 0, realizedPnl: 0 };
    }
    const h = byStock[key];

    if (t.tradeType === 'BUY') {
      // 평균 단가 재계산 (수수료를 취득 원가에 포함)
      const prevCost = h.avgCost * h.shares;
      const newCost = t.price * t.quantity + t.fee;
      h.shares += t.quantity;
      h.avgCost = h.shares > 0 ? (prevCost + newCost) / h.shares : 0;
    } else {
      // SELL: 실현 손익 확정
      const pnl = (t.price - h.avgCost) * t.quantity - t.fee;
      h.realizedPnl += pnl;
      totalRealizedPnl += pnl;

      // 보유 수량/원가 차감
      h.shares -= t.quantity;
      if (h.shares <= 0) {
        h.shares = 0;
        h.avgCost = 0;
      }
    }
  }

  return { totalRealizedPnl, byStock };
}

/**
 * 특정 날짜에 확정된 실현 손익만 반환합니다.
 * (해당 날 매도가 발생한 거래만, 하지만 평균 단가는 전체 이력 기준)
 */
export function calcTodayPnl(allTrades: Trade[], targetDate: string): number {
  // 날짜 + id 오름차순 정렬
  const sorted = [...allTrades].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.id - b.id
  );

  const holdings: Record<string, { shares: number; avgCost: number }> = {};
  let todayPnl = 0;

  for (const t of sorted) {
    const key = t.ticker.trim() || t.stockName;
    if (!holdings[key]) holdings[key] = { shares: 0, avgCost: 0 };
    const h = holdings[key];

    if (t.tradeType === 'BUY') {
      const prevCost = h.avgCost * h.shares;
      const newCost = t.price * t.quantity + t.fee;
      h.shares += t.quantity;
      h.avgCost = h.shares > 0 ? (prevCost + newCost) / h.shares : 0;
    } else {
      const pnl = (t.price - h.avgCost) * t.quantity - t.fee;
      if (t.date === targetDate) {
        todayPnl += pnl;
      }
      h.shares -= t.quantity;
      if (h.shares <= 0) {
        h.shares = 0;
        h.avgCost = 0;
      }
    }
  }

  return todayPnl;
}
