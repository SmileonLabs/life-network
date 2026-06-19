import type { SupportedChainId } from '@/shared/config/chains';

export type ExplorerResult<TItem> = {
  error: string | null;
  items: TItem[];
  skipped: boolean;
};

export type ExplorerNormalTransaction = {
  blockNumber: string;
  confirmations: string;
  from: string;
  gasPrice?: string;
  gasUsed: string;
  hash: string;
  isError: string;
  timeStamp: string;
  to: string;
  txreceipt_status: string;
  value: string;
};

export type ExplorerTokenTransfer = {
  blockNumber: string;
  confirmations: string;
  contractAddress: string;
  from: string;
  gasPrice?: string;
  gasUsed: string;
  hash: string;
  timeStamp: string;
  to: string;
  tokenDecimal: string;
  tokenName: string;
  tokenSymbol: string;
  value: string;
};

export async function fetchNormalTransactions(_: string, __: SupportedChainId, ___ = 25): Promise<ExplorerResult<ExplorerNormalTransaction>> {
  return emptyExplorerResult();
}

export async function fetchTokenTransfers(_: string, __: SupportedChainId, ___ = 100): Promise<ExplorerResult<ExplorerTokenTransfer>> {
  return emptyExplorerResult();
}

function emptyExplorerResult<TItem>(): ExplorerResult<TItem> {
  return {
    error: null,
    items: [],
    skipped: true,
  };
}
