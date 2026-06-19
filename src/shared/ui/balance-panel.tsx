import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { QuickActionRail, type WalletAction } from '@/shared/ui/quick-action-rail';

type BalancePanelMetric = {
  label: string;
  value: string;
  caption?: string;
};

type BalancePanelProps = {
  label: string;
  amount: string;
  caption?: string;
  networkLabel?: string;
  metrics?: BalancePanelMetric[];
  actions?: WalletAction[];
  footer?: ReactNode;
};

export function BalancePanel({
  actions,
  amount,
  caption,
  footer,
  label,
  metrics,
  networkLabel,
}: BalancePanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.waveOne} />
      <View style={styles.waveTwo} />
      <View style={styles.topLine} />

      <View style={styles.topRow}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        {Boolean(networkLabel) && (
          <View style={styles.network}>
            <View style={styles.networkDot} />
            <AppText variant="caption" tone="lime">
              {networkLabel}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.balance}>
        <AppText adjustsFontSizeToFit numberOfLines={1} variant="hero" style={styles.amount}>
          {amount}
        </AppText>
        {Boolean(caption) && <AppText tone="muted">{caption}</AppText>}
      </View>

      {Boolean(metrics?.length) && (
        <View style={styles.metrics}>
          {metrics?.map((metric) => (
            <View style={styles.metric} key={metric.label}>
              <AppText variant="caption" tone="subtle">
                {metric.label}
              </AppText>
              <AppText numberOfLines={1}>{metric.value}</AppText>
              {Boolean(metric.caption) && (
                <AppText numberOfLines={1} variant="caption" tone="muted">
                  {metric.caption}
                </AppText>
              )}
            </View>
          ))}
        </View>
      )}

      {Boolean(actions?.length) && <QuickActionRail actions={actions ?? []} />}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'relative',
    gap: spacing.lg,
    overflow: 'hidden',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#0c1730',
    padding: spacing.xl,
    ...shadows.card,
  },
  waveOne: {
    position: 'absolute',
    left: -78,
    right: -54,
    bottom: -66,
    height: 132,
    borderRadius: 100,
    backgroundColor: 'rgba(194, 216, 254, 0.1)',
    transform: [{ rotate: '-4deg' }],
  },
  waveTwo: {
    position: 'absolute',
    left: -42,
    right: -94,
    bottom: -38,
    height: 110,
    borderRadius: 100,
    backgroundColor: 'rgba(170, 183, 255, 0.1)',
    transform: [{ rotate: '6deg' }],
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 3,
    borderBottomLeftRadius: radius.round,
    borderBottomRightRadius: radius.round,
    backgroundColor: colors.lime,
    opacity: 0.92,
  },
  topRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  network: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: 'rgba(170, 183, 255, 0.26)',
    backgroundColor: 'rgba(170, 183, 255, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  networkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  balance: {
    gap: spacing.xs,
  },
  amount: {
    fontSize: 38,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    padding: spacing.md,
  },
});
