import type { SupportedChainId } from '@/shared/config/chains';

export type WalletSource = 'privy-generated';

export type WalletAccount = {
  id: string;
  source: WalletSource;
  address: string;
  label: string;
  chainId: SupportedChainId;
  createdAt: string;
  isPrivy: boolean;
};
