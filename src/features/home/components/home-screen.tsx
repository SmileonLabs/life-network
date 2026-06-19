import * as Clipboard from 'expo-clipboard';
import { type Href, useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Droplets,
  Footprints,
  HeartPulse,
  Wallet,
} from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActivityListRow, AppScreen, TokenMark } from '@/features/mock-wallet/ui';
import { type MockActivity } from '@/features/mock-wallet/data';
import { useMissions } from '@/features/missions/hooks/use-missions';
import type { MissionId } from '@/features/missions/types';
import type { WalletActivity } from '@/features/activity/types';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { supportedChains } from '@/shared/config/chains';
import { colors, fonts } from '@/shared/theme/tokens';
import { formatCurrency, formatPercent, formatShortDate, formatTokenAmount, shortAddress } from '@/shared/utils/format';

const missionIcons: Record<MissionId, ReactNode> = {
  'drink-water': <Droplets color={colors.accent} size={18} />,
  'log-condition': <HeartPulse color={colors.accent} size={18} />,
  'walk-steps': <Footprints color={colors.accent} size={18} />,
};

const toMockActivity = (activity: WalletActivity): MockActivity => {
  const incoming = activity.direction === 'in';
  const amountPrefix = activity.amount > 0 ? (incoming ? '+' : '-') : '';

  return {
    amount: `${amountPrefix}${formatTokenAmount(activity.amount, activity.amount < 1 ? 6 : 2)} ${activity.symbol}`,
    asset: activity.symbol,
    date: formatShortDate(activity.timestamp),
    direction: activity.direction,
    hash: activity.hash,
    status: activity.status === 'success' ? 'Success' : activity.status === 'pending' ? 'Pending' : 'Failed',
    subtitle: activity.subtitle,
    title: activity.title,
  };
};

export function HomeScreen() {
  const router = useRouter();
  const { activeWallet, activities, assets, chainId, isRefreshing, lifeAsset, refreshActivityStatus, refreshWallet, totalUsd } = useWallet();
  const missions = useMissions();
  const [copied, setCopied] = useState(false);
  const chain = supportedChains[chainId];
  const walletAssets = useMemo(() => assets.slice(0, 2), [assets]);
  const recentActivities = activities.slice(0, 2).map(toMockActivity);
  const primaryAsset = lifeAsset ?? assets[0];

  const copyAddress = async () => {
    if (!activeWallet?.address) {
      return;
    }

    await Clipboard.setStringAsync(activeWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const refreshHome = () => {
    refreshWallet().catch(() => undefined);
    refreshActivityStatus().catch(() => undefined);
  };

  return (
    <AppScreen bottomNav refreshing={isRefreshing} onRefresh={refreshHome}>
      <View className="gap-5 pb-6">
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.walletTitleWrap}>
              <View style={styles.heroWalletIcon}>
                <Wallet color={colors.accentInk} size={18} />
              </View>
              <View style={styles.heroWalletCopy}>
                <Text style={styles.heroBadgeText}>MAIN WALLET</Text>
                <Text numberOfLines={1} style={styles.heroAddress}>{activeWallet ? shortAddress(activeWallet.address, 7, 6) : 'Creating wallet'}</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" disabled={!activeWallet} onPress={copyAddress} style={styles.heroCopyButton}>
              <Copy color={colors.accent} size={15} />
              <Text style={styles.heroLinkText}>{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
          </View>

          <View style={styles.heroMain}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Total assets</Text>
              <Text style={styles.heroPoints}>{formatCurrency(totalUsd)}</Text>
              <Text style={styles.heroSub}>
                {chain.shortName} · {assets.length} assets
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push('/tokens')} style={styles.heroManage}>
              <Text style={styles.heroManageText}>Assets</Text>
              <ChevronRight color={colors.accent} size={15} />
            </Pressable>
          </View>

          <View style={styles.heroStats}>
            <AssetMetric asset={primaryAsset} label="LIFE balance" />
          </View>

          <View style={styles.heroActions}>
            <HeroAction href="/send" icon={<ArrowUpRight color={colors.accentInk} size={18} />} label="Send" primary />
            <HeroAction href="/receive" icon={<ArrowDownLeft color={colors.text} size={18} />} label="Receive" />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader href="/missions" label="View all" title="Today's Missions" />
          <View style={styles.missionGrid}>
            {missions.missions.map((mission) => {
              const completed = Boolean(missions.state.completed[mission.id]);

              return (
                <Pressable
                  accessibilityRole="button"
                  key={mission.id}
                  onPress={() => router.push('/missions')}
                  style={[styles.missionTile, completed && styles.missionTileComplete]}>
                  <View style={styles.missionIcon}>{missionIcons[mission.id]}</View>
                  <View style={styles.missionCopy}>
                    <Text numberOfLines={1} style={styles.missionTitle}>{mission.title}</Text>
                    <Text style={completed ? styles.missionDone : styles.missionHint}>{completed ? 'Completed today' : 'Tap to complete'}</Text>
                  </View>
                  <View style={completed ? styles.missionStateDone : styles.missionState}>
                    {completed ? <Check color={colors.accentInk} size={13} /> : <Text style={styles.missionStateText}>+{mission.points} P</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader href="/tokens" label="Manage" title="Assets" />
          <View style={styles.assetStack}>
            {walletAssets.map((asset) => {
              const value = asset.balance * asset.priceUsd;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={asset.id}
                  onPress={() => router.push({ pathname: '/tokens/[address]', params: { address: asset.type === 'native' ? 'native' : asset.contractAddress ?? asset.id } })}
                  style={styles.assetRow}>
                  <TokenMark asset={asset} size={34} />
                  <View style={styles.assetCopy}>
                    <Text style={styles.assetName}>{asset.symbol}</Text>
                    <Text style={styles.assetMeta}>{formatTokenAmount(asset.balance, asset.type === 'native' ? 6 : 2)} {asset.symbol}</Text>
                  </View>
                  <View style={styles.assetValue}>
                    <Text style={styles.assetFiat}>{formatCurrency(value)}</Text>
                    <Text style={asset.change24h >= 0 ? styles.assetChangeUp : styles.assetChangeDown}>{formatPercent(asset.change24h)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader href="/activity" label="All" title="Recent Activity" />
          {recentActivities.length > 0 ? (
            <View style={styles.activityStack}>
              {recentActivities.map((activity) => (
                <ActivityListRow activity={activity} href={{ pathname: '/activity/[hash]', params: { hash: activity.hash } }} key={activity.hash} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptyText}>Mission rewards and wallet transfers will appear here.</Text>
            </View>
          )}
        </View>
      </View>
    </AppScreen>
  );
}

function AssetMetric({ asset, label }: { asset?: { balance: number; priceUsd: number; symbol: string; type: string }; label: string }) {
  if (!asset) {
    return (
      <View style={styles.metricCard}>
        <View style={styles.metricCopy}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={styles.metricValue}>Pending</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.metricValue}>
          {formatTokenAmount(asset.balance, asset.type === 'native' ? 4 : 2)} {asset.symbol}
        </Text>
        <Text numberOfLines={1} style={styles.metricSubValue}>{formatCurrency(asset.balance * asset.priceUsd)}</Text>
      </View>
    </View>
  );
}

function SectionHeader({ href, label, title }: { href: Href; label: string; title: string }) {
  const router = useRouter();

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push(href)} style={styles.sectionLink}>
        <Text style={styles.sectionLinkText}>{label}</Text>
        <ChevronRight color={colors.textSubtle} size={15} />
      </Pressable>
    </View>
  );
}

function HeroAction({ href, icon, label, primary = false }: { href: '/send' | '/receive'; icon: ReactNode; label: string; primary?: boolean }) {
  const router = useRouter();

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(href)} style={[styles.heroAction, primary && styles.heroActionPrimary]}>
      {icon}
      <Text style={primary ? styles.heroActionPrimaryText : styles.heroActionText}>{label}</Text>
    </Pressable>
  );
}

const cardShadow = Platform.select({
  web: {
    boxShadow: '0 18px 46px rgba(31, 27, 22, 0.11)',
  },
  default: {
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
});

const heroShadow = Platform.select({
  web: {
    boxShadow: '0 22px 58px rgba(31, 27, 22, 0.18), 0 0 48px rgba(225, 244, 50, 0.1)',
  },
  default: {
    elevation: 10,
    shadowColor: colors.accent,
    shadowOffset: { height: 20, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
  },
});

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  activityStack: {
    gap: 8,
  },
  assetChangeDown: {
    color: colors.danger,
    fontFamily: fonts.latinBold,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  assetChangeUp: {
    color: colors.success,
    fontFamily: fonts.latinBold,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  assetCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  assetFiat: {
    color: colors.text,
    fontFamily: fonts.latinBold,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  assetMeta: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  assetName: {
    color: colors.text,
    fontFamily: fonts.latinBold,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  assetRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 244, 0.72)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  assetStack: {
    gap: 8,
  },
  assetValue: {
    alignItems: 'flex-end',
    gap: 1,
  },
  cardKicker: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.latinBold,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 244, 0.72)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 11,
  },
  copyText: {
    color: colors.text,
    fontFamily: fonts.latinBold,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyActivity: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
    padding: 16,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  hero: {
    backgroundColor: colors.text,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    overflow: 'hidden',
    padding: 16,
    ...heroShadow,
  },
  heroAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 244, 0.1)',
    borderColor: 'rgba(250, 248, 244, 0.14)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
  },
  heroActionPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  heroActionPrimaryText: {
    color: colors.accentInk,
    fontFamily: fonts.latinBold,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 17,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroActionText: {
    color: colors.white,
    fontFamily: fonts.latinBold,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 17,
  },
  heroBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(225, 244, 50, 0.12)',
    borderColor: 'rgba(225, 244, 50, 0.28)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 32,
    paddingHorizontal: 11,
  },
  heroBadgeText: {
    color: colors.accent,
    fontFamily: fonts.latinBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroAddress: {
    color: colors.white,
    fontFamily: fonts.latinBold,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  heroCopyButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(225, 244, 50, 0.1)',
    borderColor: 'rgba(225, 244, 50, 0.22)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 10,
  },
  heroEyebrow: {
    color: 'rgba(250,248,244,0.68)',
    fontFamily: fonts.semibold,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  heroLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: 32,
  },
  heroLinkText: {
    color: colors.accent,
    fontFamily: fonts.latinBold,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 16,
  },
  heroManage: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(225, 244, 50, 0.12)',
    borderColor: 'rgba(225, 244, 50, 0.25)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    minHeight: 34,
    paddingLeft: 12,
    paddingRight: 8,
  },
  heroManageText: {
    color: colors.accent,
    fontFamily: fonts.latinBold,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 16,
  },
  heroMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  heroPoints: {
    color: colors.white,
    fontFamily: fonts.latinBlack,
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
  },
  heroSub: {
    color: 'rgba(250,248,244,0.72)',
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  heroTitle: {
    color: 'rgba(250,248,244,0.86)',
    fontFamily: fonts.semibold,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 23,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroWalletCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  heroWalletIcon: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  homeAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 27, 22, 0.05)',
    borderColor: 'rgba(31, 27, 22, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  homeActionPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  homeActionPrimaryText: {
    color: colors.accentInk,
    fontFamily: fonts.latinBold,
    fontSize: 13,
    fontWeight: '700',
  },
  homeActionText: {
    color: colors.text,
    fontFamily: fonts.latinBold,
    fontSize: 13,
    fontWeight: '700',
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 244, 0.1)',
    borderColor: 'rgba(250, 248, 244, 0.13)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 54,
    paddingHorizontal: 12,
  },
  metricCardHighlight: {
    backgroundColor: 'rgba(225, 244, 50, 0.11)',
    borderColor: 'rgba(225, 244, 50, 0.25)',
  },
  metricCopy: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    color: 'rgba(250,248,244,0.6)',
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  metricValue: {
    color: colors.white,
    fontFamily: fonts.latinBold,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  metricSubValue: {
    color: 'rgba(250,248,244,0.58)',
    fontFamily: fonts.latinBold,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  missionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  missionDone: {
    color: colors.success,
    fontFamily: fonts.latinBold,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  missionGrid: {
    backgroundColor: 'rgba(245, 241, 234, 0.76)',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    padding: 7,
  },
  missionHint: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  missionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 17, 31, 0.86)',
    borderColor: 'rgba(225, 244, 50, 0.18)',
    borderWidth: 1,
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  missionPoints: {
    color: colors.accentInk,
    fontFamily: fonts.latinBold,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  missionState: {
    alignItems: 'center',
    backgroundColor: 'rgba(225, 244, 50, 0.58)',
    borderColor: 'rgba(225, 244, 50, 0.9)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 30,
    minWidth: 42,
    paddingHorizontal: 9,
  },
  missionStateDone: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  missionStateText: {
    color: colors.accentInk,
    fontFamily: fonts.latinBold,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  missionTile: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 244, 0.82)',
    borderColor: 'rgba(31, 27, 22, 0.07)',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  missionTileComplete: {
    backgroundColor: 'rgba(225, 244, 50, 0.12)',
    borderColor: 'rgba(225, 244, 50, 0.32)',
  },
  missionTitle: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  ring: {
    alignItems: 'center',
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  ringCenter: {
    alignItems: 'center',
    position: 'absolute',
  },
  ringLabel: {
    color: 'rgba(250,248,244,0.6)',
    fontFamily: fonts.semibold,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
  },
  ringValue: {
    color: colors.white,
    fontFamily: fonts.latinBlack,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  sectionLinkText: {
    color: colors.textMuted,
    fontFamily: fonts.latinBold,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  walletCard: {
    backgroundColor: 'rgba(245, 241, 234, 0.88)',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 14,
    ...cardShadow,
  },
  walletCopy: {
    flex: 1,
    minWidth: 0,
  },
  walletHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  walletIcon: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  walletSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  walletSectionLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  walletSectionLinkText: {
    color: colors.textMuted,
    fontFamily: fonts.latinBold,
    fontSize: 12,
    fontWeight: '700',
  },
  walletSectionTitle: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  walletTitleWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 11,
    minWidth: 0,
  },
});
