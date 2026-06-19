import { type ReactNode } from 'react';
import { Wallet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

type WalletHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
};

export function WalletHeader({ rightSlot, subtitle, title }: WalletHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.identity}>
        <View style={styles.logo}>
          <Wallet color={colors.lime} size={19} />
        </View>
        <View style={styles.copy}>
          <AppText variant="caption" tone="lime">
            LIFE WALLET
          </AppText>
          <AppText numberOfLines={1} variant="subtitle">
            {title}
          </AppText>
          {Boolean(subtitle) && (
            <AppText numberOfLines={1} variant="caption" tone="muted">
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      {rightSlot && <View style={styles.actions}>{rightSlot}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(5, 10, 24, 0.82)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(170, 183, 255, 0.32)',
    backgroundColor: 'rgba(170, 183, 255, 0.11)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
