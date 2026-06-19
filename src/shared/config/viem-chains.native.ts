import { defineChain } from 'viem';

import { SOLANA_DEVNET, SOLANA_MAINNET } from '@/shared/config/chains';

export const bscMainnetViem = defineChain({
  id: SOLANA_MAINNET.id,
  name: SOLANA_MAINNET.name,
  nativeCurrency: {
    decimals: 18,
    name: SOLANA_MAINNET.nativeCurrency.name,
    symbol: SOLANA_MAINNET.nativeCurrency.symbol,
  },
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
});

export const bscTestnetViem = defineChain({
  id: SOLANA_DEVNET.id,
  name: SOLANA_DEVNET.name,
  nativeCurrency: {
    decimals: 18,
    name: SOLANA_DEVNET.nativeCurrency.name,
    symbol: SOLANA_DEVNET.nativeCurrency.symbol,
  },
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
});

export const supportedViemChains = [bscTestnetViem, bscMainnetViem] as const;
