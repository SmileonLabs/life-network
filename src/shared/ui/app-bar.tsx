import { type ReactNode } from 'react';
import { Wallet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

type AppBarProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
};

export function AppBar({ title, subtitle, rightSlot }: AppBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.identity}>
        <View style={styles.logo}>
          <Wallet color={colors.lime} size={20} />
        </View>
        <View style={styles.copy}>
          <AppText variant="caption" tone="lime">
            LIFE Wallet
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
      {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(3, 6, 18, 0.72)',
  },
  identity: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 255, 92, 0.34)',
    backgroundColor: 'rgba(184, 255, 92, 0.12)',
  },
  copy: {
    minWidth: 0,
    flex: 1,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
