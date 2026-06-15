import { type SupportedChainId } from '@/shared/config/chains';

export type Address = `0x${string}`;

export function getPublicClient(chainId: SupportedChainId) {
  return { chainId };
}

export async function getNativeBalance(_address: string, _chainId: SupportedChainId) {
  return null;
}

export function toEvmAddress(address: string): Address | null {
  return /^0x[a-fA-F0-9]{40}$/.test(address) ? (address as Address) : null;
}

export function toNativeValueHex(amount: string) {
  const [whole = '0', fraction = ''] = amount.split('.');
  const wei = BigInt(whole || '0') * 10n ** 18n + BigInt((fraction + '0'.repeat(18)).slice(0, 18));
  return `0x${wei.toString(16)}`;
}
