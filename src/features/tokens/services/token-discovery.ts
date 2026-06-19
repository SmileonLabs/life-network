import type { AssetBalance } from '@/features/tokens/types';
import type { SupportedChainId } from '@/shared/config/chains';

export type TokenDiscoveryResult = {
  assets: AssetBalance[];
  error: string | null;
  skipped: boolean;
};

export async function discoverSplAssets(_: {
  address: string;
  chainId: SupportedChainId;
  knownContracts: string[];
}): Promise<TokenDiscoveryResult> {
  return {
    assets: [],
    error: null,
    skipped: true,
  };
}

export const discoverBep20Assets = discoverSplAssets;
