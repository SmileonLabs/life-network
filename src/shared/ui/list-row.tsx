import { type ReactNode } from 'react';
import { type Href, Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

type ListRowProps = {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  meta?: string;
  tone?: 'primary' | 'lime' | 'danger' | 'warning';
  href?: Href;
  onPress?: () => void;
  trailingIcon?: ReactNode;
};

export function ListRow({
  href,
  leading,
  meta,
  onPress,
  subtitle,
  title,
  tone = 'primary',
  trailingIcon,
  value,
}: ListRowProps) {
  const isInteractive = Boolean(href || onPress);
  const row = (
    <Pressable
      accessibilityRole={isInteractive ? 'button' : undefined}
      disabled={!isInteractive}
      onPress={onPress}
      style={styles.row}>
      {leading}
      <View style={styles.copy}>
        <AppText numberOfLines={1}>{title}</AppText>
        {Boolean(subtitle) && (
          <AppText numberOfLines={1} variant="caption" tone="muted">
            {subtitle}
          </AppText>
        )}
      </View>
      <View style={styles.value}>
        {Boolean(value) && (
          <AppText numberOfLines={1} tone={tone}>
            {value}
          </AppText>
        )}
        {Boolean(meta) && (
          <AppText numberOfLines={1} variant="caption" tone="muted">
            {meta}
          </AppText>
        )}
      </View>
      {trailingIcon ?? (isInteractive ? <ChevronRight color={colors.textSubtle} size={18} /> : null)}
    </Pressable>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        {row}
      </Link>
    );
  }

  return row;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.047)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    maxWidth: '38%',
    minWidth: 76,
    alignItems: 'flex-end',
    gap: 1,
  },
});
