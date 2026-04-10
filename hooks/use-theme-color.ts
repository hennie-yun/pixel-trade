// PixelTrade는 라이트 모드만 사용합니다.
// 이 훅은 기존 컴포넌트 호환용으로 유지합니다.
export function useThemeColor(
  props: { light?: string; dark?: string },
  _colorName?: string,
): string {
  return props.light ?? '#000000';
}
