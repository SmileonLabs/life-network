import { createPublicClient, formatEther, http, isAddress, parseEther, toHex, type Address } from 'viem';

import { type SupportedChainId } from '@/shared/config/chains';
import { bscMainnetViem, bscTestnetViem } from '@/shared/config/viem-chains';

const publicClients = {
  56: createPublicClient({
    chain: bscMainnetViem,
    transport: http(),
  }),
  97: createPublicClient({
    chain: bscTestnetViem,
    transport: http(),
  }),
} as const;

export function getPublicClient(chainId: SupportedChainId) {
  return publicClients[chainId];
}

export async function getNativeBalance(address: string, chainId: SupportedChainId) {
  if (!isAddress(address)) {
    return null;
  }

  const balance = await getPublicClient(chainId).getBalance({ address });
  return Number(formatEther(balance));
}

export function toEvmAddress(address: string): Address | null {
  return isAddress(address) ? address : null;
}

export function toNativeValueHex(amount: string) {
  return toHex(parseEther(amount));
}
