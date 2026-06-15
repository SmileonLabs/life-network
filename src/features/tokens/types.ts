import type { SupportedChainId } from '@/shared/config/chains';

export type AssetType = 'native' | 'bep20';

export type AssetBalance = {
  id: string;
  chainId: SupportedChainId;
  type: AssetType;
  name: string;
  symbol: string;
  decimals: number;
  contractAddress?: string;
  balance: number;
  priceUsd: number;
  change24h: number;
  accent: string;
  verified: boolean;
  discoveredBy: 'core' | 'explorer' | 'manual';
};

