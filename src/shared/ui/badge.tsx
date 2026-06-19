import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

type BadgeProps = {
  label: string;
  tone?: 'cyan' | 'lime' | 'violet' | 'warning' | 'neutral';
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 11,
  },
  cyan: {
    backgroundColor: 'rgba(194, 216, 254, 0.1)',
    borderColor: 'rgba(194, 216, 254, 0.34)',
  },
  lime: {
    backgroundColor: 'rgba(170, 183, 255, 0.12)',
    borderColor: 'rgba(170, 183, 255, 0.36)',
  },
  violet: {
    backgroundColor: 'rgba(155, 124, 255, 0.13)',
    borderColor: 'rgba(155, 124, 255, 0.34)',
  },
  warning: {
    backgroundColor: 'rgba(255, 204, 102, 0.13)',
    borderColor: 'rgba(255, 204, 102, 0.36)',
  },
  neutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: colors.border,
  },
});

