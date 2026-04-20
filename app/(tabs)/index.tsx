import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTradeStore } from '../../src/store/tradeStore';
import { useBrokerStore } from '../../src/store/brokerStore';
import { PixelCard } from '../../src/components/ui/PixelCard';
import { PixelButton } from '../../src/components/ui/PixelButton';
import { PnlText } from '../../src/components/ui/PnlText';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { Trade } from '../../src/types';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${y}년 ${m}월 ${day}일`;
}

function TradeRow({ trade, onPress }: { trade: Trade; onPress: () => void }) {
  const isBuy = trade.tradeType === 'BUY';
  const total = trade.price * trade.quantity;
  return (
    <TouchableOpacity onPress={onPress} style={styles.tradeRow}>
      <View style={[styles.typeBadge, { backgroundColor: isBuy ? Colors.accent : Colors.primary }]}>
        <Text style={styles.typeText}>{isBuy ? '매수' : '매도'}</Text>
      </View>
      <View style={styles.tradeInfo}>
        <Text style={styles.stockName}>{trade.stockName}</Text>
        <Text style={styles.tradeDetail}>
          {trade.price.toLocaleString()}원 × {trade.quantity}주
        </Text>
      </View>
      <View style={styles.tradeAmount}>
        <Text style={styles.totalAmount}>{total.toLocaleString()}원</Text>
        <Text style={styles.feeText}>수수료 {trade.fee.toLocaleString()}원</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const today = todayStr();
  const { todayPnl, dailyTrades, loadDailyTrades, loadTodayPnl, selectedDate, setSelectedDate } = useTradeStore();
  const { loadBrokers } = useBrokerStore();

  useEffect(() => {
    loadBrokers();
    setSelectedDate(today);
    loadTodayPnl();
  }, []);

  const isProfit = todayPnl > 0;
  const isLoss = todayPnl < 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>PixelTrade</Text>
        <Text style={styles.dateText}>{formatDate(today)}</Text>
      </View>

      {/* 오늘 손익 카드 */}
      <PixelCard style={styles.pnlCard}>
        <Text style={styles.characterEmoji}>
          {isProfit ? '😄' : isLoss ? '😢' : '😐'}
        </Text>
        <Text style={styles.pnlLabel}>오늘 손익</Text>
        <PnlText value={todayPnl} style={styles.pnlValue} />
      </PixelCard>

      {/* 오늘 매매 기록 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>오늘의 매매</Text>
        <PixelButton
          label="+ 기록"
          variant="accent"
          onPress={() => router.push({ pathname: '/trade/new', params: { date: today } })}
          style={styles.addBtn}
        />
      </View>

      {dailyTrades.length === 0 ? (
        <PixelCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>오늘 매매 기록이 없습니다.</Text>
          <Text style={styles.emptySubText}>+ 기록 버튼을 눌러 추가하세요!</Text>
        </PixelCard>
      ) : (
        <PixelCard style={styles.tradesCard} padding={0}>
          {dailyTrades.map((trade, idx) => (
            <React.Fragment key={trade.id}>
              {idx > 0 && <View style={styles.divider} />}
              <TradeRow
                trade={trade}
                onPress={() => router.push({ pathname: '/trade/[id]', params: { id: trade.id } })}
              />
            </React.Fragment>
          ))}
        </PixelCard>
      )}

      {/* 달력으로 이동 */}
      <PixelButton
        label="📅  달력에서 기록 보기"
        variant="outline"
        fullWidth
        onPress={() => router.push('/(tabs)/calendar')}
        style={styles.calendarBtn}
      />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: Spacing.md },
  header: { marginBottom: Spacing.lg },
  appTitle: {
    fontSize: FontSize.hero,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pnlCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  characterEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  pnlLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  pnlValue: { fontSize: FontSize.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addBtn: { paddingVertical: 6, paddingHorizontal: Spacing.sm },
  tradesCard: { marginBottom: Spacing.md },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  typeBadge: {
    borderRadius: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  tradeInfo: { flex: 1 },
  stockName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tradeDetail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tradeAmount: { alignItems: 'flex-end' },
  totalAmount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  feeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  calendarBtn: { marginTop: Spacing.sm },
});
