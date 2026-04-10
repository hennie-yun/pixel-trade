// ─── 증권사 프로필 ───────────────────────────────────────────
export interface Broker {
  id: number;
  name: string;          // e.g. "키움증권"
  feeRate: number;       // 수수료율 (%) e.g. 0.015
  createdAt: string;     // ISO string
}

// ─── 매매 기록 ───────────────────────────────────────────────
export type TradeType = 'BUY' | 'SELL';

export interface Trade {
  id: number;
  date: string;          // YYYY-MM-DD
  stockName: string;     // 종목명 e.g. "삼성전자"
  ticker: string;        // 티커 e.g. "005930"
  tradeType: TradeType;
  price: number;         // 단가
  quantity: number;      // 수량
  fee: number;           // 수수료 (원)
  brokerId: number | null;
  memo: string;
  createdAt: string;
}

// ─── 달력 날짜별 요약 ────────────────────────────────────────
export interface DaySummary {
  date: string;          // YYYY-MM-DD
  hasBuy: boolean;
  hasSell: boolean;
  totalPnl: number;      // 해당 날 실현 손익 (매도 기준)
}

// ─── 통계 ────────────────────────────────────────────────────
export interface PortfolioStats {
  totalInvested: number;   // 총 매수 금액
  totalRealized: number;   // 총 실현 손익
  winRate: number;         // 승률 (0~1)
  tradeCount: number;      // 총 거래 횟수
  todayPnl: number;        // 오늘 손익
}
