export const Colors = {
  primary: '#4A90E2',
  secondary: '#FFD700',
  accent: '#4CAF50',
  danger: '#E25454',
  background: '#FFFFFF',
  surface: '#F5F8FF',
  border: '#333333',
  borderLight: '#CCCCCC',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  tabBar: '#FAFAFA',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
} as const;

export const PixelBorder = {
  borderWidth: 2,
  borderColor: Colors.border,
  borderRadius: 2,
} as const;

export const PixelShadow = {
  shadowColor: Colors.border,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
} as const;
