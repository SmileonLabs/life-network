import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { Badge } from '@/shared/ui/badge';

type SecurityPreviewCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  tone?: 'lime' | 'cyan' | 'violet' | 'warning';
};

export function SecurityPreviewCard({
  badge,
  icon,
  subtitle,
  title,
  tone = 'cyan',
}: SecurityPreviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.copy}>
        <AppText>{title}</AppText>
        <AppText numberOfLines={2} variant="caption" tone="muted">
          {subtitle}
        </AppText>
      </View>
      {Boolean(badge) && <Badge label={badge ?? ''} tone={tone} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.047)',
    padding: spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
