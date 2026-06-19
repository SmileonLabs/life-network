import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronDown, Wifi } from 'lucide-react-native';

import { supportedChains } from '@/shared/config/chains';
import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { useWallet } from '@/features/wallet/hooks/use-wallet';

export function NetworkPill() {
  const { chainId, setChainId } = useWallet();
  const chain = supportedChains[chainId];

  function toggleChain() {
    setChainId(chainId === 103 ? 101 : 103);
  }

  return (
    <Pressable accessibilityRole="button" onPress={toggleChain} style={styles.pill}>
      <Wifi color={colors.success} size={16} />
      <View style={styles.copy}>
        <AppText variant="caption" tone="subtle">
          Network
        </AppText>
        <AppText>{chain.shortName}</AppText>
      </View>
      <ChevronDown color={colors.textMuted} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: spacing.md,
  },
  copy: {
    flex: 1,
  },
});
