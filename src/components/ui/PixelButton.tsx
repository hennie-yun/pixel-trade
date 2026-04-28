import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

type Variant = 'primary' | 'accent' | 'danger' | 'outline' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string; border: string }> = {
  primary: { bg: Colors.primary,          text: '#fff',              border: Colors.border },
  accent:  { bg: Colors.accent,           text: '#fff',              border: Colors.border },
  danger:  { bg: Colors.danger,           text: '#fff',              border: Colors.border },
  outline: { bg: Colors.background,       text: Colors.textPrimary,  border: Colors.border },
  ghost:   { bg: Colors.background,       text: Colors.textSecondary, border: 'transparent' },
};

export function PixelButton({
  label, onPress, variant = 'primary',
  style, textStyle, disabled, loading, fullWidth,
}: Props) {
  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={v.text} size="small" />
        : <Text style={[styles.label, { color: v.text }, textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 2,
    borderRadius: 2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    // 픽셀 드롭섀도
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
