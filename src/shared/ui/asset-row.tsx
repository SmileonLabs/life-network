import type { AssetBalance } from '@/features/tokens/types';
import { TokenLogo } from '@/shared/ui/token-logo';
import { ListRow } from '@/shared/ui/list-row';
import { formatCurrency, formatPercent, formatTokenAmount } from '@/shared/utils/format';

type AssetRowProps = {
  asset: AssetBalance;
};

export function AssetRow({ asset }: AssetRowProps) {
  return (
    <ListRow
      href={{
        pathname: '/tokens/[address]',
        params: { address: asset.contractAddress ?? 'native' },
      }}
      leading={<TokenLogo symbol={asset.symbol} accent={asset.accent} iconUrl={asset.iconUrl} mint={asset.contractAddress} size={42} />}
      meta={`${formatCurrency(asset.balance * asset.priceUsd)} · ${formatPercent(asset.change24h)}`}
      subtitle={`${asset.symbol} · ${asset.type === 'native' ? 'Native' : 'SPL'}`}
      title={asset.name}
      value={formatTokenAmount(asset.balance)}
    />
  );
}
