import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme/tokens';
import { WalletHeader } from '@/shared/ui/wallet-header';

export type ScreenScaffoldProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  headerSlot?: ReactNode;
  children: ReactNode;
  accessorySlot?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenScaffold({
  accessorySlot,
  children,
  contentStyle,
  headerSlot,
  rightSlot,
  subtitle,
  title,
}: ScreenScaffoldProps) {
  const { width } = useWindowDimensions();
  const isExpanded = width >= 960;

  return (
    <View style={styles.frame}>
      <WalletHeader rightSlot={rightSlot} subtitle={subtitle} title={title} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isExpanded && styles.scrollContentExpanded, contentStyle]}
        showsVerticalScrollIndicator={false}>
        {headerSlot}
        <View style={[styles.contentGrid, isExpanded && styles.contentGridExpanded]}>
          <View style={styles.primaryColumn}>{children}</View>
          {accessorySlot && <View style={styles.accessoryColumn}>{accessorySlot}</View>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(8, 17, 31, 0.56)',
  },
  scrollContent: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: 112,
  },
  scrollContentExpanded: {
    padding: spacing.xl,
    paddingBottom: 112,
  },
  contentGrid: {
    gap: spacing.lg,
  },
  contentGridExpanded: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  primaryColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.lg,
  },
  accessoryColumn: {
    width: 340,
    gap: spacing.lg,
  },
});
