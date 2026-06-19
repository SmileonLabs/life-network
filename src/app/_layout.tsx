import '@/global.css';

import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { type Href, Link, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { AppText, BottomNav, BrandWordmark, NetworkBadge } from '@/features/mock-wallet/ui';
import { AppProviders } from '@/providers/app-providers';
import { AuthGate } from '@/shared/layout/auth-gate';
import { colors, fonts } from '@/shared/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [fonts.regular]: require('../../assets/fonts/PretendardVariable.ttf'),
    [fonts.latinBlack]: require('../../assets/fonts/Lato-Black.ttf'),
    [fonts.latinBold]: require('../../assets/fonts/Lato-Bold.ttf'),
    [fonts.latinDisplay]: require('../../assets/fonts/Lato-Light.ttf'),
    [fonts.latinRegular]: require('../../assets/fonts/Lato-Regular.ttf'),
    [fonts.latinSemibold]: require('../../assets/fonts/Lato-Semibold.ttf'),
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StartupErrorBoundary>
        <AppProviders>
          <StatusBar style="dark" />
          <AuthGate>
            <View style={styles.appRoot}>
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
              <PersistentAppChrome />
            </View>
          </AuthGate>
        </AppProviders>
      </StartupErrorBoundary>
    </GestureHandlerRootView>
  );
}

type ChromeConfig = {
  backHref?: Href;
  badge: string;
  subtitle?: string;
  title?: string;
  wordmark?: boolean;
};

function getChromeConfig(pathname: string): ChromeConfig | null {
  if (pathname === '/') {
    return { badge: 'Devnet', wordmark: true };
  }

  if (pathname === '/missions') {
    return { badge: 'Points', wordmark: true };
  }

  if (pathname === '/tokens') {
    return { badge: 'Devnet', wordmark: true };
  }

  if (pathname.startsWith('/tokens/')) {
    return { backHref: '/tokens', badge: 'Devnet', subtitle: 'LIFE Network', title: 'Asset' };
  }

  if (pathname === '/activity') {
    return { badge: 'Devnet', wordmark: true };
  }

  if (pathname === '/profile') {
    return { badge: 'Devnet', wordmark: true };
  }

  return null;
}

function PersistentAppChrome() {
  const pathname = usePathname() || '/';
  const insets = useSafeAreaInsets();
  const config = getChromeConfig(pathname);

  if (!config) {
    return null;
  }

  return (
    <>
      <View style={[styles.chromeTop, { paddingTop: insets.top }]}>
        <View style={styles.chromeTopInner}>
          <View style={styles.chromeTitleRow}>
            {config.backHref ? (
              <Link href={config.backHref} asChild>
                <Pressable accessibilityLabel="Go back" accessibilityRole="button" style={styles.chromeBackButton}>
                  <ChevronLeft color={colors.text} size={23} />
                </Pressable>
              </Link>
            ) : null}
            {config.wordmark ? (
              <BrandWordmark compact />
            ) : (
              <View style={styles.chromeTitleCopy}>
                <AppText variant="title" style={styles.chromeTitle}>
                  {config.title}
                </AppText>
                {config.subtitle ? (
                  <AppText tone="muted" variant="caption">
                    {config.subtitle}
                  </AppText>
                ) : null}
              </View>
            )}
          </View>
          <NetworkBadge label={config.badge} />
        </View>
      </View>
      <View style={[styles.chromeBottom, { paddingBottom: insets.bottom }]}>
        <BottomNav />
      </View>
    </>
  );
}

type StartupErrorBoundaryProps = {
  children: ReactNode;
};

type StartupErrorBoundaryState = {
  error: Error | null;
};

class StartupErrorBoundary extends Component<StartupErrorBoundaryProps, StartupErrorBoundaryState> {
  state: StartupErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('LIFE Wallet startup error', error, info.componentStack);
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <View style={styles.errorRoot}>
        <ScrollView contentContainerStyle={styles.errorContent}>
          <Text style={styles.errorBrand}>LIFE NETWORK</Text>
          <Text style={styles.errorTitle}>Unable to start wallet</Text>
          <Text style={styles.errorMessage}>{error.message || 'An unexpected startup error occurred.'}</Text>
          <Pressable accessibilityRole="button" onPress={this.retry} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Try again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  chromeBackButton: {
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  chromeBottom: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopColor: 'rgba(31, 27, 22, 0.1)',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    maxWidth: 760,
    position: 'absolute',
    right: 0,
    width: '100%',
    zIndex: 20,
  },
  chromeTitle: {
    lineHeight: 26,
  },
  chromeTitleCopy: {
    gap: 1,
  },
  chromeTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  chromeTop: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    left: 0,
    maxWidth: 760,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 20,
  },
  chromeTopInner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: 20,
  },
  errorRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContent: {
    flexGrow: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  errorBrand: {
    color: colors.accent,
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 2,
  },
  errorTitle: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 28,
  },
  errorMessage: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  errorButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  errorButtonText: {
    color: colors.accentInk,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
