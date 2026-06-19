import { type ReactNode } from 'react';
import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

export type WalletAction = {
  label: string;
  description?: string;
  icon: ReactNode;
  href?: Href;
  onPress?: () => void;
  tone?: 'primary' | 'neutral' | 'cyan' | 'amber';
};

type QuickActionRailProps = {
  actions: WalletAction[];
};

export function QuickActionRail({ actions }: QuickActionRailProps) {
  return (
    <View style={styles.rail}>
      {actions.map((action) => (
        <ActionButton action={action} key={action.label} />
      ))}
    </View>
  );
}

function ActionButton({ action }: { action: WalletAction }) {
  const button = (
    <Pressable
      accessibilityRole="button"
      disabled={!action.href && !action.onPress}
      onPress={action.onPress}
      style={StyleSheet.flatten([
        styles.button,
        action.tone === 'primary' && styles.primaryButton,
        action.tone === 'cyan' && styles.cyanButton,
        action.tone === 'amber' && styles.amberButton,
      ])}>
      <View
        style={StyleSheet.flatten([
          styles.icon,
          action.tone === 'primary' && styles.primaryIcon,
          action.tone === 'cyan' && styles.cyanIcon,
          action.tone === 'amber' && styles.amberIcon,
        ])}>
        {action.icon}
      </View>
      <View style={styles.copy}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          variant="caption"
          tone={action.tone === 'primary' ? 'lime' : 'muted'}
          style={styles.label}>
          {action.label}
        </AppText>
        {Boolean(action.description) && (
          <AppText numberOfLines={1} variant="caption" tone="subtle" style={styles.description}>
            {action.description}
          </AppText>
        )}
      </View>
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
  rail: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minWidth: 0,
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: spacing.xs,
  },
  primaryButton: {
    borderColor: 'rgba(170, 183, 255, 0.38)',
    backgroundColor: 'rgba(170, 183, 255, 0.11)',
  },
  cyanButton: {
    borderColor: 'rgba(194, 216, 254, 0.28)',
  },
  amberButton: {
    borderColor: 'rgba(255, 204, 102, 0.28)',
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryIcon: {
    backgroundColor: 'rgba(170, 183, 255, 0.18)',
  },
  cyanIcon: {
    backgroundColor: 'rgba(194, 216, 254, 0.12)',
  },
  amberIcon: {
    backgroundColor: 'rgba(255, 204, 102, 0.12)',
  },
  copy: {
    alignItems: 'center',
    minWidth: 0,
  },
  label: {
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 8,
    lineHeight: 11,
    textAlign: 'center',
  },
});
