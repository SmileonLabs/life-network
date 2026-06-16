import { type SupportedChainId, supportedChains } from '@/shared/config/chains';

export type Address = `0x${string}`;
type Hex = `0x${string}`;

export type TokenMetadata = {
  address: Address;
  decimals: number;
  name: string;
  symbol: string;
};

export type TransferAssetInput = {
  contractAddress?: string;
  decimals: number;
  type: 'native' | 'bep20';
};

export type ContractSimulationResult = {
  error: string | null;
  ok: boolean;
};

export type AddressKind = 'account' | 'contract' | 'unknown';

export type TransactionReceiptSummary = {
  status: 'pending' | 'success' | 'failed';
  blockNumber?: number;
  confirmations?: number;
  feeNative?: number;
};

export type TokenTransferSummary = {
  amount: number;
  amountRaw: string;
  contractAddress: Address;
  decimals: number;
  from: Address;
  name: string;
  symbol: string;
  to: Address;
};

export type TransactionLookupSummary = TransactionReceiptSummary & {
  amountNative: number;
  from?: Address;
  hash: Hex;
  timestamp?: string;
  to?: Address;
  tokenTransfers: TokenTransferSummary[];
};

type ReceiptLogInput = {
  address: Address;
  data: Hex;
  topics: readonly Hex[];
};

type WebViemChain = {
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
  id: SupportedChainId;
  name: string;
  nativeCurrency: {
    decimals: 18;
    name: string;
    symbol: 'BNB' | 'tBNB';
  };
  rpcUrls: {
    default: {
      http: string[];
    };
  };
  testnet: boolean;
};

const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const erc20Abi = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export async function getPublicClient(chainId: SupportedChainId) {
  const viem = await import('viem');
  const chain = toViemChain(chainId);

  return viem.createPublicClient({
    chain,
    transport: viem.http(chain.rpcUrls.default.http[0]),
  });
}

export async function getNativeBalance(address: string, chainId: SupportedChainId) {
  const viem = await import('viem');

  if (!viem.isAddress(address)) {
    return null;
  }

  const client = await getPublicClient(chainId);
  const balance = await client.getBalance({ address });
  return Number(viem.formatEther(balance));
}

export function toEvmAddress(address: string): Address | null {
  return /^0x[a-fA-F0-9]{40}$/.test(address) ? (address as Address) : null;
}

export async function parseNativeAmount(amount: string) {
  const viem = await import('viem');
  return viem.parseEther(amount);
}

export function toNativeValueHex(amount: string) {
  const [whole = '0', fraction = ''] = amount.split('.');
  const wei = BigInt(whole || '0') * 10n ** 18n + BigInt((fraction + '0'.repeat(18)).slice(0, 18));
  return `0x${wei.toString(16)}`;
}

export async function getAddressKind(address: string, chainId: SupportedChainId): Promise<AddressKind> {
  const target = toEvmAddress(address);

  if (!target) {
    return 'unknown';
  }

  try {
    const client = await getPublicClient(chainId);
    const bytecode = await client.getBytecode({ address: target });
    return bytecode && bytecode !== '0x' ? 'contract' : 'account';
  } catch {
    return 'unknown';
  }
}

export async function encodeBep20Transfer(recipient: string, amount: string, decimals: number) {
  const viem = await import('viem');
  const to = toEvmAddress(recipient);

  if (!to) {
    return null;
  }

  return viem.encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, viem.parseUnits(amount, decimals)],
  });
}

export async function simulateBep20Transfer({
  amount,
  asset,
  chainId,
  from,
  recipient,
}: {
  amount: string;
  asset: TransferAssetInput;
  chainId: SupportedChainId;
  from: string;
  recipient: string;
}): Promise<ContractSimulationResult> {
  const viem = await import('viem');
  const account = toEvmAddress(from);
  const token = asset.contractAddress ? toEvmAddress(asset.contractAddress) : null;
  const to = toEvmAddress(recipient);

  if (asset.type !== 'bep20') {
    return {
      error: null,
      ok: true,
    };
  }

  if (!account || !token || !to) {
    return {
      error: 'Token transfer is not ready.',
      ok: false,
    };
  }

  try {
    const client = await getPublicClient(chainId);
    await client.simulateContract({
      account,
      address: token,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, viem.parseUnits(amount, asset.decimals)],
    });

    return {
      error: null,
      ok: true,
    };
  } catch (error) {
    return {
      error: getSimulationErrorMessage(error),
      ok: false,
    };
  }
}

export async function estimateTransferFee({
  amount,
  asset,
  chainId,
  from,
  recipient,
}: {
  amount: string;
  asset: TransferAssetInput;
  chainId: SupportedChainId;
  from: string;
  recipient: string;
}) {
  const viem = await import('viem');
  const account = toEvmAddress(from);
  const to = toEvmAddress(recipient);

  if (!account || !to) {
    return null;
  }

  const client = await getPublicClient(chainId);
  const gasPrice = await client.getGasPrice();
  const gas =
    asset.type === 'native'
      ? await client.estimateGas({
          account,
          to,
          value: viem.parseEther(amount),
        })
      : await estimateTokenTransferGas(client, {
          account,
          amount,
          asset,
          recipient: to,
        });

  return Number(viem.formatEther(gas * gasPrice));
}

export async function getTokenBalance({
  address,
  chainId,
  contractAddress,
  decimals,
}: {
  address: string;
  chainId: SupportedChainId;
  contractAddress: string;
  decimals: number;
}) {
  const viem = await import('viem');
  const account = toEvmAddress(address);
  const token = toEvmAddress(contractAddress);

  if (!account || !token) {
    return null;
  }

  try {
    const client = await getPublicClient(chainId);
    const balance = await client.readContract({
      abi: erc20Abi,
      address: token,
      functionName: 'balanceOf',
      args: [account],
    });

    return Number(viem.formatUnits(balance, decimals));
  } catch {
    return null;
  }
}

export async function getTokenMetadata(contractAddress: string, chainId: SupportedChainId): Promise<TokenMetadata | null> {
  const address = toEvmAddress(contractAddress);

  if (!address) {
    return null;
  }

  try {
    const client = await getPublicClient(chainId);
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({ abi: erc20Abi, address, functionName: 'name' }),
      client.readContract({ abi: erc20Abi, address, functionName: 'symbol' }),
      client.readContract({ abi: erc20Abi, address, functionName: 'decimals' }),
    ]);

    return {
      address,
      decimals: Number(decimals),
      name: typeof name === 'string' ? name : 'BEP-20 Token',
      symbol: typeof symbol === 'string' ? symbol : 'TOKEN',
    };
  } catch {
    return null;
  }
}

export async function getTransactionStatus(hash: string, chainId: SupportedChainId) {
  const summary = await getTransactionReceiptSummary(hash, chainId);
  return summary?.status ?? null;
}

export async function getTransactionReceiptSummary(hash: string, chainId: SupportedChainId): Promise<TransactionReceiptSummary | null> {
  const txHash = toTransactionHash(hash);

  if (!txHash) {
    return null;
  }

  try {
    const viem = await import('viem');
    const client = await getPublicClient(chainId);
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    const latestBlockNumber = await client.getBlockNumber().catch(() => null);
    return {
      status: receipt.status === 'success' ? 'success' : 'failed',
      ...getReceiptMeta(receipt.blockNumber, receipt.gasUsed, receipt.effectiveGasPrice, viem.formatEther, latestBlockNumber),
    };
  } catch {
    return {
      status: 'pending',
    };
  }
}

export async function getTransactionLookupSummary(hash: string, chainId: SupportedChainId): Promise<TransactionLookupSummary | null> {
  const txHash = toTransactionHash(hash);

  if (!txHash) {
    return null;
  }

  try {
    const viem = await import('viem');
    const client = await getPublicClient(chainId);
    const transaction = await client.getTransaction({ hash: txHash });
    const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
    const latestBlockNumber = receipt ? await client.getBlockNumber().catch(() => null) : null;
    const receiptSummary: TransactionReceiptSummary = receipt
      ? {
          status: receipt.status === 'success' ? 'success' : 'failed',
          ...getReceiptMeta(receipt.blockNumber, receipt.gasUsed, receipt.effectiveGasPrice, viem.formatEther, latestBlockNumber),
        }
      : { status: 'pending' };
    const blockNumber = receiptSummary.blockNumber ?? toSafeNumber(transaction.blockNumber ?? undefined);
    const block = transaction.blockNumber
      ? await client.getBlock({ blockNumber: transaction.blockNumber }).catch(() => null)
      : null;
    const timestamp = block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : undefined;
    const tokenTransfers = receipt ? await getTokenTransferEventsFromLogs(receipt.logs, chainId) : [];

    return {
      amountNative: Number(viem.formatEther(transaction.value)),
      blockNumber,
      feeNative: receiptSummary.feeNative,
      from: transaction.from,
      hash: txHash,
      status: receiptSummary.status,
      timestamp,
      to: transaction.to ?? undefined,
      tokenTransfers,
    };
  } catch {
    return null;
  }
}

function getReceiptMeta(blockNumber: bigint, gasUsed: bigint, gasPrice: bigint | undefined, formatEther: (wei: bigint) => string, latestBlockNumber?: bigint | null) {
  const parsedBlockNumber = Number(blockNumber);
  const confirmations = latestBlockNumber ? Number(latestBlockNumber - blockNumber + 1n) : undefined;
  const feeNative = gasPrice ? Number(formatEther(gasUsed * gasPrice)) : undefined;

  return {
    ...(Number.isFinite(parsedBlockNumber) ? { blockNumber: parsedBlockNumber } : {}),
    ...(typeof confirmations === 'number' && Number.isFinite(confirmations) && confirmations > 0 ? { confirmations } : {}),
    ...(typeof feeNative === 'number' && Number.isFinite(feeNative) ? { feeNative } : {}),
  };
}

function toTransactionHash(hash: string): Hex | null {
  const trimmed = hash.trim();
  return /^0x[a-fA-F0-9]{64}$/.test(trimmed) ? (trimmed as Hex) : null;
}

function toSafeNumber(value?: bigint) {
  if (typeof value !== 'bigint') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function getTokenTransferEventsFromLogs(logs: readonly ReceiptLogInput[], chainId: SupportedChainId) {
  const viem = await import('viem');
  const transfers = await Promise.all(
    logs.map(async (log) => {
      const parsed = parseTransferLog(log);

      if (!parsed) {
        return null;
      }

      const metadata = await getTokenMetadata(log.address, chainId);
      const decimals = metadata?.decimals ?? 18;
      const amount = Number(viem.formatUnits(parsed.value, decimals));

      if (!Number.isFinite(amount)) {
        return null;
      }

      return {
        amount,
        amountRaw: parsed.value.toString(),
        contractAddress: log.address,
        decimals,
        from: parsed.from,
        name: metadata?.name ?? 'BEP-20 Token',
        symbol: metadata?.symbol ?? 'TOKEN',
        to: parsed.to,
      } satisfies TokenTransferSummary;
    }),
  );

  return transfers.filter((transfer): transfer is TokenTransferSummary => Boolean(transfer));
}

function parseTransferLog(log: ReceiptLogInput) {
  if (log.topics[0]?.toLowerCase() !== transferEventTopic || log.topics.length < 3 || log.data === '0x') {
    return null;
  }

  const from = topicToAddress(log.topics[1]);
  const to = topicToAddress(log.topics[2]);

  if (!from || !to) {
    return null;
  }

  try {
    return {
      from,
      to,
      value: BigInt(log.data),
    };
  } catch {
    return null;
  }
}

function topicToAddress(topic?: Hex): Address | null {
  if (!topic || topic.length < 42) {
    return null;
  }

  return toEvmAddress(`0x${topic.slice(-40)}`);
}

function toViemChain(chainId: SupportedChainId): WebViemChain {
  const chain = supportedChains[chainId];

  return {
    blockExplorers: {
      default: {
        name: chain.shortName,
        url: chain.explorerBaseUrl,
      },
    },
    id: chain.id,
    name: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: {
      default: {
        http: [chain.rpcUrl],
      },
    },
    testnet: chain.id === 97,
  };
}

async function estimateTokenTransferGas(
  client: Awaited<ReturnType<typeof getPublicClient>>,
  {
    account,
    amount,
    asset,
    recipient,
  }: {
    account: Address;
    amount: string;
    asset: TransferAssetInput;
    recipient: Address;
  },
) {
  const token = asset.contractAddress ? toEvmAddress(asset.contractAddress) : null;

  if (!token) {
    throw new Error('Token contract is missing.');
  }

  const data = await encodeBep20Transfer(recipient, amount, asset.decimals);

  if (!data) {
    throw new Error('Invalid recipient.');
  }

  return client.estimateGas({
    account,
    data,
    to: token,
  });
}

function getSimulationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (message.toLowerCase().includes('revert')) {
    return 'Token contract rejected this transfer.';
  }

  if (message.trim()) {
    return message.split('\n')[0]?.slice(0, 140) || 'Token transfer simulation failed.';
  }

  return 'Token transfer simulation failed.';
}
