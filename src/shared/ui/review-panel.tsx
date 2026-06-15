import { type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

type ReviewPanelRow = {
  label: string;
  value: string;
  tone?: 'primary' | 'lime' | 'warning' | 'danger';
};

type ReviewPanelProps = {
  title: string;
  subtitle?: string;
  status?: 'safe' | 'warning' | 'idle';
  rows: ReviewPanelRow[];
  children?: ReactNode;
};

export function ReviewPanel({ children, rows, status = 'idle', subtitle, title }: ReviewPanelProps) {
  const Icon = status === 'warning' ? AlertTriangle : status === 'safe' ? CheckCircle2 : ShieldCheck;
  const iconColor = status === 'warning' ? colors.warning : status === 'safe' ? colors.success : colors.cyan;

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon color={iconColor} size={18} />
        </View>
        <View style={styles.copy}>
          <AppText variant="subtitle">{title}</AppText>
          {Boolean(subtitle) && (
            <AppText variant="caption" tone="muted">
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      <View style={styles.rows}>
        {rows.map((row) => (
          <View style={styles.row} key={row.label}>
            <AppText variant="caption" tone="muted">
              {row.label}
            </AppText>
            <AppText numberOfLines={1} tone={row.tone ?? 'primary'}>
              {row.value}
            </AppText>
          </View>
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.052)',
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  rows: {
    gap: spacing.xs,
  },
  row: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    paddingTop: spacing.xs,
  },
});
