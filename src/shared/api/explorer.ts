import { supportedChains, type SupportedChainId } from '@/shared/config/chains';
import { env } from '@/shared/config/env';

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

type ExplorerApiResponse<TItem> = {
  message: string;
  result: TItem[] | string;
  status: string;
};

export async function fetchNormalTransactions(address: string, chainId: SupportedChainId, offset = 25): Promise<ExplorerResult<ExplorerNormalTransaction>> {
  return fetchExplorerItems<ExplorerNormalTransaction>({
    action: 'txlist',
    address,
    chainId,
    offset,
  });
}

export async function fetchTokenTransfers(address: string, chainId: SupportedChainId, offset = 100): Promise<ExplorerResult<ExplorerTokenTransfer>> {
  return fetchExplorerItems<ExplorerTokenTransfer>({
    action: 'tokentx',
    address,
    chainId,
    offset,
  });
}

async function fetchExplorerItems<TItem>({
  action,
  address,
  chainId,
  offset,
}: {
  action: 'tokentx' | 'txlist';
  address: string;
  chainId: SupportedChainId;
  offset: number;
}): Promise<ExplorerResult<TItem>> {
  if (!env.explorerApiKey) {
    return {
      error: null,
      items: [],
      skipped: true,
    };
  }

  const chain = supportedChains[chainId];
  const url = new URL(chain.explorerApiBaseUrl);
  url.searchParams.set('apikey', env.explorerApiKey);
  url.searchParams.set('chainid', String(chain.id));
  url.searchParams.set('module', 'account');
  url.searchParams.set('action', action);
  url.searchParams.set('address', address);
  url.searchParams.set('startblock', '0');
  url.searchParams.set('endblock', '999999999');
  url.searchParams.set('page', '1');
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('sort', 'desc');

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      return {
        error: normalizeExplorerError(`HTTP ${response.status}`),
        items: [],
        skipped: false,
      };
    }

    const data = (await response.json()) as ExplorerApiResponse<TItem>;

    if (Array.isArray(data.result)) {
      return {
        error: null,
        items: data.result,
        skipped: false,
      };
    }

    if (/no transactions/i.test(data.result) || /no transactions/i.test(data.message)) {
      return {
        error: null,
        items: [],
        skipped: false,
      };
    }

    return {
      error: normalizeExplorerError(data.result || data.message),
      items: [],
      skipped: false,
    };
  } catch (error) {
    return {
      error: normalizeExplorerError(error instanceof Error ? error.message : null),
      items: [],
      skipped: false,
    };
  }
}

function normalizeExplorerError(message?: string | null) {
  const value = message?.trim() ?? '';

  if (!value) {
    return 'Explorer sync unavailable.';
  }

  if (/missing|invalid|apikey|api key|NOTOK|rate limit|Max rate/i.test(value)) {
    return 'Explorer sync unavailable.';
  }

  if (/network|fetch|failed|timeout|HTTP/i.test(value)) {
    return 'Explorer sync delayed.';
  }

  return 'Explorer sync limited.';
}
