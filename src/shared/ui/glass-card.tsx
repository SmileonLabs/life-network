import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, glassEffect, radius, shadows, spacing } from '@/shared/theme/tokens';

type GlassCardProps = ViewProps & {
  intensity?: 'soft' | 'strong';
};

export function GlassCard({ intensity = 'soft', style, ...props }: GlassCardProps) {
  return <View {...props} style={[styles.card, styles[intensity], style]} />;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    overflow: 'hidden',
    ...glassEffect,
    ...shadows.card,
  },
  soft: {
    backgroundColor: colors.glass,
  },
  strong: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.borderStrong,
  },
});

