import type { AssetBalance } from '@/features/tokens/types';
import type { SupportedChainId } from '@/shared/config/chains';
import { env } from '@/shared/config/env';
import { colors } from '@/shared/theme/tokens';
import { makeDemoAddress } from '@/shared/utils/address';

const lifeMint = env.lifeTokenMint || makeDemoAddress('life-token-mint');

export function getDemoAssets(chainId: SupportedChainId): AssetBalance[] {
  const isMainnet = chainId === 101;

  return [
    {
      id: `${chainId}:native`,
      accent: colors.lime,
      balance: isMainnet ? 1.284 : 0,
      chainId,
      change24h: 2.12,
      decimals: 9,
      discoveredBy: 'core',
      name: isMainnet ? 'Solana' : 'Devnet SOL',
      priceUsd: isMainnet ? 148.24 : 0,
      symbol: 'SOL',
      type: 'native',
      verified: true,
    },
    {
      id: `${chainId}:life`,
      accent: colors.success,
      balance: isMainnet ? 18420.75 : 0,
      chainId,
      change24h: 8.34,
      contractAddress: lifeMint,
      decimals: 9,
      discoveredBy: 'core',
      name: 'LIFE Token',
      priceUsd: 0.048,
      symbol: 'LIFE',
      type: 'spl',
      verified: Boolean(env.lifeTokenMint),
    },
  ];
}
