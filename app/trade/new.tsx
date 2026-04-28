import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { StockSearchInput } from '../../src/components/trade/StockSearchInput';
import { DateInput } from '../../src/components/ui/DateInput';
import { PixelButton } from '../../src/components/ui/PixelButton';
import { PixelCard } from '../../src/components/ui/PixelCard';
import { PixelInput } from '../../src/components/ui/PixelInput';
import { getTradeById } from '../../src/db/trades';
import { useBrokerStore } from '../../src/store/brokerStore';
import { useTradeStore } from '../../src/store/tradeStore';
import { TradeType } from '../../src/types';

// ─── 제세금 설정 ─────────────────────────────────────────────
// 코스피/코스닥 동일. 매도 시에만 부과됩니다.
const SELL_TAX_RATE_PCT = 0.2; // %

export default function NewTradeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ date?: string; id?: string }>();
  const today = new Date().toISOString().slice(0, 10);
  const initialDate = params.date ?? today;
  const editId = params.id ? Number(params.id) : null;
  const isEdit = editId !== null;

  const { addTrade, editTrade } = useTradeStore();
  const { brokers } = useBrokerStore();

  const [tradeType, setTradeType] = useState<TradeType>('BUY');
  const [stockName, setStockName] = useState('');
  const [ticker, setTicker] = useState('');
  const [date, setDate] = useState(initialDate);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fee, setFee] = useState('');
  const [brokerId, setBrokerId] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit) {
      const trade = getTradeById(editId);
      if (trade) {
        setTradeType(trade.tradeType);
        setStockName(trade.stockName);
        setTicker(trade.ticker ?? '');
        setDate(trade.date);
        setPrice(String(trade.price));
        setQuantity(String(trade.quantity));
        setFee(String(trade.fee));
        setBrokerId(trade.brokerId ?? null);
        setMemo(trade.memo ?? '');
      }
    }
  }, [editId]);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? '매매 수정' : '매매 기록' });
  }, [isEdit]);

  // ─── 수수료 계산 ─────────────────────────────────────────────
  function calcFee(p: number, q: number, type: TradeType, brokerFeeRate: number): number {
    const brokerage = (p * q * brokerFeeRate) / 100;
    const tax = type === 'SELL' ? (p * q * SELL_TAX_RATE_PCT) / 100 : 0;
    return brokerage + tax;
  }

  function recalcFee(overrideType?: TradeType) {
    const p = parseFloat(price);
    const q = parseFloat(quantity);
    if (isNaN(p) || isNaN(q) || p <= 0 || q <= 0) return;

    const type = overrideType ?? tradeType;
    const broker = brokerId !== null ? brokers.find((b) => b.id === brokerId) : null;
    const brokerFeeRate = broker?.feeRate ?? 0;

    setFee(calcFee(p, q, type, brokerFeeRate).toFixed(0));
  }

  // 매수↔매도 전환 시 수수료 재계산
  function handleTypeChange(type: TradeType) {
    setTradeType(type);
    recalcFee(type);
  }

  function selectBroker(id: number) {
    setBrokerId(id);
    const broker = brokers.find((b) => b.id === id);
    if (!broker) return;
    const p = parseFloat(price);
    const q = parseFloat(quantity);
    if (!isNaN(p) && !isNaN(q) && p > 0 && q > 0) {
      setFee(calcFee(p, q, tradeType, broker.feeRate).toFixed(0));
    }
  }

  // ─── 검증 ────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {};
    if (!stockName.trim()) e.stockName = '종목명을 입력하세요';
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) e.date = 'YYYYMMDD 또는 YYMMDD 형식으로 입력하세요';
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) e.price = '유효한 단가를 입력하세요';
    const q = parseInt(quantity);
    if (isNaN(q) || q <= 0) e.quantity = '유효한 수량을 입력하세요';
    const f = parseFloat(fee);
    if (fee !== '' && (isNaN(f) || f < 0)) e.fee = '수수료는 0 이상이어야 합니다';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const data = {
      date,
      stockName: stockName.trim(),
      ticker: ticker.trim(),
      tradeType,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      fee: parseFloat(fee) || 0,
      brokerId,
      memo: memo.trim(),
    };
    if (isEdit) {
      editTrade(editId, data);
    } else {
      addTrade(data);
    }
    router.back();
  }

  // ─── 요약 계산 ────────────────────────────────────────────────
  const p = parseFloat(price) || 0;
  const q = parseInt(quantity) || 0;
  const totalAmount = p * q;
  const feeNum = parseFloat(fee) || 0;

  // 수수료 구성 미리보기 (브로커 있을 때)
  const broker = brokerId !== null ? brokers.find((b) => b.id === brokerId) : null;
  const previewBrokerage = broker ? (p * q * broker.feeRate) / 100 : 0;
  const previewTax = tradeType === 'SELL' ? (p * q * SELL_TAX_RATE_PCT) / 100 : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 매수/매도 토글 */}
      <PixelCard style={styles.typeCard} padding={Spacing.sm}>
        <TouchableOpacity
          style={[styles.typeBtn, tradeType === 'BUY' && { backgroundColor: Colors.accent }]}
          onPress={() => handleTypeChange('BUY')}
        >
          <Text style={[styles.typeBtnText, tradeType === 'BUY' && styles.typeActiveText]}>
            매수
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, tradeType === 'SELL' && { backgroundColor: Colors.primary }]}
          onPress={() => handleTypeChange('SELL')}
        >
          <Text style={[styles.typeBtnText, tradeType === 'SELL' && styles.typeActiveText]}>
            매도
          </Text>
        </TouchableOpacity>
      </PixelCard>

      <PixelCard>
        {/* 종목 검색 (자동완성 + 티커) */}
        <StockSearchInput
          stockName={stockName}
          ticker={ticker}
          onChangeStockName={setStockName}
          onChangeTicker={setTicker}
          error={errors.stockName}
        />

        {/* 날짜 자동 정제 */}
        <DateInput
          label="거래일자 *"
          value={date}
          onChange={setDate}
          error={errors.date}
        />

        <PixelInput
          label="단가 *"
          placeholder="0"
          value={price}
          onChangeText={setPrice}
          onBlur={() => recalcFee()}
          keyboardType="numeric"
          suffix="원"
          error={errors.price}
        />
        <PixelInput
          label="수량 *"
          placeholder="0"
          value={quantity}
          onChangeText={setQuantity}
          onBlur={() => recalcFee()}
          keyboardType="numeric"
          suffix="주"
          error={errors.quantity}
        />

        {/* 증권사 선택 */}
        {brokers.length > 0 && (
          <View style={styles.brokerSection}>
            <Text style={styles.fieldLabel}>증권사 (수수료 자동 계산)</Text>
            <View style={styles.brokerRow}>
              <TouchableOpacity
                style={[styles.brokerChip, brokerId === null && styles.brokerChipSelected]}
                onPress={() => setBrokerId(null)}
              >
                <Text style={[styles.brokerChipText, brokerId === null && styles.brokerChipSelectedText]}>
                  직접 입력
                </Text>
              </TouchableOpacity>
              {brokers.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.brokerChip, brokerId === b.id && styles.brokerChipSelected]}
                  onPress={() => selectBroker(b.id)}
                >
                  <Text style={[styles.brokerChipText, brokerId === b.id && styles.brokerChipSelectedText]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 수수료 (자동 계산 내역 표시) */}
        <PixelInput
          label={`수수료${tradeType === 'SELL' ? ` (증권사 수수료 + 제세금 ${SELL_TAX_RATE_PCT}%)` : ''}`}
          placeholder="0"
          value={fee}
          onChangeText={setFee}
          keyboardType="numeric"
          suffix="원"
          error={errors.fee}
        />
        {/* 수수료 구성 미리보기 */}
        {totalAmount > 0 && tradeType === 'SELL' && (
          <View style={styles.taxBreakdown}>
            {broker && (
              <Text style={styles.taxLine}>
                증권사 수수료: {previewBrokerage.toFixed(0)}원 ({broker.feeRate}%)
              </Text>
            )}
            <Text style={styles.taxLine}>
              제세금: {previewTax.toFixed(0)}원 ({SELL_TAX_RATE_PCT}%)
            </Text>
          </View>
        )}

        <PixelInput
          label="메모"
          placeholder="매매 이유, 전략 등..."
          value={memo}
          onChangeText={setMemo}
          multiline
          numberOfLines={3}
          containerStyle={{ marginBottom: 0 }}
        />
      </PixelCard>

      {/* 거래금액 요약 */}
      {totalAmount > 0 && (
        <PixelCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>거래금액</Text>
            <Text style={styles.summaryValue}>{totalAmount.toLocaleString()}원</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {tradeType === 'BUY' ? '수수료 포함 (실매수)' : '수수료+세금 차감 (실수령)'}
            </Text>
            <Text style={[
              styles.summaryValue,
              { color: tradeType === 'BUY' ? Colors.danger : Colors.accent },
            ]}>
              {tradeType === 'BUY'
                ? (totalAmount + feeNum).toLocaleString()
                : (totalAmount - feeNum).toLocaleString()
              }원
            </Text>
          </View>
        </PixelCard>
      )}

      <PixelButton
        label={isEdit ? '수정 완료' : '저장하기'}
        variant={tradeType === 'BUY' ? 'accent' : 'primary'}
        fullWidth
        onPress={handleSave}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  typeCard: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  typeBtnText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textSecondary },
  typeActiveText: { color: '#fff' },
  brokerSection: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
  brokerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  brokerChip: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: 2,
    backgroundColor: Colors.background,
  },
  brokerChipSelected: { borderColor: Colors.border, backgroundColor: Colors.border },
  brokerChipText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textPrimary },
  brokerChipSelectedText: { color: '#fff' },
  taxBreakdown: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 2,
    padding: Spacing.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    gap: 2,
  },
  taxLine: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  summaryCard: { gap: Spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  saveBtn: { marginTop: Spacing.xs },
});
