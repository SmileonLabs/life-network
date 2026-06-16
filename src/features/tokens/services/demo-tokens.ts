import { colors } from '@/shared/theme/tokens';
import { env } from '@/shared/config/env';
import type { SupportedChainId } from '@/shared/config/chains';
import type { AssetBalance } from '@/features/tokens/types';

const lifeAddress = env.lifeTokenAddress || '0x1111111111111111111111111111111111111111';

export function getDemoAssets(chainId: SupportedChainId): AssetBalance[] {
  const bnbSymbol = chainId === 56 ? 'BNB' : 'tBNB';

  const coreAssets: AssetBalance[] = [
    {
      id: `${chainId}:native`,
      chainId,
      type: 'native',
      name: chainId === 56 ? 'BNB' : 'Test BNB',
      symbol: bnbSymbol,
      decimals: 18,
      balance: chainId === 56 ? 2.8421 : 0,
      priceUsd: chainId === 56 ? 642.18 : 0,
      change24h: 1.62,
      accent: colors.amber,
      verified: true,
      discoveredBy: 'core',
    },
    {
      id: `${chainId}:life`,
      chainId,
      type: 'bep20',
      name: 'LIFE Token',
      symbol: 'LIFE',
      decimals: 18,
      contractAddress: lifeAddress,
      balance: chainId === 56 ? 18420.75 : 0,
      priceUsd: 0.048,
      change24h: 8.34,
      accent: colors.lime,
      verified: true,
      discoveredBy: 'core',
    },
  ];

  return coreAssets;
}
