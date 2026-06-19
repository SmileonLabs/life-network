import { useMemo, useState } from 'react';
import { CheckCircle2, Send, ShieldAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { colors, fonts, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ReviewPanel } from '@/shared/ui/review-panel';
import { TokenLogo } from '@/shared/ui/token-logo';
import { formatTokenAmount, shortAddress } from '@/shared/utils/format';

export function SendForm() {
  const { assets, nativeAsset, sendTransfer, validateSend } = useWallet();
  const [assetId, setAssetId] = useState(assets[0]?.id ?? '');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [resultHash, setResultHash] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedAsset = assets.find((asset) => asset.id === assetId) ?? assets[0];
  const validation = useMemo(
    () => validateSend(selectedAsset?.id ?? '', recipient, amount),
    [amount, recipient, selectedAsset?.id, validateSend],
  );
  const parsedAmount = Number(amount);
  const hasDraft = Boolean(selectedAsset && recipient.trim() && amount.trim());
  const recipientLabel = recipient.trim().length > 10
    ? shortAddress(recipient.trim(), 8, 6)
    : 'Not ready';

  async function submitTransfer() {
    if (!selectedAsset) {
      return;
    }

    setIsSending(true);

    try {
      const activity = await sendTransfer({
        assetId: selectedAsset.id,
        recipient,
        amount,
      });

      if (activity) {
        setResultHash(activity.hash);
        setAmount('');
        setRecipient('');
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.summaryPanel}>
        <View style={styles.summaryTop}>
          <Badge label="Solana transfer" tone="cyan" />
          <AppText variant="caption" tone="muted">
            Step 1 of 4
          </AppText>
        </View>
        <View style={styles.selectedAsset}>
          <TokenLogo
            accent={selectedAsset?.accent ?? colors.amber}
            iconUrl={selectedAsset?.iconUrl}
            mint={selectedAsset?.contractAddress}
            size={54}
            symbol={selectedAsset?.symbol ?? 'SOL'}
          />
          <View style={styles.selectedCopy}>
            <AppText variant="subtitle">Send {selectedAsset?.symbol ?? 'asset'}</AppText>
            <AppText tone="muted">
              Available {selectedAsset ? formatTokenAmount(selectedAsset.balance, 6) : '0'}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">Asset</AppText>
          <AppText variant="caption" tone="muted">
            Choose balance
          </AppText>
        </View>
        <View style={styles.assetGrid}>
        {assets.map((asset) => {
          const isSelected = asset.id === selectedAsset?.id;
          return (
            <Pressable
              accessibilityRole="button"
              key={asset.id}
              onPress={() => setAssetId(asset.id)}
              style={[styles.assetOption, isSelected && styles.assetOptionSelected]}>
              <TokenLogo
                accent={asset.accent}
                iconUrl={asset.iconUrl}
                mint={asset.contractAddress}
                size={36}
                symbol={asset.symbol}
              />
              <View style={styles.assetCopy}>
                <AppText>{asset.symbol}</AppText>
                <AppText variant="caption" tone="muted">
                  {formatTokenAmount(asset.balance)}
                </AppText>
              </View>
            </Pressable>
          );
        })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="subtitle">Recipient</AppText>
          <AppText variant="caption" tone="muted">
            Solana address
          </AppText>
        </View>
        <View style={styles.fieldGroup}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setRecipient}
            placeholder="Solana address"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            value={recipient}
          />
        </View>

        <View style={styles.fieldGroup}>
          <AppText variant="caption" tone="muted">
            Amount
          </AppText>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, styles.amountInput]}
            value={amount}
          />
        </View>
      </View>

      <ReviewPanel
        rows={[
          {
            label: 'Assets out',
            value:
              hasDraft && parsedAmount > 0 && selectedAsset
                ? `${formatTokenAmount(parsedAmount, 6)} ${selectedAsset.symbol}`
                : 'Enter amount',
          },
          {
            label: 'Recipient',
            value: recipientLabel,
            tone: validation.errors.some((error) => error.toLowerCase().includes('address')) ? 'warning' : 'primary',
          },
          {
            label: 'Gas',
            value: `${validation.estimatedGasBnb} ${nativeAsset?.symbol ?? 'SOL'}`,
          },
          {
            label: 'Risk check',
            value: validation.isValid ? 'Low risk preview' : 'Needs review',
            tone: validation.isValid ? 'lime' : 'warning',
          },
        ]}
        status={validation.isValid ? 'safe' : hasDraft ? 'warning' : 'idle'}
        subtitle="Human-readable transfer preview"
        title="Review before signing"
      />

      {!validation.isValid && (
        <View style={styles.warningBox}>
          <ShieldAlert color={colors.warning} size={18} />
          <View style={styles.warningCopy}>
            {validation.errors.map((error) => (
              <AppText key={error} tone="warning">
                {error}
              </AppText>
            ))}
          </View>
        </View>
      )}

      {Boolean(resultHash) && (
        <View style={styles.successBox}>
          <CheckCircle2 color={colors.success} size={18} />
          <AppText tone="lime">Transfer preview accepted and added to Activity.</AppText>
        </View>
      )}

      <Button
        disabled={!validation.isValid || isSending}
        icon={<Send color={colors.black} size={18} />}
        label={isSending ? 'Sending' : 'Review and send'}
        onPress={submitTransfer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xl,
  },
  summaryPanel: {
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(12, 21, 38, 0.9)',
    padding: spacing.xl,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  selectedAsset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedCopy: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  assetOption: {
    minWidth: 150,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.md,
  },
  assetOptionSelected: {
    borderColor: 'rgba(170, 183, 255, 0.54)',
    backgroundColor: 'rgba(170, 183, 255, 0.1)',
  },
  assetCopy: {
    flex: 1,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
  amountInput: {
    fontFamily: fonts.light,
    fontSize: 22,
    fontWeight: '300',
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
  warningCopy: {
    flex: 1,
    gap: spacing.xs,
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
});
