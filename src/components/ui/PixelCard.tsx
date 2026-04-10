import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, PixelBorder, PixelShadow, Spacing } from '../../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function PixelCard({ children, style, padding = Spacing.md }: Props) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    ...PixelBorder,
    ...PixelShadow,
  },
});
