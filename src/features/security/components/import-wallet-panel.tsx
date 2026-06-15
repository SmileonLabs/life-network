import { useMemo, useState } from 'react';
import { AlertTriangle, KeyRound } from 'lucide-react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { getSecretKindLabel } from '@/features/security/services/import-secret';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { GlassCard } from '@/shared/ui/glass-card';
import { shortAddress } from '@/shared/utils/format';

export function ImportWalletPanel() {
  const { importWallet, previewWalletImport } = useWallet();
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const preview = useMemo(() => previewWalletImport(secret), [previewWalletImport, secret]);

  function submitImport() {
    const imported = importWallet(secret, label);
    if (!imported) {
      setMessage('Enter a valid 12/24 word seed phrase or 0x private key.');
      return;
    }

    setSecret('');
    setLabel('');
    setMessage(`${imported.label} added as ${shortAddress(imported.address)}.`);
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <KeyRound color={colors.violet} size={20} />
        <View style={styles.headerCopy}>
          <AppText variant="subtitle">Import wallet</AppText>
          <AppText tone="muted">
            Bring an existing BSC wallet into your LIFE account.
          </AppText>
        </View>
      </View>

      <View style={styles.warning}>
        <AlertTriangle color={colors.warning} size={18} />
        <AppText tone="warning" style={styles.warningText}>
          Never share your seed phrase. Secret text is only used for this local preview.
        </AppText>
      </View>

      <View style={styles.fieldGroup}>
        <AppText variant="caption" tone="muted">
          Wallet label
        </AppText>
        <TextInput
          onChangeText={setLabel}
          placeholder="Trading wallet"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          value={label}
        />
      </View>

      <View style={styles.fieldGroup}>
        <AppText variant="caption" tone="muted">
          Seed phrase or private key
        </AppText>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={4}
          onChangeText={(value) => {
            setSecret(value);
            setMessage('');
          }}
          placeholder="Enter 12/24 words or 0x private key"
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={false}
          style={[styles.input, styles.secretInput]}
          value={secret}
        />
      </View>

      {preview && (
        <View style={styles.preview}>
          <Badge label={getSecretKindLabel(preview.kind)} tone="violet" />
          <AppText variant="mono">{shortAddress(preview.address, 10, 8)}</AppText>
        </View>
      )}

      {Boolean(message) && <AppText tone={preview ? 'lime' : 'warning'}>{message}</AppText>}

      <Button disabled={!preview} label="Import wallet" onPress={submitImport} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  warning: {
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
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  secretInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.md,
  },
});
