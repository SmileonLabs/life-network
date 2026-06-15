import { Copy, WalletCards } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { Badge } from '@/shared/ui/badge';
import { GlassCard } from '@/shared/ui/glass-card';
import { shortAddress } from '@/shared/utils/format';

export function WalletSummaryCard() {
  const { activeWallet } = useWallet();

  if (!activeWallet) {
    return null;
  }

  return (
    <GlassCard intensity="strong" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <WalletCards color={colors.lime} size={24} />
        </View>
        <View style={styles.copy}>
          <AppText variant="caption" tone="muted">
            Active wallet
          </AppText>
          <AppText variant="subtitle">{activeWallet.label}</AppText>
        </View>
      </View>
      <Badge label="Main Wallet" tone="cyan" />
      <Pressable accessibilityRole="button" style={styles.addressRow}>
        <AppText variant="mono">{shortAddress(activeWallet.address)}</AppText>
        <Copy color={colors.textMuted} size={16} />
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(184, 255, 92, 0.12)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});
