import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { initDb } from '../src/db/schema';
import { initStockMaster } from '../src/utils/stockSearch';
import { Colors, FontSize } from '../constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDb()
      .then(() => {
        // 종목 마스터 초기화 (백그라운드 — 실패해도 앱은 정상 동작)
        initStockMaster().catch(() => {});
        setReady(true);
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.center}>
          <Text style={styles.errorText}>DB 초기화 실패: {error}</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.center}>
          <Text style={styles.loadingText}>PixelTrade 로딩 중...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="trade/[id]"
          options={{ title: '매매 상세', headerShown: true, headerBackTitle: '뒤로' }}
        />
        <Stack.Screen
          name="trade/new"
          options={{ title: '매매 기록', presentation: 'modal', headerShown: true }}
        />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    textAlign: 'center',
    padding: 20,
  },
});
