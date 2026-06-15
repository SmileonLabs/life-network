import { useWallet } from '@/features/wallet/hooks/use-wallet';

export function useTokenBalances() {
  const { assets, coreAssets, discoveredAssets, lifeAsset, nativeAsset, totalUsd } = useWallet();

  return {
    assets,
    coreAssets,
    discoveredAssets,
    lifeAsset,
    nativeAsset,
    totalUsd,
  };
}

