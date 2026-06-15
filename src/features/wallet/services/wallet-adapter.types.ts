export type Eip1193Provider = {
  request: (input: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
};

export type WalletAdapter = {
  address: string | null;
  createWallet: () => Promise<string | null>;
  getProvider: () => Promise<Eip1193Provider | null>;
  isReady: boolean;
};
