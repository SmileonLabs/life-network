import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';

type SegmentOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type SegmentedControlProps<TValue extends string> = {
  options: SegmentOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export function SegmentedControl<TValue extends string>({
  onChange,
  options,
  value,
}: SegmentedControlProps<TValue>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={StyleSheet.flatten([styles.option, active && styles.optionActive])}>
            <AppText variant="caption" tone={active ? 'lime' : 'muted'} style={styles.label}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.xs,
  },
  option: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  optionActive: {
    borderWidth: 1,
    borderColor: 'rgba(170, 183, 255, 0.34)',
    backgroundColor: 'rgba(170, 183, 255, 0.12)',
  },
  label: {
    textAlign: 'center',
  },
});
