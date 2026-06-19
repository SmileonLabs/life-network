import { CheckCircle2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import type { WalletAccount } from '@/features/wallet/types';
import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { shortAddress } from '@/shared/utils/format';

type WalletAccountRowProps = {
  wallet: WalletAccount;
  active?: boolean;
  onPress?: () => void;
};

export function WalletAccountRow({ active = false, onPress, wallet }: WalletAccountRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={StyleSheet.flatten([styles.row, active && styles.activeRow])}>
      <View style={styles.mark}>
        <AppText variant="caption" tone={active ? 'lime' : 'muted'}>
          M
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1}>{wallet.label}</AppText>
        <AppText numberOfLines={1} variant="caption" tone="muted">
          Main · {shortAddress(wallet.address)}
        </AppText>
      </View>
      {active && <CheckCircle2 color={colors.lime} size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.047)',
    padding: spacing.md,
  },
  activeRow: {
    borderColor: 'rgba(170, 183, 255, 0.42)',
    backgroundColor: 'rgba(170, 183, 255, 0.085)',
  },
  mark: {
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
});
