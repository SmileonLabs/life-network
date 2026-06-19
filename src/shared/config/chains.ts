export type SupportedChainId = 101 | 103;
export type SolanaCluster = 'mainnet-beta' | 'devnet';
export type PrivySolanaChain = 'solana:mainnet' | 'solana:devnet';

export type ChainConfig = {
  id: SupportedChainId;
  name: string;
  shortName: string;
  cluster: SolanaCluster;
  privyChain: PrivySolanaChain;
  nativeCurrency: {
    name: string;
    symbol: 'SOL';
    decimals: 9;
  };
  explorerBaseUrl: string;
  faucetUrl?: string;
  rpcUrl: string;
};

export const SOLANA_MAINNET: ChainConfig = {
  id: 101,
  name: 'Solana',
  shortName: 'Solana',
  cluster: 'mainnet-beta',
  privyChain: 'solana:mainnet',
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
  },
  explorerBaseUrl: 'https://explorer.solana.com',
  rpcUrl: process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
};

export const SOLANA_DEVNET: ChainConfig = {
  id: 103,
  name: 'Solana Devnet',
  shortName: 'Devnet',
  cluster: 'devnet',
  privyChain: 'solana:devnet',
  nativeCurrency: {
    name: 'Devnet SOL',
    symbol: 'SOL',
    decimals: 9,
  },
  explorerBaseUrl: 'https://explorer.solana.com',
  faucetUrl: 'https://faucet.solana.com',
  rpcUrl: process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC_URL ?? 'https://api.devnet.solana.com',
};

export const supportedChains = {
  101: SOLANA_MAINNET,
  103: SOLANA_DEVNET,
} as const;

export const defaultChain = SOLANA_DEVNET;

export function getSolanaExplorerUrl(chain: ChainConfig, path: 'address' | 'tx' | 'token', value: string) {
  const url = new URL(`${chain.explorerBaseUrl}/${path}/${value}`);

  if (chain.cluster !== 'mainnet-beta') {
    url.searchParams.set('cluster', chain.cluster);
  }

  return url.toString();
}
