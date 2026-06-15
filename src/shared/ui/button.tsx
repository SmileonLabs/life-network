import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ label, icon, variant = 'primary', style, disabled, ...props }: ButtonProps) {
  const resolvedIcon = icon ?? (variant === 'primary' ? <ArrowRight color={colors.black} size={18} /> : null);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...props}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        {resolvedIcon}
        <AppText
          variant="body"
          style={[
            styles.label,
            (variant === 'primary' || variant === 'danger') && styles.labelDark,
            variant === 'ghost' && styles.labelGhost,
          ]}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.lime,
    borderColor: 'rgba(184, 255, 92, 0.72)',
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: 'rgba(255, 107, 107, 0.72)',
  },
  label: {
    fontWeight: '800',
    textAlign: 'center',
  },
  labelDark: {
    color: colors.black,
  },
  labelGhost: {
    color: colors.cyan,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.42,
  },
});
