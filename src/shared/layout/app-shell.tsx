import { type ReactNode } from 'react';
import { type Href, Link } from 'expo-router';
import { ChevronDown, UserRound, Wifi } from 'lucide-react-native';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { supportedChains } from '@/shared/config/chains';
import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { BottomNav } from '@/shared/ui/bottom-nav';
import { ScreenScaffold } from '@/shared/ui/screen-scaffold';
import { shortAddress } from '@/shared/utils/format';

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerSlot?: ReactNode;
  accessorySlot?: ReactNode;
  profileHref?: Href;
};

export function AppShell({
  accessorySlot,
  children,
  headerSlot,
  profileHref = '/profile',
  subtitle,
  title,
}: AppShellProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBand} />
      <View style={styles.midBand} />
      <View style={[styles.root, isWide && styles.rootWide]}>
        <ScreenScaffold
          accessorySlot={accessorySlot}
          headerSlot={headerSlot}
          rightSlot={<HeaderActions profileHref={profileHref} />}
          subtitle={subtitle}
          title={title}>
          {children}
        </ScreenScaffold>
      </View>
      <View style={[styles.navWrap, isWide && styles.navWrapWide]}>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

function HeaderActions({ profileHref }: { profileHref: Href }) {
  const { user } = useAuthSession();
  const { activeWallet, chainId, setChainId } = useWallet();
  const chain = supportedChains[chainId];

  function toggleChain() {
    setChainId(chainId === 103 ? 101 : 103);
  }

  return (
    <>
      <Pressable accessibilityRole="button" onPress={toggleChain} style={styles.networkButton}>
        <Wifi color={colors.success} size={15} />
        <View style={styles.networkCopy}>
          <AppText numberOfLines={1} variant="caption" tone="lime">
            {chain.shortName}
          </AppText>
          <AppText numberOfLines={1} variant="caption" tone="subtle">
            {activeWallet ? shortAddress(activeWallet.address, 4, 3) : 'No wallet'}
          </AppText>
        </View>
        <ChevronDown color={colors.textMuted} size={14} />
      </Pressable>
      <Link href={profileHref} asChild>
        <Pressable accessibilityRole="button" style={styles.profileButton}>
          {user?.avatarInitials ? (
            <AppText variant="caption" tone="lime">
              {user.avatarInitials}
            </AppText>
          ) : (
            <UserRound color={colors.lime} size={18} />
          )}
        </Pressable>
      </Link>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(194, 216, 254, 0.07)',
  },
  midBand: {
    position: 'absolute',
    top: 102,
    left: 0,
    right: 0,
    height: 160,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.045)',
    backgroundColor: 'rgba(170, 183, 255, 0.035)',
    transform: [{ rotate: '-3deg' }],
  },
  root: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 96,
  },
  rootWide: {
    alignSelf: 'center',
    maxWidth: 1160,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  navWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  navWrapWide: {
    left: '50%',
    right: undefined,
    width: 680,
    marginLeft: -340,
  },
  networkButton: {
    maxWidth: 164,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: spacing.sm,
  },
  networkCopy: {
    minWidth: 0,
  },
  profileButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(170, 183, 255, 0.28)',
    backgroundColor: 'rgba(170, 183, 255, 0.1)',
  },
});
