export type SupportedChainId = 56 | 97;

export type ChainConfig = {
  id: SupportedChainId;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: 'BNB' | 'tBNB';
    decimals: 18;
  };
  explorerBaseUrl: string;
  explorerApiBaseUrl: string;
  faucetUrl?: string;
  rpcUrl: string;
};

export const BSC_MAINNET: ChainConfig = {
  id: 56,
  name: 'BNB Smart Chain',
  shortName: 'BSC',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  explorerBaseUrl: 'https://bscscan.com',
  explorerApiBaseUrl: 'https://api.etherscan.io/v2/api',
  rpcUrl: process.env.EXPO_PUBLIC_BSC_RPC_URL ?? 'https://bsc-dataseed.binance.org',
};

export const BSC_TESTNET: ChainConfig = {
  id: 97,
  name: 'BNB Smart Chain Testnet',
  shortName: 'BSC Testnet',
  nativeCurrency: {
    name: 'Test BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  explorerBaseUrl: 'https://testnet.bscscan.com',
  explorerApiBaseUrl: 'https://api.etherscan.io/v2/api',
  faucetUrl: 'https://www.bnbchain.org/en/testnet-faucet',
  rpcUrl: process.env.EXPO_PUBLIC_BSC_TESTNET_RPC_URL ?? 'https://data-seed-prebsc-1-s1.binance.org:8545',
};

export const supportedChains = {
  56: BSC_MAINNET,
  97: BSC_TESTNET,
} as const;

export const defaultChain = BSC_TESTNET;
