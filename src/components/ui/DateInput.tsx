import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

interface Props {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

/**
 * 날짜 자동 정제 입력
 *
 * 입력 패턴:
 *  - 숫자 6자리 (YYMMDD)   → 2026-03-26
 *  - 숫자 8자리 (YYYYMMDD) → 2026-03-26
 *  - 입력 중 자동 대시 삽입: 4자리 뒤, 6자리 뒤
 */
export function DateInput({ label, value, onChange, error, containerStyle }: Props) {

  function applyFormat(digits: string): string {
    // 6자리 YYMMDD → 20YYMMDD
    if (digits.length === 6) {
      const full = '20' + digits;
      return `${full.slice(0, 4)}-${full.slice(4, 6)}-${full.slice(6, 8)}`;
    }
    // 8자리 YYYYMMDD
    if (digits.length >= 8) {
      const d = digits.slice(0, 8);
      return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    }
    // 타이핑 중 — 대시 자동 삽입
    if (digits.length > 6) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    }
    if (digits.length > 4) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    return digits;
  }

  function handleChangeText(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    onChange(applyFormat(digits));
  }

  function handleBlur() {
    // blur 시 남은 6자리 처리 (타이핑 완료 시점)
    const digits = value.replace(/\D/g, '');
    if (digits.length === 6 || digits.length === 8) {
      onChange(applyFormat(digits));
    }
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputError : undefined]}>
        <TextInput
          style={styles.input}
          placeholder="YYYYMMDD  또는  YYMMDD"
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          keyboardType="numeric"
          maxLength={10}
        />
        <Text style={styles.hint}>📅</Text>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.subHint}>260326 또는 20260326 입력 가능</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
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
    letterSpacing: 1,
  },
  hint: {
    paddingRight: Spacing.sm,
    fontSize: 16,
  },
  subHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 3,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
});
