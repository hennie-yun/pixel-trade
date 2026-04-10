import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../../../constants/theme';

interface Props {
  value: number;
  style?: TextStyle;
  showSign?: boolean;
  suffix?: string;
}

// 손익 값에 따라 색상 자동 적용
export function PnlText({ value, style, showSign = true, suffix = '원' }: Props) {
  const color = value > 0 ? Colors.accent : value < 0 ? Colors.danger : Colors.textSecondary;
  const sign = showSign && value > 0 ? '+' : '';
  const formatted = Math.abs(value).toLocaleString('ko-KR');

  return (
    <Text style={[styles.text, { color }, style]}>
      {sign}{value < 0 ? '-' : ''}{formatted}{suffix}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
