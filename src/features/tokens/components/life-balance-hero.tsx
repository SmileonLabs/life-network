import { ArrowDownToLine, ArrowUpRight } from 'lucide-react-native';

import { useTokenBalances } from '@/features/tokens/hooks/use-token-balances';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { supportedChains } from '@/shared/config/chains';
import { colors } from '@/shared/theme/tokens';
import { BalancePanel } from '@/shared/ui/balance-panel';
import { formatCurrency, formatTokenAmount } from '@/shared/utils/format';

export function LifeBalanceHero() {
  const { lifeAsset, nativeAsset, totalUsd } = useTokenBalances();
  const { chainId } = useWallet();
  const chain = supportedChains[chainId];

  if (!lifeAsset) {
    return null;
  }

  return (
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
      amount={formatCurrency(totalUsd)}
      caption={`${formatCurrency(lifeAsset.balance * lifeAsset.priceUsd)} in LIFE Token`}
      label="Total balance"
      metrics={[
        {
          label: 'LIFE',
          value: formatTokenAmount(lifeAsset.balance, 2),
          caption: 'Core asset',
        },
        {
          label: nativeAsset?.symbol ?? 'BNB',
          value: nativeAsset ? formatTokenAmount(nativeAsset.balance, 4) : '0',
          caption: 'Gas ready',
        },
      ]}
      networkLabel={chain.shortName}
    />
  );
}
