import type { SupportedChainId } from '@/shared/config/chains';

export type ActivityStatus = 'pending' | 'success' | 'failed';
export type ActivityDirection = 'in' | 'out';

export type WalletActivity = {
  id: string;
  chainId: SupportedChainId;
  hash: string;
  title: string;
  subtitle: string;
  direction: ActivityDirection;
  status: ActivityStatus;
  symbol: string;
  amount: number;
  timestamp: string;
  explorerUrl: string;
};

