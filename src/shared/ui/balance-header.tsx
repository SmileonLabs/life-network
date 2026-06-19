import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { QuickActionGrid, type QuickAction } from '@/shared/ui/quick-action-grid';

type BalanceHeaderDetail = {
  label: string;
  value: string;
};

type BalanceHeaderProps = {
  primaryLabel: string;
  primaryAmount: string;
  secondaryAmount?: string;
  networkLabel?: string;
  details?: BalanceHeaderDetail[];
  actions?: QuickAction[];
  footer?: ReactNode;
};

export function BalanceHeader({
  actions,
  details,
  footer,
  networkLabel,
  primaryAmount,
  primaryLabel,
  secondaryAmount,
}: BalanceHeaderProps) {
  return (
    <View style={styles.card}>
      <View style={styles.waveOne} />
      <View style={styles.waveTwo} />
      <View style={styles.topRule} />
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <AppText variant="caption" tone="muted">
            {primaryLabel}
          </AppText>
          {Boolean(networkLabel) && (
            <View style={styles.networkPill}>
              <View style={styles.networkDot} />
              <AppText variant="caption" tone="lime">
                {networkLabel}
              </AppText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.amountGroup}>
        <AppText adjustsFontSizeToFit numberOfLines={1} variant="hero" style={styles.amount}>
          {primaryAmount}
        </AppText>
        {Boolean(secondaryAmount) && <AppText tone="muted">{secondaryAmount}</AppText>}
      </View>

      {Boolean(details?.length) && (
        <View style={styles.details}>
          {details?.map((detail) => (
            <View style={styles.detail} key={detail.label}>
              <AppText variant="caption" tone="subtle">
                {detail.label}
              </AppText>
              <AppText numberOfLines={1}>{detail.value}</AppText>
            </View>
          ))}
        </View>
      )}

      {Boolean(actions?.length) && <QuickActionGrid actions={actions ?? []} />}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  topRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.lime,
    opacity: 0.86,
  },
  headerRow: {
    minHeight: 28,
    justifyContent: 'center',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  networkPill: {
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
  amountGroup: {
    gap: spacing.xs,
  },
  amount: {
    fontSize: 38,
  },
  details: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detail: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    padding: spacing.md,
  },
});
