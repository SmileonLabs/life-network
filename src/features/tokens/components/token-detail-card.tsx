import { StyleSheet, View } from 'react-native';
import { ArrowDownToLine, ArrowUpRight } from 'lucide-react-native';

import type { AssetBalance } from '@/features/tokens/types';
import { colors, radius, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/app-text';
import { Badge } from '@/shared/ui/badge';
import { BalancePanel } from '@/shared/ui/balance-panel';
import { TokenLogo } from '@/shared/ui/token-logo';
import { formatCurrency, formatPercent, formatTokenAmount, shortAddress } from '@/shared/utils/format';

export function TokenDetailCard({ asset }: { asset: AssetBalance }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TokenLogo symbol={asset.symbol} accent={asset.accent} iconUrl={asset.iconUrl} mint={asset.contractAddress} size={62} />
        <View style={styles.headerCopy}>
          <Badge label={asset.discoveredBy === 'core' ? 'Core asset' : 'Auto discovered'} tone="cyan" />
          <AppText variant="title">{asset.name}</AppText>
          <AppText tone="muted">{asset.type === 'native' ? 'Native SOL asset' : shortAddress(asset.contractAddress ?? '')}</AppText>
        </View>
      </View>

      <BalancePanel
        actions={[
          {
            label: 'Send',
            href: '/send',
            tone: 'primary',
            icon: <ArrowUpRight color={colors.lime} size={18} />,
          },
          {
            label: 'Receive',
            href: '/receive',
            tone: 'neutral',
            icon: <ArrowDownToLine color={colors.text} size={18} />,
          },
        ]}
        amount={`${formatTokenAmount(asset.balance, 6)} ${asset.symbol}`}
        caption={asset.type === 'native' ? 'Native gas asset' : 'SPL token'}
        label="Token balance"
        metrics={[
          { label: '24h', value: formatPercent(asset.change24h) },
          { label: 'Value', value: formatCurrency(asset.balance * asset.priceUsd) },
        ]}
      />

      <View style={styles.metaList}>
        <MetaRow label="Standard" value={asset.type === 'native' ? 'Native' : 'SPL'} />
        <MetaRow label="Decimals" value={`${asset.decimals}`} />
        <MetaRow label="Verified" value={asset.verified ? 'Yes' : 'Review'} />
        <MetaRow label="Token address" value={asset.type === 'native' ? 'Native asset' : shortAddress(asset.contractAddress ?? '', 10, 8)} />
      </View>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText numberOfLines={1}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  metaList: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  metaRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
