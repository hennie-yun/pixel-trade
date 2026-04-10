import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  searchStocks,
  StockInfo,
  getSyncStatus,
  getSyncError,
  onSyncStatusChange,
  syncStockMaster,
  SyncStatus,
} from '../../utils/stockSearch';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

interface Props {
  stockName: string;
  ticker: string;
  onChangeStockName: (name: string) => void;
  onChangeTicker: (ticker: string) => void;
  error?: string;
}

export function StockSearchInput({
  stockName,
  ticker,
  onChangeStockName,
  onChangeTicker,
  error,
}: Props) {
  const [suggestions, setSuggestions] = useState<StockInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus);
  const [syncing, setSyncing] = useState(false);

  // 동기 상태 구독
  useEffect(() => {
    const unsub = onSyncStatusChange((s) => setSyncStatus(s));
    return () => { unsub(); };
  }, []);

  const handleChangeText = useCallback((text: string) => {
    onChangeStockName(text);
    if (text.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const results = searchStocks(text);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }, [onChangeStockName]);

  function handleSelect(stock: StockInfo) {
    onChangeStockName(stock.name);
    onChangeTicker(stock.ticker);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleBlur() {
    setTimeout(() => setShowSuggestions(false), 150);
  }

  async function handleRetrySync() {
    setSyncing(true);
    try {
      await syncStockMaster();
      // 현재 입력값으로 재검색
      if (stockName.trim()) {
        const results = searchStocks(stockName);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }
    } catch (_) {
      // 에러는 syncStatus로 전달됨
    } finally {
      setSyncing(false);
    }
  }

  const marketColor = (market: string) =>
    market === 'KOSPI' ? Colors.primary : Colors.accent;

  // ─── 상태 배너 ───────────────────────────────────────────────
  const renderStatusBanner = () => {
    if (syncStatus === 'loading' || syncing) {
      return (
        <View style={styles.banner}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.bannerText}>KRX 종목 정보 업데이트 중...</Text>
        </View>
      );
    }
    if (syncStatus === 'error') {
      return (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerText}>
            종목 정보 로드 실패{' '}
            <Text style={styles.retryLink} onPress={handleRetrySync}>
              [재시도]
            </Text>
          </Text>
          <Text style={styles.bannerSub}>{getSyncError()}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.wrapper}>
      {/* 상태 배너 */}
      {renderStatusBanner()}

      {/* 종목명 입력 */}
      <Text style={styles.label}>종목명 *</Text>
      <View style={[styles.inputRow, error ? styles.inputError : undefined]}>
        <TextInput
          style={styles.input}
          placeholder="예: 삼성전자  /  ㅅㅅㅈ  /  005930"
          placeholderTextColor={Colors.textMuted}
          value={stockName}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          autoCorrect={false}
        />
        {ticker ? (
          <View style={styles.tickerBadge}>
            <Text style={styles.tickerBadgeText}>{ticker}</Text>
          </View>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* 자동완성 드롭다운 */}
      {showSuggestions && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.ticker}
            scrollEnabled={false}
            keyboardShouldPersistTaps="always"
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionLeft}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <Text style={styles.suggestionTicker}>{item.ticker}</Text>
                </View>
                <View style={[styles.marketBadge, { borderColor: marketColor(item.market) }]}>
                  <Text style={[styles.marketText, { color: marketColor(item.market) }]}>
                    {item.market}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md, zIndex: 10 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 2,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bannerWarn: { borderColor: Colors.secondary, backgroundColor: '#FFF9E6' },
  bannerError: { borderColor: Colors.danger, backgroundColor: '#FFF0F0' },
  bannerText: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: '600', flex: 1 },
  bannerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '400' },
  retryLink: { color: Colors.primary, textDecorationLine: 'underline' },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 2,
    backgroundColor: Colors.background,
  },
  inputError: { borderColor: Colors.danger },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tickerBadge: {
    marginRight: Spacing.sm,
    paddingVertical: 3,
    paddingHorizontal: 7,
    backgroundColor: Colors.secondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 2,
  },
  tickerBadgeText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.textPrimary },
  errorText: { fontSize: FontSize.xs, color: Colors.danger, marginTop: Spacing.xs },
  dropdown: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 2,
    backgroundColor: Colors.background,
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  suggestionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  suggestionName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  suggestionTicker: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  marketBadge: { borderWidth: 1.5, borderRadius: 2, paddingVertical: 2, paddingHorizontal: 6 },
  marketText: { fontSize: FontSize.xs, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.borderLight },
});
