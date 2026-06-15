import { useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { CheckCircle2, Copy, Share2, ShieldAlert } from 'lucide-react-native';
import { Platform, Share, StyleSheet, View } from 'react-native';

import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { supportedChains } from '@/shared/config/chains';
import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { GlassCard } from '@/shared/ui/glass-card';
import { shortAddress } from '@/shared/utils/format';

export function ReceiveCard() {
  const { activeWallet, chainId } = useWallet();
  const chain = supportedChains[chainId];
  const [message, setMessage] = useState('');

  if (!activeWallet) {
    return null;
  }

  const activeAddress = activeWallet.address;

  async function copyAddress() {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(activeAddress);
    }

    setMessage('Address copied');
  }

  async function shareAddress() {
    await Share.share({
      message: activeAddress,
    });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Badge label={chain.shortName} tone="lime" />
        </View>
        <AppText variant="subtitle">Receive assets</AppText>
        <AppText tone="muted">Use this address for BNB Smart Chain assets only.</AppText>
      </View>

      <GlassCard intensity="strong" style={styles.qrCard}>
        <View style={styles.qrWrap}>
          <QRCode
            backgroundColor="transparent"
            color={colors.text}
            size={210}
            value={activeAddress}
          />
        </View>
      </GlassCard>

      <View style={styles.addressBox}>
        <AppText variant="caption" tone="muted">
          Active address
        </AppText>
        <AppText variant="mono">{shortAddress(activeAddress, 12, 10)}</AppText>
      </View>

      <View style={styles.warningBox}>
        <ShieldAlert color={colors.warning} size={18} />
        <AppText tone="warning" style={styles.warningText}>
          Only send BNB Smart Chain assets to this wallet.
        </AppText>
      </View>

      {Boolean(message) && (
        <View style={styles.successBox}>
          <CheckCircle2 color={colors.success} size={18} />
          <AppText tone="lime">{message}</AppText>
        </View>
      )}

      <View style={styles.actions}>
        <Button icon={<Copy color={colors.black} size={18} />} label="Copy address" onPress={copyAddress} />
        <Button icon={<Share2 color={colors.text} size={18} />} label="Share" onPress={shareAddress} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xl,
    alignItems: 'stretch',
  },
  header: {
    gap: spacing.sm,
  },
  qrCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  qrWrap: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  addressBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  warningBox: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 102, 0.28)',
    backgroundColor: 'rgba(255, 204, 102, 0.08)',
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 167, 0.28)',
    backgroundColor: 'rgba(110, 231, 167, 0.08)',
    padding: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
});
