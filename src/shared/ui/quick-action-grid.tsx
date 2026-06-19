import { type ReactNode } from 'react';
import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

export type QuickAction = {
  label: string;
  icon: ReactNode;
  href?: Href;
  onPress?: () => void;
  emphasis?: 'primary' | 'secondary';
};

type QuickActionGridProps = {
  actions: QuickAction[];
};

export function QuickActionGrid({ actions }: QuickActionGridProps) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <QuickActionButton action={action} key={action.label} />
      ))}
    </View>
  );
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const button = (
    <Pressable
      accessibilityRole="button"
      onPress={action.onPress}
      style={StyleSheet.flatten([
        styles.button,
        action.emphasis === 'primary' && styles.buttonPrimary,
      ])}>
      <View style={StyleSheet.flatten([styles.icon, action.emphasis === 'primary' && styles.iconPrimary])}>
        {action.icon}
      </View>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        variant="caption"
        tone={action.emphasis === 'primary' ? 'lime' : 'muted'}
        style={styles.label}>
        {action.label}
      </AppText>
    </Pressable>
  );

  if (action.href) {
    return (
      <Link href={action.href} asChild>
        {button}
      </Link>
    );
  }

  return button;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minWidth: 0,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    paddingHorizontal: spacing.sm,
  },
  buttonPrimary: {
    borderColor: 'rgba(170, 183, 255, 0.36)',
    backgroundColor: 'rgba(170, 183, 255, 0.1)',
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconPrimary: {
    backgroundColor: 'rgba(170, 183, 255, 0.18)',
  },
  label: {
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
});
