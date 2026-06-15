import { Text, type TextProps, StyleSheet } from 'react-native';

import { colors, typography } from '@/shared/theme/tokens';

type AppTextProps = TextProps & {
  variant?: 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'mono';
  tone?: 'primary' | 'muted' | 'subtle' | 'cyan' | 'lime' | 'danger' | 'warning';
};

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: AppTextProps) {
  return <Text {...props} style={[styles.base, styles[variant], styles[tone], style]} />;
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  hero: typography.hero,
  title: typography.title,
  subtitle: typography.subtitle,
  body: typography.body,
  caption: {
    ...typography.caption,
    textTransform: 'uppercase',
  },
  mono: {
    ...typography.body,
    fontFamily: 'monospace',
  },
  primary: {
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
  },
  subtle: {
    color: colors.textSubtle,
  },
  cyan: {
    color: colors.cyan,
  },
  lime: {
    color: colors.lime,
  },
  danger: {
    color: colors.danger,
  },
  warning: {
    color: colors.warning,
  },
});

