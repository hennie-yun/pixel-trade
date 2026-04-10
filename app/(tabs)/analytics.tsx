import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getAllStats, getAllTrades } from '../../src/db/trades';
import { calcPnl } from '../../src/utils/pnl';
import { PixelCard } from '../../src/components/ui/PixelCard';
import { PnlText } from '../../src/components/ui/PnlText';
import { Colors, FontSize, Spacing, PixelBorder } from '../../constants/theme';
import { Trade } from '../../src/types';

interface StockSummary {
  stockName: string;
  realizedPnl: number;
  shares: number;   // 현재 보유 수량
}

function buildStockSummary(trades: Trade[]): StockSummary[] {
  const sorted = [...trades].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.id - b.id
  );
  const { byStock } = calcPnl(sorted);

  return Object.entries(byStock)
    .map(([key, h]) => ({
      stockName: key,
      realizedPnl: h.realizedPnl,
      shares: h.shares,
    }))
    .sort((a, b) => Math.abs(b.realizedPnl) - Math.abs(a.realizedPnl));
}

interface BarProps { label: string; value: number; maxValue: number; color: string }
function PixelBar({ label, value, maxValue, color }: BarProps) {
  const pct = maxValue > 0 ? (Math.abs(value) / maxValue) : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.value, { color }]}>
        {value >= 0 ? '+' : ''}{value.toLocaleString()}
      </Text>
    </View>
  );
}
const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  label: { width: 80, fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  track: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.borderLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 1,
    marginHorizontal: Spacing.xs,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
  value: { width: 80, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'right' },
});

export default function AnalyticsScreen() {
  const [stats, setStats] = useState({ totalInvested: 0, totalRealizedPnl: 0, tradeCount: 0 });
  const [summaries, setSummaries] = useState<StockSummary[]>([]);

  useEffect(() => {
    setStats(getAllStats());
    setSummaries(buildStockSummary(getAllTrades()));
  }, []);

  // 실현 손익이 0이 아닌 종목만 승률에 포함 (매도가 발생한 종목)
  const winCount = summaries.filter((s) => s.realizedPnl > 0).length;
  const loseCount = summaries.filter((s) => s.realizedPnl < 0).length;
  const decidedCount = winCount + loseCount;
  const winRate = decidedCount > 0 ? winCount / decidedCount : 0;

  const maxPnl = summaries.reduce((m, s) => Math.max(m, Math.abs(s.realizedPnl)), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>투자 분석</Text>

      {/* 요약 카드 3개 */}
      <View style={styles.statsRow}>
        <PixelCard style={styles.statCard}>
          <Text style={styles.statLabel}>총 매수금액</Text>
          <Text style={styles.statValue}>{stats.totalInvested.toLocaleString()}</Text>
          <Text style={styles.statUnit}>원</Text>
        </PixelCard>
        <PixelCard style={styles.statCard}>
          <Text style={styles.statLabel}>실현 손익</Text>
          <PnlText value={stats.totalRealizedPnl} style={styles.statValue} suffix="" />
          <Text style={styles.statUnit}>원</Text>
        </PixelCard>
        <PixelCard style={styles.statCard}>
          <Text style={styles.statLabel}>종목 승률</Text>
          <Text style={[styles.statValue, { color: winRate >= 0.5 ? Colors.accent : Colors.danger }]}>
            {Math.round(winRate * 100)}
          </Text>
          <Text style={styles.statUnit}>%</Text>
        </PixelCard>
      </View>

      {/* 거래 횟수 */}
      <PixelCard style={styles.countCard}>
        <Text style={styles.statLabel}>총 거래 횟수</Text>
        <Text style={styles.bigCount}>{stats.tradeCount}회</Text>
      </PixelCard>

      {/* 종목별 손익 바 차트 */}
      {summaries.length > 0 && (
        <PixelCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>종목별 실현 손익</Text>
          {summaries.slice(0, 8).map((s) => (
            <PixelBar
              key={s.stockName}
              label={s.stockName}
              value={s.realizedPnl}
              maxValue={maxPnl}
              color={s.realizedPnl >= 0 ? Colors.accent : Colors.danger}
            />
          ))}
        </PixelCard>
      )}

      {summaries.length === 0 && (
        <PixelCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>매매 기록이 없습니다.</Text>
          <Text style={styles.emptySubText}>홈에서 기록을 추가해보세요!</Text>
        </PixelCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: Spacing.xl },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: Spacing.sm },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.textPrimary },
  statUnit: { fontSize: FontSize.xs, color: Colors.textMuted },
  countCard: { marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigCount: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.primary },
  chartCard: { marginBottom: Spacing.md },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyCard: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
});
