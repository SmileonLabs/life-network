import { StyleSheet, View } from 'react-native';
import { KeyRound } from 'lucide-react-native';

import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { WalletAccountRow } from '@/shared/ui/wallet-account-row';

export function WalletSwitcher() {
  const { activeWallet, setActiveWalletId, wallets } = useWallet();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <KeyRound color={colors.cyan} size={18} />
        <View style={styles.headerCopy}>
          <AppText variant="subtitle">Wallets</AppText>
          <AppText variant="caption" tone="muted">
            {wallets.length} available
          </AppText>
        </View>
      </View>
      <View style={styles.list}>
        {wallets.map((wallet) => {
          const isActive = wallet.id === activeWallet?.id;
          return (
            <WalletAccountRow
              active={isActive}
              key={wallet.id}
              onPress={() => setActiveWalletId(wallet.id)}
              wallet={wallet}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerCopy: {
    gap: 2,
  },
  list: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
