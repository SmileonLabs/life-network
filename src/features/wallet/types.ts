import type { SupportedChainId } from '@/shared/config/chains';

export type WalletSource = 'privy-generated' | 'privy-imported';

export type WalletAccount = {
  id: string;
  source: WalletSource;
  address: string;
  label: string;
  chainId: SupportedChainId;
  createdAt: string;
};

export type WalletImportKind = 'seed-phrase' | 'private-key';

export type WalletImportPreview = {
  kind: WalletImportKind;
  address: string;
  wordCount?: number;
};

