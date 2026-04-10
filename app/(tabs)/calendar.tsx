import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { useTradeStore } from '../../src/store/tradeStore';
import { PixelCard } from '../../src/components/ui/PixelCard';
import { PixelButton } from '../../src/components/ui/PixelButton';
import { Colors, FontSize, Spacing, PixelBorder } from '../../constants/theme';
import { Trade } from '../../src/types';

function formatYearMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedDate, dailyTrades, activeDates, setSelectedDate, loadActiveDates, loadDailyTrades } = useTradeStore();
  const [currentMonth, setCurrentMonth] = useState(formatYearMonth(new Date()));

  useEffect(() => {
    loadActiveDates(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    loadDailyTrades(selectedDate);
  }, [selectedDate]);

  // react-native-calendars markedDates 형식으로 변환
  const markedDates = Object.entries(activeDates).reduce<Record<string, any>>((acc, [date, info]) => {
    const dots = [];
    if (info.hasBuy)  dots.push({ key: 'buy',  color: Colors.accent });
    if (info.hasSell) dots.push({ key: 'sell', color: Colors.primary });

    acc[date] = {
      dots,
      selected: date === selectedDate,
      selectedColor: Colors.border,
    };
    return acc;
  }, {});

  // 선택된 날짜에 selected 표시
  if (!markedDates[selectedDate]) {
    markedDates[selectedDate] = { selected: true, selectedColor: Colors.border };
  } else {
    markedDates[selectedDate].selected = true;
    markedDates[selectedDate].selectedColor = Colors.border;
  }

  const isBuy = (t: Trade) => t.tradeType === 'BUY';

  return (
    <View style={styles.container}>
      {/* 달력 */}
      <Calendar
        current={selectedDate}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        onMonthChange={(month: DateData) => {
          const ym = `${month.year}-${String(month.month).padStart(2, '0')}`;
          setCurrentMonth(ym);
          loadActiveDates(ym);
        }}
        markingType="multi-dot"
        markedDates={markedDates}
        theme={{
          backgroundColor: Colors.background,
          calendarBackground: Colors.background,
          textSectionTitleColor: Colors.textSecondary,
          selectedDayBackgroundColor: Colors.border,
          selectedDayTextColor: '#fff',
          todayTextColor: Colors.primary,
          dayTextColor: Colors.textPrimary,
          textDisabledColor: Colors.textMuted,
          dotColor: Colors.accent,
          selectedDotColor: '#fff',
          arrowColor: Colors.primary,
          monthTextColor: Colors.textPrimary,
          textDayFontWeight: '600',
          textMonthFontWeight: '800',
          textDayHeaderFontWeight: '700',
          textDayFontSize: FontSize.sm,
          textMonthFontSize: FontSize.lg,
        }}
      />

      {/* 선택된 날짜의 매매 목록 */}
      <View style={styles.daySection}>
        <View style={styles.daySectionHeader}>
          <Text style={styles.dayTitle}>{selectedDate} 매매 기록</Text>
          <PixelButton
            label="+ 기록"
            variant="accent"
            onPress={() => router.push({ pathname: '/trade/new', params: { date: selectedDate } })}
            style={styles.addBtn}
          />
        </View>

        {dailyTrades.length === 0 ? (
          <PixelCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>이 날의 매매 기록이 없습니다.</Text>
          </PixelCard>
        ) : (
          <FlatList
            data={dailyTrades}
            keyExtractor={(t) => String(t.id)}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.tradeRow}
                onPress={() => router.push({ pathname: '/trade/[id]', params: { id: item.id } })}
              >
                <View style={[styles.badge, { backgroundColor: isBuy(item) ? Colors.accent : Colors.primary }]}>
                  <Text style={styles.badgeText}>{isBuy(item) ? '매수' : '매도'}</Text>
                </View>
                <Text style={styles.stockName}>{item.stockName}</Text>
                <Text style={styles.amount}>
                  {(item.price * item.quantity).toLocaleString()}원
                </Text>
              </TouchableOpacity>
            )}
            style={styles.list}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  daySection: { flex: 1, padding: Spacing.md },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addBtn: { paddingVertical: 5, paddingHorizontal: Spacing.sm },
  emptyCard: { alignItems: 'center', padding: Spacing.lg },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
  list: { ...PixelBorder, backgroundColor: Colors.surface },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  badge: {
    borderRadius: 2,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  badgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  stockName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight },
});
