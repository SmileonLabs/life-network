import { SOLANA_DEVNET, SOLANA_MAINNET } from '@/shared/config/chains';

export const bscMainnetViem = {
  id: SOLANA_MAINNET.id,
  name: SOLANA_MAINNET.name,
  nativeCurrency: SOLANA_MAINNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [SOLANA_MAINNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Solana Explorer',
      url: SOLANA_MAINNET.explorerBaseUrl,
    },
  },
};

export const bscTestnetViem = {
  id: SOLANA_DEVNET.id,
  name: SOLANA_DEVNET.name,
  nativeCurrency: SOLANA_DEVNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [SOLANA_DEVNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Solana Explorer',
      url: SOLANA_DEVNET.explorerBaseUrl,
    },
  },
  testnet: true,
};

export const supportedViemChains = [bscTestnetViem, bscMainnetViem] as const;
