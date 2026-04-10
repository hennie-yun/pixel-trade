import { create } from 'zustand';
import { Trade } from '../types';
import * as TradeDB from '../db/trades';

interface TradeState {
  // 현재 선택된 날짜의 매매 목록
  selectedDate: string;
  dailyTrades: Trade[];

  // 월간 활성 날짜 맵 (달력 도트 표시용)
  activeDates: Record<string, { hasBuy: boolean; hasSell: boolean }>;

  // 오늘 손익
  todayPnl: number;

  // Actions
  setSelectedDate: (date: string) => void;
  loadDailyTrades: (date: string) => void;
  loadActiveDates: (yearMonth: string) => void;
  loadTodayPnl: () => void;
  addTrade: (data: Omit<Trade, 'id' | 'createdAt'>) => void;
  editTrade: (id: number, data: Partial<Omit<Trade, 'id' | 'createdAt'>>) => void;
  removeTrade: (id: number) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useTradeStore = create<TradeState>((set, get) => ({
  selectedDate: today(),
  dailyTrades: [],
  activeDates: {},
  todayPnl: 0,

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().loadDailyTrades(date);
  },

  loadDailyTrades: (date) => {
    const trades = TradeDB.getTradesByDate(date);
    set({ dailyTrades: trades });
  },

  loadActiveDates: (yearMonth) => {
    const activeDates = TradeDB.getActiveDatesInMonth(yearMonth);
    set({ activeDates });
  },

  loadTodayPnl: () => {
    const pnl = TradeDB.getTodayPnl(today());
    set({ todayPnl: pnl });
  },

  addTrade: (data) => {
    const trade = TradeDB.createTrade(data);
    const { selectedDate, activeDates } = get();

    // 현재 날짜 목록에 추가
    if (trade.date === selectedDate) {
      set((s) => ({ dailyTrades: [...s.dailyTrades, trade] }));
    }

    // 활성 날짜 맵 업데이트
    const updated = { ...activeDates };
    if (!updated[trade.date]) updated[trade.date] = { hasBuy: false, hasSell: false };
    if (trade.tradeType === 'BUY')  updated[trade.date].hasBuy = true;
    if (trade.tradeType === 'SELL') updated[trade.date].hasSell = true;
    set({ activeDates: updated });

    get().loadTodayPnl();
  },

  editTrade: (id, data) => {
    TradeDB.updateTrade(id, data);
    const { selectedDate } = get();
    get().loadDailyTrades(selectedDate);
    get().loadTodayPnl();
  },

  removeTrade: (id) => {
    TradeDB.deleteTrade(id);
    set((s) => ({ dailyTrades: s.dailyTrades.filter((t) => t.id !== id) }));
    get().loadTodayPnl();
  },
}));
