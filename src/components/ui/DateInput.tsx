import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Text, TextInput, TouchableOpacity, View, ViewStyle, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

interface Props {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

function toDateObject(value: string): Date {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateInput({ label, value, onChange, error, containerStyle }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  function applyFormat(digits: string): string {
    if (digits.length === 6) {
      const full = '20' + digits;
      return `${full.slice(0, 4)}-${full.slice(4, 6)}-${full.slice(6, 8)}`;
    }
    if (digits.length >= 8) {
      const d = digits.slice(0, 8);
      return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    }
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
    const digits = value.replace(/\D/g, '');
    if (digits.length === 6 || digits.length === 8) {
      onChange(applyFormat(digits));
    }
  }

  function handlePickerChange(_: any, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) onChange(toIsoDate(selected));
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
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.calendarBtn}>
          <Text style={styles.hint}>📅</Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.subHint}>260326 또는 20260326 입력 가능</Text>
      )}

      {showPicker && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          value={toDateObject(value)}
          onChange={handlePickerChange}
          onTouchCancel={() => setShowPicker(false)}
        />
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
  calendarBtn: { paddingRight: Spacing.sm, paddingLeft: Spacing.xs },
  hint: { fontSize: 16 },
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
