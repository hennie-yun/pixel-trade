import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { getTradeById } from '../../src/db/trades';
import { useTradeStore } from '../../src/store/tradeStore';
import { PixelCard } from '../../src/components/ui/PixelCard';
import { PixelButton } from '../../src/components/ui/PixelButton';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { Trade } from '../../src/types';

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

export default function TradeDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const { removeTrade } = useTradeStore();
  const [trade, setTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (params.id) {
      const t = getTradeById(Number(params.id));
      setTrade(t);
    }
  }, [params.id]);

  useEffect(() => {
    if (trade) {
      navigation.setOptions({
        title: trade.stockName,
      });
    }
  }, [trade]);

  function handleDelete() {
    Alert.alert('삭제', '이 매매 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          if (trade) {
            removeTrade(trade.id);
            router.back();
          }
        },
      },
    ]);
  }

  if (!trade) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>기록을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const isBuy = trade.tradeType === 'BUY';
  const totalAmount = trade.price * trade.quantity;
  const netAmount = isBuy
    ? totalAmount + trade.fee
    : totalAmount - trade.fee;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 매매 유형 배지 */}
      <View style={[styles.typeBadge, { backgroundColor: isBuy ? Colors.accent : Colors.primary }]}>
        <Text style={styles.typeText}>{isBuy ? '매수' : '매도'}</Text>
      </View>

      <Text style={styles.stockTitle}>{trade.stockName}</Text>
      {trade.ticker ? <Text style={styles.ticker}>{trade.ticker}</Text> : null}

      {/* 기본 정보 */}
      <PixelCard style={styles.section}>
        <Row label="거래일자" value={trade.date} />
        <View style={styles.divider} />
        <Row label="단가" value={`${trade.price.toLocaleString()}원`} />
        <View style={styles.divider} />
        <Row label="수량" value={`${trade.quantity.toLocaleString()}주`} />
        <View style={styles.divider} />
        <Row label="수수료" value={`${trade.fee.toLocaleString()}원`} />
        <View style={styles.divider} />
        <Row
          label={isBuy ? '총 매수금액' : '총 매도금액'}
          value={`${totalAmount.toLocaleString()}원`}
        />
        <View style={styles.divider} />
        <Row
          label={isBuy ? '수수료 포함' : '실수령액'}
          value={`${netAmount.toLocaleString()}원`}
          valueColor={isBuy ? Colors.danger : Colors.accent}
        />
      </PixelCard>

      {/* 메모 */}
      {trade.memo ? (
        <PixelCard style={styles.section}>
          <Text style={styles.memoLabel}>메모</Text>
          <Text style={styles.memoText}>{trade.memo}</Text>
        </PixelCard>
      ) : null}

      {/* 삭제 버튼 */}
      <PixelButton
        label="이 기록 삭제"
        variant="danger"
        fullWidth
        onPress={handleDelete}
        style={styles.deleteBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: FontSize.md, color: Colors.textMuted },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  typeText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
  stockTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ticker: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  section: { marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  rowValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  memoLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  memoText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
  deleteBtn: { marginTop: Spacing.sm },
});
