import '@/global.css';

import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProviders } from '@/providers/app-providers';
import { AuthGate } from '@/shared/layout/auth-gate';
import { colors } from '@/shared/theme/tokens';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <StatusBar style="light" />
        <AuthGate>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              animationDuration: 220,
              contentStyle: {
                backgroundColor: colors.background,
              },
              fullScreenGestureEnabled: true,
              gestureEnabled: true,
              headerShown: false,
            }}
          />
        </AuthGate>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
