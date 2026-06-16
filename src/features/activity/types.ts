import type { SupportedChainId } from '@/shared/config/chains';

export type ActivityStatus = 'pending' | 'success' | 'failed';
export type ActivityDirection = 'in' | 'out';

export type WalletActivity = {
  id: string;
  chainId: SupportedChainId;
  hash: string;
  blockNumber?: number;
  confirmations?: number;
  title: string;
  subtitle: string;
  direction: ActivityDirection;
  status: ActivityStatus;
  assetId?: string;
  symbol: string;
  amount: number;
  from?: string;
  to?: string;
  counterparty?: string;
  contractAddress?: string;
  feeNative?: number;
  lastCheckedAt?: string;
  pendingNotice?: string;
  pendingDebits?: {
    amount: number;
    assetId: string;
  }[];
  timestamp: string;
  explorerUrl: string;
};
