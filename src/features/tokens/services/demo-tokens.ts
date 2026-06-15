import { colors } from '@/shared/theme/tokens';
import { env } from '@/shared/config/env';
import type { SupportedChainId } from '@/shared/config/chains';
import type { AssetBalance } from '@/features/tokens/types';

const lifeAddress = env.lifeTokenAddress || '0x1111111111111111111111111111111111111111';

export function getDemoAssets(chainId: SupportedChainId): AssetBalance[] {
  const bnbSymbol = chainId === 56 ? 'BNB' : 'tBNB';

  return [
    {
      id: `${chainId}:native`,
      chainId,
      type: 'native',
      name: chainId === 56 ? 'BNB' : 'Test BNB',
      symbol: bnbSymbol,
      decimals: 18,
      balance: chainId === 56 ? 2.8421 : 7.45,
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
      balance: 18420.75,
      priceUsd: 0.048,
      change24h: 8.34,
      accent: colors.lime,
      verified: true,
      discoveredBy: 'core',
    },
    {
      id: `${chainId}:usdt`,
      chainId,
      type: 'bep20',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 18,
      contractAddress: '0x55d398326f99059ff775485246999027b3197955',
      balance: 938.28,
      priceUsd: 1,
      change24h: 0.01,
      accent: colors.cyan,
      verified: true,
      discoveredBy: 'explorer',
    },
    {
      id: `${chainId}:cake`,
      chainId,
      type: 'bep20',
      name: 'PancakeSwap Token',
      symbol: 'CAKE',
      decimals: 18,
      contractAddress: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
      balance: 122.4,
      priceUsd: 2.64,
      change24h: -2.18,
      accent: colors.violet,
      verified: true,
      discoveredBy: 'explorer',
    },
    {
      id: `${chainId}:btc.b`,
      chainId,
      type: 'bep20',
      name: 'BTCB Token',
      symbol: 'BTCB',
      decimals: 18,
      contractAddress: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
      balance: 0.0184,
      priceUsd: 104200,
      change24h: 0.78,
      accent: colors.rose,
      verified: true,
      discoveredBy: 'explorer',
    },
  ];
}

