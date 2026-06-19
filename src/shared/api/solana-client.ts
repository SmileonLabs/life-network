import bs58 from 'bs58';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  getTokenMetadata as getToken2022Metadata,
} from '@solana/spl-token';

import type { AssetBalance } from '@/features/tokens/types';
import {
  getSolanaExplorerUrl,
  supportedChains,
  type ChainConfig,
  type SupportedChainId,
} from '@/shared/config/chains';
import { getKnownTokenByMint } from '@/shared/config/token-registry';
import { toSolanaAddress, toSolanaSignature } from '@/shared/utils/address';

export type SolanaAccountKind = 'account' | 'program' | 'unknown';

const connections = new Map<SupportedChainId, Connection>();

export function getSolanaConnection(chainId: SupportedChainId) {
  const cached = connections.get(chainId);

  if (cached) {
    return cached;
  }

  const connection = new Connection(supportedChains[chainId].rpcUrl, 'confirmed');
  connections.set(chainId, connection);
  return connection;
}

export function getExplorerAddressUrl(address: string, chainId: SupportedChainId) {
  return getSolanaExplorerUrl(supportedChains[chainId], 'address', address);
}

export function getExplorerTokenUrl(mint: string, chainId: SupportedChainId) {
  return getSolanaExplorerUrl(supportedChains[chainId], 'token', mint);
}

export function getExplorerTxUrl(signature: string, chainId: SupportedChainId) {
  return getSolanaExplorerUrl(supportedChains[chainId], 'tx', signature);
}

export async function getNativeBalance(address: string, chainId: SupportedChainId) {
  const publicKey = toPublicKey(address);

  if (!publicKey) {
    return null;
  }

  try {
    const lamports = await getSolanaConnection(chainId).getBalance(publicKey, 'confirmed');
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

export async function getSplTokenBalance({
  address,
  chainId,
  mint,
}: {
  address: string;
  chainId: SupportedChainId;
  mint: string;
}) {
  const owner = toPublicKey(address);
  const mintPublicKey = toPublicKey(mint);

  if (!owner || !mintPublicKey) {
    return null;
  }

  try {
    const tokenAddress = await getAssociatedTokenAddress(mintPublicKey, owner);
    const connection = getSolanaConnection(chainId);
    const [account, mintInfo] = await Promise.all([
      getAccount(connection, tokenAddress),
      getMint(connection, mintPublicKey),
    ]);
    return Number(account.amount) / 10 ** mintInfo.decimals;
  } catch {
    try {
      const parsed = await getSolanaConnection(chainId).getParsedTokenAccountsByOwner(owner, { mint: mintPublicKey });
      const uiAmount = parsed.value[0]?.account.data.parsed.info.tokenAmount.uiAmount;
      return typeof uiAmount === 'number' ? uiAmount : 0;
    } catch {
      return 0;
    }
  }
}

export async function getSplTokenMetadata(mint: string, chainId: SupportedChainId) {
  const mintPublicKey = toPublicKey(mint);

  if (!mintPublicKey) {
    return null;
  }

  try {
    const connection = getSolanaConnection(chainId);
    const mintInfo = await getMint(connection, mintPublicKey).catch(() =>
      getMint(connection, mintPublicKey, 'confirmed', TOKEN_2022_PROGRAM_ID),
    );
    const token2022Metadata = await getToken2022Metadata(connection, mintPublicKey, 'confirmed').catch(() => null);
    const metadataImage = await fetchTokenImageUrl(token2022Metadata?.uri);
    const knownToken = getKnownTokenByMint(chainId, mintPublicKey.toBase58());

    return {
      accent: knownToken?.accent,
      decimals: mintInfo.decimals,
      iconUrl: metadataImage,
      mint: mintPublicKey.toBase58(),
      name: knownToken?.name ?? cleanTokenLabel(token2022Metadata?.name) ?? 'SPL Token',
      symbol: knownToken?.symbol ?? cleanTokenLabel(token2022Metadata?.symbol) ?? 'SPL',
    };
  } catch {
    return null;
  }
}

export async function getAddressKind(address: string, chainId: SupportedChainId): Promise<SolanaAccountKind> {
  const publicKey = toPublicKey(address);

  if (!publicKey) {
    return 'unknown';
  }

  try {
    const account = await getSolanaConnection(chainId).getAccountInfo(publicKey, 'confirmed');

    if (!account) {
      return 'account';
    }

    return account.executable ? 'program' : 'account';
  } catch {
    return 'unknown';
  }
}

export async function estimateTransferFee(chainId: SupportedChainId) {
  try {
    const connection = getSolanaConnection(chainId);
    const blockhash = await connection.getLatestBlockhash();
    const message = new Transaction({ recentBlockhash: blockhash.blockhash }).compileMessage();
    const fee = await connection.getFeeForMessage(message, 'confirmed');
    return fee.value ? fee.value / LAMPORTS_PER_SOL : 0.000005;
  } catch {
    return 0.000005;
  }
}

export async function buildSolTransferTransaction({
  amount,
  chainId,
  from,
  recipient,
}: {
  amount: string;
  chainId: SupportedChainId;
  from: string;
  recipient: string;
}) {
  const fromPublicKey = toPublicKey(from);
  const toPublicKeyValue = toPublicKey(recipient);

  if (!fromPublicKey || !toPublicKeyValue) {
    throw new Error('Invalid Solana address.');
  }

  const lamports = parseSolAmountToLamports(amount);

  if (lamports <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }

  const connection = getSolanaConnection(chainId);
  const latestBlockhash = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({
    feePayer: fromPublicKey,
    recentBlockhash: latestBlockhash.blockhash,
  });

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      lamports,
      toPubkey: toPublicKeyValue,
    }),
  );

  return transaction;
}

export function serializeSolanaTransaction(transaction: Transaction | Uint8Array) {
  if (transaction instanceof Uint8Array) {
    return transaction;
  }

  return transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
}

export function encodeSolanaSignature(signature: string | Uint8Array | number[]) {
  if (typeof signature === 'string') {
    return signature;
  }

  return bs58.encode(Uint8Array.from(signature));
}

export async function getTransactionStatus(signature: string, chainId: SupportedChainId) {
  const normalized = toSolanaSignature(signature);

  if (!normalized) {
    return null;
  }

  try {
    const response = await getSolanaConnection(chainId).getSignatureStatuses([normalized], {
      searchTransactionHistory: true,
    });
    const status = response.value[0];

    if (!status) {
      return {
        confirmations: undefined,
        status: 'pending' as const,
      };
    }

    return {
      confirmations: status.confirmations ?? undefined,
      status: status.err ? ('failed' as const) : status.confirmationStatus === 'finalized' || status.confirmationStatus === 'confirmed' ? ('success' as const) : ('pending' as const),
    };
  } catch {
    return null;
  }
}

export function isSplAsset(asset: AssetBalance | undefined) {
  return asset?.type === 'spl';
}

export function getPrivySolanaChain(chain: ChainConfig) {
  return chain.privyChain;
}

function toPublicKey(address: string) {
  const normalized = toSolanaAddress(address);

  if (!normalized) {
    return null;
  }

  try {
    return new PublicKey(normalized);
  } catch {
    return null;
  }
}

function parseSolAmountToLamports(amount: string) {
  const normalized = amount.trim();

  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return 0;
  }

  const [whole = '0', fraction = ''] = normalized.split('.');
  const paddedFraction = (fraction + '0'.repeat(9)).slice(0, 9);
  const lamports = BigInt(whole || '0') * BigInt(LAMPORTS_PER_SOL) + BigInt(paddedFraction || '0');

  if (lamports > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Amount is too large.');
  }

  return Number(lamports);
}

async function fetchTokenImageUrl(uri?: string | null) {
  if (!uri || !isHttpUrl(uri)) {
    return undefined;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = setTimeout(() => controller?.abort(), 2500);

  try {
    const response = await fetch(uri, {
      signal: controller?.signal,
    });

    if (!response.ok) {
      return undefined;
    }

    const json = (await response.json()) as { image?: unknown; image_url?: unknown; logoURI?: unknown };
    const imageUrl = [json.image, json.image_url, json.logoURI].find((value): value is string => typeof value === 'string');
    return imageUrl && isHttpUrl(imageUrl) ? imageUrl : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function cleanTokenLabel(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}
