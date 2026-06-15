import { defineChain } from 'viem';

import { BSC_MAINNET, BSC_TESTNET } from '@/shared/config/chains';

export const bscMainnetViem = defineChain({
  id: BSC_MAINNET.id,
  name: BSC_MAINNET.name,
  nativeCurrency: BSC_MAINNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [BSC_MAINNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: BSC_MAINNET.explorerBaseUrl,
    },
  },
});

export const bscTestnetViem = defineChain({
  id: BSC_TESTNET.id,
  name: BSC_TESTNET.name,
  nativeCurrency: BSC_TESTNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [BSC_TESTNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan Testnet',
      url: BSC_TESTNET.explorerBaseUrl,
    },
  },
  testnet: true,
});

export const supportedViemChains = [bscMainnetViem, bscTestnetViem] as const;
