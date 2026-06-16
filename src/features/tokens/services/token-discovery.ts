import type { AssetBalance } from '@/features/tokens/types';
import { getTokenBalance, getTokenMetadata } from '@/shared/api/evm-client';
import { fetchTokenTransfers, type ExplorerTokenTransfer } from '@/shared/api/explorer';
import type { SupportedChainId } from '@/shared/config/chains';
import { colors } from '@/shared/theme/tokens';
import { normalizeAddress } from '@/shared/utils/address';

export type TokenDiscoveryResult = {
  assets: AssetBalance[];
  error: string | null;
  skipped: boolean;
};

const discoveryPalette = [colors.cyan, colors.violet, colors.rose, colors.amber, colors.lime];

export async function discoverBep20Assets({
  address,
  chainId,
  knownContracts,
}: {
  address: string;
  chainId: SupportedChainId;
  knownContracts: string[];
}): Promise<TokenDiscoveryResult> {
  const transfers = await fetchTokenTransfers(address, chainId);

  if (transfers.skipped || transfers.error) {
    return {
      assets: [],
      error: transfers.error,
      skipped: transfers.skipped,
    };
  }

  const known = new Set(knownContracts.map(normalizeAddress));
  const candidates = getTokenCandidates(transfers.items).filter((candidate) => !known.has(normalizeAddress(candidate.contractAddress)));
  const assets = await Promise.all(
    candidates.slice(0, 12).map((candidate, index) =>
      buildDiscoveredAsset({
        address,
        candidate,
        chainId,
        index,
      }),
    ),
  );

  return {
    assets: assets.filter(isAssetBalance),
    error: null,
    skipped: false,
  };
}

function isAssetBalance(asset: AssetBalance | null): asset is AssetBalance {
  return Boolean(asset);
}

function getTokenCandidates(transfers: ExplorerTokenTransfer[]) {
  const byContract = new Map<string, ExplorerTokenTransfer>();

  transfers.forEach((transfer) => {
    const key = normalizeAddress(transfer.contractAddress);
    if (!byContract.has(key)) {
      byContract.set(key, transfer);
    }
  });

  return [...byContract.values()];
}

async function buildDiscoveredAsset({
  address,
  candidate,
  chainId,
  index,
}: {
  address: string;
  candidate: ExplorerTokenTransfer;
  chainId: SupportedChainId;
  index: number;
}): Promise<AssetBalance | null> {
  const metadata = await getTokenMetadata(candidate.contractAddress, chainId);
  const decimals = metadata?.decimals ?? Number(candidate.tokenDecimal);

  if (!Number.isFinite(decimals)) {
    return null;
  }

  const balance = await getTokenBalance({
    address,
    chainId,
    contractAddress: candidate.contractAddress,
    decimals,
  });

  if (balance === null || balance <= 0) {
    return null;
  }

  const symbol = metadata?.symbol || candidate.tokenSymbol || 'TOKEN';
  const contractAddress = normalizeAddress(candidate.contractAddress);

  return {
    id: `${chainId}:${contractAddress}`,
    accent: discoveryPalette[index % discoveryPalette.length],
    balance,
    chainId,
    change24h: 0,
    contractAddress,
    decimals,
    discoveredBy: 'explorer',
    name: metadata?.name || candidate.tokenName || `${symbol} Token`,
    priceUsd: 0,
    symbol,
    type: 'bep20',
    verified: Boolean(metadata),
  } satisfies AssetBalance;
}
