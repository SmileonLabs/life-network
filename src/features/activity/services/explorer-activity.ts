import type { WalletActivity } from '@/features/activity/types';
import { fetchNormalTransactions, fetchTokenTransfers, type ExplorerNormalTransaction, type ExplorerTokenTransfer } from '@/shared/api/explorer';
import { supportedChains, type SupportedChainId } from '@/shared/config/chains';
import { normalizeAddress } from '@/shared/utils/address';
import { shortAddress } from '@/shared/utils/format';

export type ExplorerActivityResult = {
  activities: WalletActivity[];
  error: string | null;
  skipped: boolean;
};

export async function fetchExplorerActivities(address: string, chainId: SupportedChainId): Promise<ExplorerActivityResult> {
  const [normalTransactions, tokenTransfers] = await Promise.all([
    fetchNormalTransactions(address, chainId, 25),
    fetchTokenTransfers(address, chainId, 50),
  ]);

  const error = normalTransactions.error ?? tokenTransfers.error;
  const skipped = normalTransactions.skipped && tokenTransfers.skipped;

  if (skipped) {
    return {
      activities: [],
      error,
      skipped,
    };
  }

  const tokenTransferHashes = new Set(tokenTransfers.error ? [] : tokenTransfers.items.map((transfer) => transfer.hash.toLowerCase()));
  const activities = [
    ...(normalTransactions.error ? [] : normalTransactions.items.map((transaction) => mapNormalTransaction(transaction, address, chainId, tokenTransferHashes))),
    ...(tokenTransfers.error ? [] : tokenTransfers.items.map((transfer) => mapTokenTransfer(transfer, address, chainId))),
  ]
    .filter((activity): activity is WalletActivity => Boolean(activity))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    activities,
    error,
    skipped: false,
  };
}

function mapNormalTransaction(
  transaction: ExplorerNormalTransaction,
  address: string,
  chainId: SupportedChainId,
  tokenTransferHashes: Set<string>,
): WalletActivity | null {
  const amount = Number(transaction.value) / 10 ** 18;

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  if (amount === 0 && tokenTransferHashes.has(transaction.hash.toLowerCase())) {
    return null;
  }

  const chain = supportedChains[chainId];
  const from = normalizeAddress(transaction.from);
  const to = normalizeAddress(transaction.to);
  const wallet = normalizeAddress(address);
  const direction = from === wallet ? 'out' : 'in';
  const counterparty = direction === 'out' ? to : from;
  const feeNative = getNativeFee(transaction.gasUsed, transaction.gasPrice);
  const isContractInteraction = amount === 0;

  return {
    id: `${chainId}:${transaction.hash}:${isContractInteraction ? 'contract' : 'native'}`,
    amount,
    blockNumber: toNumber(transaction.blockNumber),
    chainId,
    confirmations: toNumber(transaction.confirmations),
    counterparty,
    direction,
    explorerUrl: `${chain.explorerBaseUrl}/tx/${transaction.hash}`,
    feeNative,
    from,
    hash: transaction.hash,
    status: transaction.isError === '1' || transaction.txreceipt_status === '0' ? 'failed' : 'success',
    subtitle: isContractInteraction ? getContractInteractionSubtitle(direction, counterparty) : `${direction === 'out' ? 'To' : 'From'} ${shortAddress(counterparty)}`,
    symbol: chain.nativeCurrency.symbol,
    timestamp: new Date(Number(transaction.timeStamp) * 1000).toISOString(),
    title: isContractInteraction ? 'Contract interaction' : `${chain.nativeCurrency.symbol} ${direction === 'out' ? 'sent' : 'received'}`,
    to,
  };
}

function mapTokenTransfer(transfer: ExplorerTokenTransfer, address: string, chainId: SupportedChainId): WalletActivity | null {
  const decimals = Number(transfer.tokenDecimal);

  if (!Number.isFinite(decimals)) {
    return null;
  }

  const amount = Number(transfer.value) / 10 ** decimals;

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const chain = supportedChains[chainId];
  const from = normalizeAddress(transfer.from);
  const to = normalizeAddress(transfer.to);
  const wallet = normalizeAddress(address);
  const direction = from === wallet ? 'out' : 'in';
  const counterparty = direction === 'out' ? to : from;
  const symbol = transfer.tokenSymbol || 'TOKEN';
  const contractAddress = normalizeAddress(transfer.contractAddress);
  const feeNative = getNativeFee(transfer.gasUsed, transfer.gasPrice);

  return {
    id: `${chainId}:${transfer.hash}:${contractAddress}`,
    amount,
    blockNumber: toNumber(transfer.blockNumber),
    chainId,
    confirmations: toNumber(transfer.confirmations),
    contractAddress,
    counterparty,
    direction,
    explorerUrl: `${chain.explorerBaseUrl}/tx/${transfer.hash}`,
    feeNative,
    from,
    hash: transfer.hash,
    status: 'success',
    subtitle: `${direction === 'out' ? 'To' : 'From'} ${shortAddress(counterparty)}`,
    symbol,
    timestamp: new Date(Number(transfer.timeStamp) * 1000).toISOString(),
    title: `${symbol} ${direction === 'out' ? 'sent' : 'received'}`,
    to,
  };
}

function getNativeFee(gasUsed: string, gasPrice?: string) {
  if (!gasPrice) {
    return undefined;
  }

  const gasUsedValue = Number(gasUsed);
  const gasPriceValue = Number(gasPrice);

  if (!Number.isFinite(gasUsedValue) || !Number.isFinite(gasPriceValue)) {
    return undefined;
  }

  return (gasUsedValue * gasPriceValue) / 10 ** 18;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getContractInteractionSubtitle(direction: 'in' | 'out', counterparty: string) {
  if (!counterparty) {
    return 'Contract call';
  }

  return `${direction === 'out' ? 'To' : 'From'} ${shortAddress(counterparty)}`;
}
