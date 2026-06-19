import type { Connection, SendOptions, Transaction, VersionedTransaction } from '@solana/web3.js';

import type { ChainConfig } from '@/shared/config/chains';

export type SolanaWalletProvider = {
  request?: (input: {
    method: 'signAndSendTransaction' | 'signTransaction' | 'signMessage' | string;
    params?: {
      connection?: Connection;
      encoding?: 'base64';
      message?: string;
      options?: SendOptions;
      transaction?: Transaction | VersionedTransaction;
    } | unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
  signMessage?: (message: string | Uint8Array) => Promise<string | Uint8Array | { signature?: string | Uint8Array | number[] }>;
  signAndSendTransaction?: (
    transaction: Transaction | VersionedTransaction | Uint8Array,
    sendOptions?: SendOptions,
  ) => Promise<string | Uint8Array | { data?: { signature?: string }; signature?: string | Uint8Array | number[] }>;
};

export type WalletAdapter = {
  address: string | null;
  exportPrivateKey: () => Promise<void>;
  createWallet: () => Promise<string | null>;
  getProvider: () => Promise<SolanaWalletProvider | null>;
  signMessage: (message: string) => Promise<string | null>;
  signAndSendTransaction: (transaction: Transaction | Uint8Array, chain: ChainConfig) => Promise<string | null>;
  privateKeyExportMode: 'privy-modal' | 'external-url' | 'unavailable';
  isReady: boolean;
};
