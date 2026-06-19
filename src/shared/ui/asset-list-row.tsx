import type { AssetBalance } from '@/features/tokens/types';
import { TokenLogo } from '@/shared/ui/token-logo';
import { ListRow } from '@/shared/ui/list-row';
import { formatCurrency, formatPercent, formatTokenAmount } from '@/shared/utils/format';

type AssetListRowProps = {
  asset: AssetBalance;
  label?: string;
};

export function AssetListRow({ asset, label }: AssetListRowProps) {
  return (
    <ListRow
      href={{
        pathname: '/tokens/[address]',
        params: { address: asset.contractAddress ?? 'native' },
      }}
      leading={<TokenLogo symbol={asset.symbol} accent={asset.accent} iconUrl={asset.iconUrl} mint={asset.contractAddress} size={42} />}
      meta={`${formatCurrency(asset.balance * asset.priceUsd)} · ${formatPercent(asset.change24h)}`}
      subtitle={`${label ?? asset.symbol} · ${asset.type === 'native' ? 'Gas asset' : 'SPL'}`}
      title={asset.name}
      value={formatTokenAmount(asset.balance)}
    />
  );
}
