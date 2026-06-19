import type { AssetBalance } from '@/features/tokens/types';
import {
  estimateTransferFee as estimateSolanaTransferFee,
  getAddressKind as getSolanaAddressKind,
  getNativeBalance,
  getSplTokenBalance,
  getSplTokenMetadata,
  getTransactionStatus as getSolanaTransactionStatus,
} from '@/shared/api/solana-client';
import type { SupportedChainId } from '@/shared/config/chains';
import { toSolanaAddress, toSolanaSignature } from '@/shared/utils/address';

export type Address = string;
export type Hex = string;
export type AddressKind = 'account' | 'contract' | 'unknown';

export type TokenMetadata = {
  accent?: string;
  decimals: number;
  iconUrl?: string;
  name: string;
  symbol: string;
};

export type TokenTransferSummary = {
  amount: number;
  contractAddress: string;
  decimals: number;
  from: string;
  name: string;
  symbol: string;
  to: string;
};

export type TransactionReceiptSummary = {
  blockNumber?: number;
  confirmations?: number;
  feeNative?: number;
  status: 'pending' | 'success' | 'failed';
};

export type TransactionLookupSummary = TransactionReceiptSummary & {
  amountNative: number;
  from?: string;
  hash: string;
  timestamp?: string;
  to?: string;
  tokenTransfers: TokenTransferSummary[];
};

export { getNativeBalance };

export function getPublicClient(_: SupportedChainId) {
  return null;
}

export function toEvmAddress(address: string): Address | null {
  return toSolanaAddress(address);
}

export function toNativeValueHex(_: string): Hex {
  return '0x0';
}

export async function getAddressKind(address: string, chainId: SupportedChainId): Promise<AddressKind> {
  const kind = await getSolanaAddressKind(address, chainId);
  return kind === 'program' ? 'contract' : kind;
}

export async function encodeBep20Transfer(_: string, __: string, ___: number): Promise<Hex | null> {
  return null;
}

export async function simulateBep20Transfer(_: {
  amount: string;
  asset: AssetBalance;
  chainId: SupportedChainId;
  from: string;
  recipient: string;
}) {
  return {
    error: 'SPL simulation is not wired through this legacy shim.',
    ok: false,
  };
}

export async function estimateTransferFee(_: {
  amount: string;
  asset: AssetBalance;
  chainId: SupportedChainId;
  from: string;
  recipient: string;
}) {
  return estimateSolanaTransferFee(_.chainId);
}

export async function getTokenBalance({
  address,
  chainId,
  contractAddress,
}: {
  address: string;
  chainId: SupportedChainId;
  contractAddress: string;
  decimals: number;
}) {
  return getSplTokenBalance({
    address,
    chainId,
    mint: contractAddress,
  });
}

export async function getTokenMetadata(contractAddress: string, chainId: SupportedChainId): Promise<TokenMetadata | null> {
  return getSplTokenMetadata(contractAddress, chainId);
}

export async function getTransactionStatus(hash: string, chainId: SupportedChainId) {
  return getTransactionReceiptSummary(hash, chainId);
}

export async function getTransactionReceiptSummary(hash: string, chainId: SupportedChainId): Promise<TransactionReceiptSummary | null> {
  const signature = toSolanaSignature(hash);

  if (!signature) {
    return null;
  }

  return getSolanaTransactionStatus(signature, chainId);
}

export async function getTransactionLookupSummary(hash: string, chainId: SupportedChainId): Promise<TransactionLookupSummary | null> {
  const signature = toSolanaSignature(hash);
  const summary = signature ? await getTransactionReceiptSummary(signature, chainId) : null;

  if (!signature || !summary) {
    return null;
  }

  return {
    ...summary,
    amountNative: 0,
    hash: signature,
    tokenTransfers: [],
  };
}
