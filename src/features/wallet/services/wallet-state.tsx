import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { fetchExplorerActivities } from '@/features/activity/services/explorer-activity';
import { getDemoActivities } from '@/features/activity/services/demo-activity';
import type { WalletActivity } from '@/features/activity/types';
import { discoverBep20Assets } from '@/features/tokens/services/token-discovery';
import { getDemoAssets } from '@/features/tokens/services/demo-tokens';
import type { AssetBalance } from '@/features/tokens/types';
import {
  isAmountGreaterThanBalance,
  isAmountWithGasGreaterThanBalance,
  validateTransfer,
} from '@/features/transfer/services/transfer-validation';
import {
  bep20TransferGasFallbackBnb,
  getGasReserveBnb,
  nativeTransferGasFallbackBnb,
  type TransferValidation,
} from '@/features/transfer/types';
import { useWalletAdapter } from '@/features/wallet/services/wallet-adapter';
import type { Eip1193Provider } from '@/features/wallet/services/wallet-adapter.types';
import type { WalletAccount } from '@/features/wallet/types';
import {
  encodeBep20Transfer,
  estimateTransferFee,
  getAddressKind,
  getNativeBalance,
  getTokenBalance,
  getTokenMetadata,
  getTransactionLookupSummary,
  getTransactionReceiptSummary,
  simulateBep20Transfer,
  toEvmAddress,
  toNativeValueHex,
  type AddressKind,
  type TokenTransferSummary,
} from '@/shared/api/evm-client';
import { fetchBnbUsdPrice } from '@/shared/api/price-feed';
import { defaultChain, supportedChains, type ChainConfig, type SupportedChainId } from '@/shared/config/chains';
import { colors } from '@/shared/theme/tokens';
import { isSameAddress, makeDemoAddress, makeDemoHash, normalizeAddress } from '@/shared/utils/address';
import { shortAddress } from '@/shared/utils/format';
import { readStorageValue, writeStorageValue } from '@/shared/utils/storage';

type SendTransferInput = {
  assetId: string;
  recipient: string;
  amount: string;
};

type AddTokenResult = {
  asset: AssetBalance | null;
  error: string | null;
  networkHint?: {
    chainId: SupportedChainId;
    name: string;
    symbol: string;
  };
};

type FeeEstimateResult = {
  error: string | null;
  fee: number | null;
};

type RecipientInspectionResult = {
  kind: AddressKind;
  warning: string | null;
};

type ActivityLookupResult = {
  activity: WalletActivity;
  chainId: SupportedChainId;
  foundOnDifferentChain: boolean;
};

type WalletContextValue = {
  chainId: SupportedChainId;
  setChainId: (chainId: SupportedChainId) => void;
  wallets: WalletAccount[];
  activeWallet: WalletAccount | null;
  setActiveWalletId: (walletId: string) => void;
  assets: AssetBalance[];
  coreAssets: AssetBalance[];
  discoveredAssets: AssetBalance[];
  totalUsd: number;
  lifeAsset: AssetBalance | undefined;
  nativeAsset: AssetBalance | undefined;
  activities: WalletActivity[];
  isRefreshing: boolean;
  refreshError: string | null;
  refreshWallet: () => Promise<void>;
  refreshActivityStatus: (hash?: string) => Promise<void>;
  lookupActivityByHash: (hash: string) => Promise<WalletActivity | null>;
  lookupActivityAcrossChains: (hash: string) => Promise<ActivityLookupResult | null>;
  addTokenByContract: (contractAddress: string) => Promise<AddTokenResult>;
  removeManualToken: (assetId: string) => boolean;
  estimateSendFee: (assetId: string, recipient: string, amount: string) => Promise<FeeEstimateResult>;
  inspectRecipient: (recipient: string, assetId?: string) => Promise<RecipientInspectionResult>;
  validateSend: (assetId: string, recipient: string, amount: string, gasReserveBnb?: number | null) => TransferValidation;
  sendTransfer: (input: SendTransferInput) => Promise<WalletActivity | null>;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const activeWalletKey = 'life-wallet-active-wallet';
const assetDebitsKey = 'life-wallet-asset-debits';
const chainIdKey = 'life-wallet-chain-id';
const localActivitiesKey = 'life-wallet-local-activities';
const manualAssetsKey = 'life-wallet-manual-assets';
const foregroundRefreshCooldownMs = 12000;
const slowPendingMs = 10 * 60 * 1000;
const stalePendingMs = 60 * 60 * 1000;

function createMainWallet({
  address,
  chainId,
  isPrivy,
  userId,
}: {
  address?: string | null;
  chainId: SupportedChainId;
  isPrivy: boolean;
  userId: string;
}): WalletAccount | null {
  if (isPrivy && !address) {
    return null;
  }

  return {
    id: `generated:${userId}:${chainId}`,
    source: 'privy-generated',
    address: address ?? makeDemoAddress(`${userId}:${chainId}:generated`),
    label: 'Main Wallet',
    chainId,
    createdAt: new Date().toISOString(),
    isPrivy,
  };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const walletAdapter = useWalletAdapter();
  const lastForegroundRefreshRef = useRef(0);
  const [chainId, setChainIdState] = useState<SupportedChainId>(() => readStoredChainId());
  const [activeWalletId, setActiveWalletIdState] = useState<string>(
    () => readStoredValue(activeWalletKey) ?? '',
  );
  const [assetDebits, setAssetDebits] = useState<Record<string, number>>(
    () => readStoredValue(assetDebitsKey) ?? {},
  );
  const [localActivities, setLocalActivities] = useState<WalletActivity[]>(
    () => readStoredValue(localActivitiesKey) ?? [],
  );
  const [manualAssets, setManualAssets] = useState<AssetBalance[]>(
    () => readStoredValue(manualAssetsKey) ?? [],
  );
  const [liveNativeBalance, setLiveNativeBalance] = useState<{
    address: string;
    balance: number;
    chainId: SupportedChainId;
  } | null>(null);
  const [liveTokenBalances, setLiveTokenBalances] = useState<{
    address: string;
    balances: Record<string, number>;
    chainId: SupportedChainId;
  } | null>(null);
  const [discoveredExplorerAssets, setDiscoveredExplorerAssets] = useState<{
    address: string;
    assets: AssetBalance[];
    chainId: SupportedChainId;
  } | null>(null);
  const [explorerActivities, setExplorerActivities] = useState<WalletActivity[]>([]);
  const [liveBnbPriceUsd, setLiveBnbPriceUsd] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchBnbUsdPrice().then((price) => {
      if (!cancelled && price !== null) {
        setLiveBnbPriceUsd(price);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const mainWallet = useMemo(() => {
    if (!user || user.method !== 'google') {
      return null;
    }

    return createMainWallet({
      address: user.isPrivy ? walletAdapter.address : null,
      chainId,
      isPrivy: user.isPrivy,
      userId: user.id,
    });
  }, [chainId, user, walletAdapter.address]);

  const wallets = useMemo(() => (mainWallet ? [mainWallet] : []), [mainWallet]);

  const activeWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === activeWalletId) ?? wallets[0] ?? null,
    [activeWalletId, wallets],
  );
  const activeWalletAddress = activeWallet?.address ?? null;

  const setActiveWalletId = useCallback((walletId: string) => {
    writeStoredValue(activeWalletKey, walletId);
    setActiveWalletIdState(walletId);
  }, []);

  const setChainId = useCallback((nextChainId: SupportedChainId) => {
    writeStoredValue(chainIdKey, nextChainId);
    setChainIdState(nextChainId);
  }, []);

  useEffect(() => {
    if (!user?.isPrivy || !walletAdapter.isReady || walletAdapter.address) {
      return;
    }

    walletAdapter.createWallet().catch(() => {
      // Privy exposes wallet creation errors through its own UI/state.
    });
  }, [user?.isPrivy, walletAdapter]);

  useEffect(() => {
    if (!activeWallet?.isPrivy || !toEvmAddress(activeWallet.address)) {
      return;
    }

    let cancelled = false;

    getNativeBalance(activeWallet.address, chainId)
      .then((balance) => {
        if (!cancelled && balance !== null) {
          setLiveNativeBalance({ address: activeWallet.address, balance, chainId });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveNativeBalance(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeWallet?.address, activeWallet?.isPrivy, chainId]);

  const refreshWallet = useCallback(async () => {
    if (!activeWallet?.isPrivy || !toEvmAddress(activeWallet.address)) {
      setDiscoveredExplorerAssets(null);
      setExplorerActivities([]);
      setLiveTokenBalances(null);
      setRefreshError(null);
      return;
    }

    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const baseAssets = getDemoAssets(chainId);
      const chainManualAssets = getScopedManualAssets(manualAssets, chainId, activeWallet.address);
      const knownContracts = [...baseAssets, ...chainManualAssets]
        .map((asset) => asset.contractAddress)
        .filter((address): address is string => Boolean(address));
      const [nativeBalance, tokenDiscovery, explorerActivity, bnbPriceUsd] = await Promise.all([
        getNativeBalance(activeWallet.address, chainId),
        discoverBep20Assets({
          address: activeWallet.address,
          chainId,
          knownContracts,
        }),
        fetchExplorerActivities(activeWallet.address, chainId),
        fetchBnbUsdPrice(),
      ]);

      if (nativeBalance !== null) {
        setLiveNativeBalance({
          address: activeWallet.address,
          balance: nativeBalance,
          chainId,
        });
      }

      if (bnbPriceUsd !== null) {
        setLiveBnbPriceUsd(bnbPriceUsd);
      }

      setDiscoveredExplorerAssets({
        address: activeWallet.address,
        assets: tokenDiscovery.assets,
        chainId,
      });
      setExplorerActivities(explorerActivity.activities);
      setLiveTokenBalances({
        address: activeWallet.address,
        balances: await getLiveTokenBalances(activeWallet.address, chainId, [...baseAssets, ...chainManualAssets, ...tokenDiscovery.assets]),
        chainId,
      });

      const skippedNotice = tokenDiscovery.skipped || explorerActivity.skipped ? 'Explorer sync unavailable.' : null;
      const nextError = [tokenDiscovery.error, explorerActivity.error, skippedNotice].filter(Boolean).join(' · ');
      setRefreshError(nextError || null);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'Unable to refresh wallet.');
    } finally {
      setIsRefreshing(false);
    }
  }, [activeWallet, chainId, manualAssets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshWallet();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [refreshWallet]);

  const refreshActivityStatus = useCallback(
    async (hash?: string) => {
      if (!activeWalletAddress) {
        return;
      }

      const pendingActivities = localActivities.filter(
        (activity) =>
          activity.chainId === chainId &&
          activity.status === 'pending' &&
          isActivityForWallet(activity, activeWalletAddress) &&
          (!hash || activity.hash === hash),
      );

      if (pendingActivities.length === 0) {
        return;
      }

      const receiptEntries = await Promise.all(
        pendingActivities.map(async (activity) => ({
          chainId: activity.chainId,
          hash: activity.hash,
          receipt: await getTransactionReceiptSummary(activity.hash, chainId),
        })),
      );
      const checkedAt = new Date().toISOString();

      setLocalActivities((currentActivities) => {
        let changed = false;
        const settledDebits: { amount: number; key: string }[] = [];
        const nextActivities = currentActivities.map((activity) => {
          const receipt = receiptEntries.find((entry) => entry.chainId === activity.chainId && entry.hash === activity.hash)?.receipt;
          const nextStatus = receipt?.status;
          const pendingMeta = getPendingMeta(activity, checkedAt);

          if (!nextStatus) {
            return activity;
          }

          if (nextStatus === 'pending') {
            if (!hasPendingMetaChanged(activity, pendingMeta)) {
              return activity;
            }

            changed = true;
            return {
              ...activity,
              ...pendingMeta,
            };
          }

          if (nextStatus === activity.status) {
            return activity;
          }

          changed = true;
          const activityDebits = activity.pendingDebits?.length
            ? activity.pendingDebits
            : activity.assetId
              ? [{ amount: activity.amount, assetId: activity.assetId }]
              : [];

          activityDebits.forEach((debit) => {
            settledDebits.push({
              amount: debit.amount,
              key: `${activeWalletAddress}:${debit.assetId}`,
            });
          });

          return {
            ...activity,
            blockNumber: receipt?.blockNumber ?? activity.blockNumber,
            confirmations: receipt?.confirmations ?? activity.confirmations,
            feeNative: receipt?.feeNative ?? activity.feeNative,
            lastCheckedAt: checkedAt,
            pendingDebits: undefined,
            pendingNotice: undefined,
            status: nextStatus,
          };
        });

        if (changed) {
          writeStoredValue(localActivitiesKey, nextActivities);
        }

        if (settledDebits.length > 0) {
          setAssetDebits((currentDebits) => {
            const nextDebits = { ...currentDebits };
            settledDebits.forEach(({ amount, key }) => {
              const nextDebit = Math.max((nextDebits[key] ?? 0) - amount, 0);
              if (nextDebit <= 0) {
                delete nextDebits[key];
              } else {
                nextDebits[key] = nextDebit;
              }
            });
            writeStoredValue(assetDebitsKey, nextDebits);
            return nextDebits;
          });
          refreshWallet().catch(() => undefined);
        }

        return changed ? nextActivities : currentActivities;
      });
    },
    [activeWalletAddress, chainId, localActivities, refreshWallet],
  );

  useEffect(() => {
    if (!activeWalletAddress) {
      return;
    }

    const pendingActivities = localActivities.filter(
      (activity) => activity.chainId === chainId && activity.status === 'pending' && isActivityForWallet(activity, activeWalletAddress),
    );

    if (pendingActivities.length === 0) {
      return;
    }

    const startTimer = setTimeout(() => {
      refreshActivityStatus().catch(() => undefined);
    }, 0);

    const timer = setInterval(() => {
      refreshActivityStatus().catch(() => undefined);
    }, 15000);

    return () => {
      clearTimeout(startTimer);
      clearInterval(timer);
    };
  }, [activeWalletAddress, chainId, localActivities, refreshActivityStatus]);

  useEffect(() => {
    if (!activeWallet?.isPrivy || !activeWalletAddress) {
      return;
    }

    const refreshAfterForeground = () => {
      const now = Date.now();

      if (now - lastForegroundRefreshRef.current < foregroundRefreshCooldownMs) {
        return;
      }

      lastForegroundRefreshRef.current = now;
      refreshWallet().catch(() => undefined);
      refreshActivityStatus().catch(() => undefined);
    };

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshAfterForeground();
      }
    });
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined' || !document.hidden) {
        refreshAfterForeground();
      }
    };
    const handleWindowFocus = () => {
      refreshAfterForeground();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWindowFocus);
    }

    return () => {
      appStateSubscription.remove();

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus);
      }
    };
  }, [activeWallet?.isPrivy, activeWalletAddress, refreshActivityStatus, refreshWallet]);

  const assets = useMemo(() => {
    const walletKey = activeWalletAddress ?? 'no-wallet';
    const shouldUseLiveNativeBalance = Boolean(user?.isPrivy);
    const baseAssets = getDemoAssets(chainId);
    const chainManualAssets = activeWalletAddress ? getScopedManualAssets(manualAssets, chainId, activeWalletAddress) : [];
    const scopedDiscoveredAssets =
      activeWalletAddress && discoveredExplorerAssets?.address === activeWalletAddress && discoveredExplorerAssets.chainId === chainId
        ? discoveredExplorerAssets.assets
        : [];
    const mergedAssets = mergeAssets(baseAssets, chainManualAssets, scopedDiscoveredAssets);

    return mergedAssets.map((asset) => {
      const liveBalance =
        asset.type === 'native' &&
        Boolean(liveNativeBalance) &&
        liveNativeBalance?.address === activeWalletAddress &&
        liveNativeBalance?.chainId === chainId
          ? liveNativeBalance.balance
          : null;
      const liveTokenBalance =
        asset.type === 'bep20' &&
        asset.contractAddress &&
        activeWalletAddress &&
        liveTokenBalances?.address === activeWalletAddress &&
        liveTokenBalances.chainId === chainId
          ? liveTokenBalances.balances[getTokenBalanceKey(chainId, asset.contractAddress)] ?? null
          : null;
      const debitKey = `${walletKey}:${asset.id}`;
      const debit = assetDebits[debitKey] ?? 0;
      const fallbackBalance = shouldUseLiveNativeBalance ? 0 : asset.balance;
      return {
        ...asset,
        balance: Math.max((liveBalance ?? liveTokenBalance ?? fallbackBalance) - debit, 0),
        priceUsd: getLiveAssetPriceUsd(asset, liveBnbPriceUsd),
      };
    });
  }, [activeWalletAddress, assetDebits, chainId, discoveredExplorerAssets, liveBnbPriceUsd, liveNativeBalance, liveTokenBalances, manualAssets, user?.isPrivy]);

  const nativeAsset = assets.find((asset) => asset.type === 'native');
  const lifeAsset = assets.find((asset) => asset.symbol === 'LIFE');
  const coreAssets = assets.filter((asset) => asset.discoveredBy === 'core');
  const discoveredAssets = assets.filter((asset) => asset.discoveredBy !== 'core');
  const totalUsd = assets.reduce((sum, asset) => sum + asset.balance * asset.priceUsd, 0);
  const activities = useMemo(() => {
    if (!activeWallet) {
      return [];
    }

    const chainLocalActivities = localActivities.filter((activity) => activity.chainId === chainId && isActivityForWallet(activity, activeWallet.address));
    const scopedExplorerActivities = explorerActivities.filter((activity) => isActivityForWallet(activity, activeWallet.address));
    const demoActivities = user?.isPrivy ? [] : getDemoActivities(activeWallet.address, chainId);
    return mergeActivities([...chainLocalActivities, ...scopedExplorerActivities, ...demoActivities]);
  }, [activeWallet, chainId, explorerActivities, localActivities, user?.isPrivy]);

  const buildLookupActivity = useCallback(
    async (hash: string, targetChainId: SupportedChainId): Promise<WalletActivity | null> => {
      const summary = await getTransactionLookupSummary(hash, targetChainId);

      if (!summary) {
        return null;
      }

      const chain = supportedChains[targetChainId];
      const from = summary.from ? normalizeAddress(summary.from) : undefined;
      const to = summary.to ? normalizeAddress(summary.to) : undefined;
      const walletAddress = activeWallet?.address ? normalizeAddress(activeWallet.address) : null;
      const tokenTransfer = pickPrimaryTokenTransfer(summary.tokenTransfers, walletAddress);

      if (tokenTransfer) {
        const tokenFrom = normalizeAddress(tokenTransfer.from);
        const tokenTo = normalizeAddress(tokenTransfer.to);
        const isOutgoing = Boolean(walletAddress && tokenFrom === walletAddress);
        const isIncoming = Boolean(walletAddress && tokenTo === walletAddress);
        const direction = isOutgoing ? 'out' : 'in';
        const counterparty = isOutgoing ? tokenTo : isIncoming ? tokenFrom : tokenTo;
        const matchingAsset = assets.find(
          (asset) => asset.chainId === targetChainId && asset.contractAddress && isSameAddress(asset.contractAddress, tokenTransfer.contractAddress),
        );

        return {
          id: `${targetChainId}:${summary.hash}:${tokenTransfer.contractAddress}:lookup`,
          amount: tokenTransfer.amount,
          assetId: matchingAsset?.id,
          blockNumber: summary.blockNumber,
          chainId: targetChainId,
          confirmations: summary.confirmations,
          contractAddress: normalizeAddress(tokenTransfer.contractAddress),
          counterparty,
          direction,
          explorerUrl: `${chain.explorerBaseUrl}/tx/${summary.hash}`,
          feeNative: summary.feeNative,
          from: tokenFrom,
          hash: summary.hash,
          status: summary.status,
          subtitle: `${isOutgoing ? 'To' : isIncoming ? 'From' : 'Address'} ${shortAddress(counterparty)}`,
          symbol: tokenTransfer.symbol,
          timestamp: summary.timestamp ?? new Date().toISOString(),
          title: `${tokenTransfer.symbol} ${direction === 'out' ? 'sent' : 'received'}`,
          to: tokenTo,
        };
      }

      const isOutgoing = Boolean(walletAddress && from === walletAddress);
      const isIncoming = Boolean(walletAddress && to === walletAddress);
      const direction = isOutgoing ? 'out' : 'in';
      const counterparty = isOutgoing ? to : isIncoming ? from : to ?? from;
      const hasNativeValue = summary.amountNative > 0;
      const title = hasNativeValue
        ? `${chain.nativeCurrency.symbol} ${direction === 'out' ? 'sent' : 'received'}`
        : 'Contract interaction';
      const subtitle = counterparty
        ? `${isOutgoing ? 'To' : isIncoming ? 'From' : 'Address'} ${shortAddress(counterparty)}`
        : chain.shortName;

      return {
        id: `${targetChainId}:${summary.hash}:lookup`,
        amount: summary.amountNative,
        assetId: nativeAsset?.chainId === targetChainId ? nativeAsset.id : undefined,
        blockNumber: summary.blockNumber,
        chainId: targetChainId,
        confirmations: summary.confirmations,
        counterparty,
        direction,
        explorerUrl: `${chain.explorerBaseUrl}/tx/${summary.hash}`,
        feeNative: summary.feeNative,
        from,
        hash: summary.hash,
        status: summary.status,
        subtitle,
        symbol: chain.nativeCurrency.symbol,
        timestamp: summary.timestamp ?? new Date().toISOString(),
        title,
        to,
      };
    },
    [activeWallet, assets, nativeAsset],
  );

  const lookupActivityByHash = useCallback(
    async (hash: string): Promise<WalletActivity | null> => buildLookupActivity(hash, chainId),
    [buildLookupActivity, chainId],
  );

  const lookupActivityAcrossChains = useCallback(
    async (hash: string): Promise<ActivityLookupResult | null> => {
      const currentActivity = await buildLookupActivity(hash, chainId);

      if (currentActivity) {
        return {
          activity: currentActivity,
          chainId,
          foundOnDifferentChain: false,
        };
      }

      const otherChainIds = (Object.keys(supportedChains).map(Number) as SupportedChainId[]).filter((id) => id !== chainId);

      for (const nextChainId of otherChainIds) {
        const activity = await buildLookupActivity(hash, nextChainId);

        if (activity) {
          return {
            activity,
            chainId: nextChainId,
            foundOnDifferentChain: true,
          };
        }
      }

      return null;
    },
    [buildLookupActivity, chainId],
  );

  const addTokenByContract = useCallback(
    async (contractAddress: string): Promise<AddTokenResult> => {
      if (!activeWallet) {
        return {
          asset: null,
          error: 'Wallet is not ready.',
        };
      }

      const contract = toEvmAddress(contractAddress.trim());

      if (!contract) {
        return {
          asset: null,
          error: 'Enter a valid token contract.',
        };
      }

      const key = getTokenBalanceKey(chainId, contract);
      const existingAsset = assets.find((asset) => asset.contractAddress && getTokenBalanceKey(chainId, asset.contractAddress) === key);

      if (existingAsset) {
        return {
          asset: existingAsset,
          error: null,
        };
      }

      const metadata = await getTokenMetadata(contract, chainId);

      if (!metadata) {
        const otherChainIds = (Object.keys(supportedChains).map(Number) as SupportedChainId[]).filter((id) => id !== chainId);

        for (const nextChainId of otherChainIds) {
          const nextMetadata = await getTokenMetadata(contract, nextChainId);

          if (nextMetadata) {
            return {
              asset: null,
              error: `Token found on ${supportedChains[nextChainId].shortName}.`,
              networkHint: {
                chainId: nextChainId,
                name: nextMetadata.name,
                symbol: nextMetadata.symbol,
              },
            };
          }
        }

        return {
          asset: null,
          error: 'Token contract was not found.',
        };
      }

      const balance =
        (await getTokenBalance({
          address: activeWallet.address,
          chainId,
          contractAddress: contract,
          decimals: metadata.decimals,
        })) ?? 0;

      const asset: AssetBalance = {
        id: key,
        accent: colors.cyan,
        balance,
        chainId,
        change24h: 0,
        contractAddress: normalizeAddress(contract),
        decimals: metadata.decimals,
        discoveredBy: 'manual',
        name: metadata.name,
        priceUsd: 0,
        symbol: metadata.symbol,
        type: 'bep20',
        ownerAddress: normalizeAddress(activeWallet.address),
        verified: true,
      };

      setManualAssets((currentAssets) => {
        const nextAssets = upsertManualAsset(currentAssets, asset);
        writeStoredValue(manualAssetsKey, nextAssets);
        return nextAssets;
      });
      setLiveTokenBalances((currentBalances) => ({
        address: activeWallet.address,
        balances:
          currentBalances?.address === activeWallet.address && currentBalances.chainId === chainId
            ? {
                ...currentBalances.balances,
                [key]: balance,
              }
            : {
                [key]: balance,
              },
        chainId,
      }));

      return {
        asset,
        error: null,
      };
    },
    [activeWallet, assets, chainId],
  );

  const removeManualToken = useCallback(
    (assetId: string) => {
      if (!activeWalletAddress) {
        return false;
      }

      const targetAsset = manualAssets.find(
        (asset) =>
          asset.id === assetId &&
          asset.chainId === chainId &&
          asset.discoveredBy === 'manual' &&
          isManualAssetForWallet(asset, activeWalletAddress),
      );

      if (!targetAsset) {
        return false;
      }

      setManualAssets((currentAssets) => {
        const nextAssets = currentAssets.filter(
          (asset) => !(asset.id === targetAsset.id && asset.chainId === targetAsset.chainId && isManualAssetForWallet(asset, activeWalletAddress)),
        );
        writeStoredValue(manualAssetsKey, nextAssets);
        return nextAssets;
      });

      if (targetAsset.contractAddress) {
        const balanceKey = getTokenBalanceKey(targetAsset.chainId, targetAsset.contractAddress);
        setLiveTokenBalances((currentBalances) => {
          if (!currentBalances || currentBalances.chainId !== targetAsset.chainId || currentBalances.address !== activeWalletAddress) {
            return currentBalances;
          }

          const nextBalances = { ...currentBalances.balances };
          delete nextBalances[balanceKey];
          return {
            ...currentBalances,
            balances: nextBalances,
          };
        });
      }

      return true;
    },
    [activeWalletAddress, chainId, manualAssets],
  );

  const validateSend = useCallback(
    (assetId: string, recipient: string, amount: string, gasReserveBnb?: number | null) => {
      const asset = assets.find((item) => item.id === assetId);
      const nativeBalance = nativeAsset?.balance ?? 0;
      return validateTransfer(asset, recipient, amount, nativeBalance, {
        gasReserveBnb,
        senderAddress: activeWallet?.address,
      });
    },
    [activeWallet?.address, assets, nativeAsset?.balance],
  );

  const inspectRecipient = useCallback(
    async (recipient: string, assetId?: string): Promise<RecipientInspectionResult> => {
      const address = toEvmAddress(recipient.trim());

      if (!address) {
        return {
          kind: 'unknown',
          warning: null,
        };
      }

      const asset = assetId ? assets.find((item) => item.id === assetId) : null;

      if (activeWallet?.address && isSameAddress(address, activeWallet.address)) {
        return {
          kind: 'account',
          warning: 'Recipient is your active wallet.',
        };
      }

      if (asset?.type === 'bep20' && asset.contractAddress && isSameAddress(address, asset.contractAddress)) {
        return {
          kind: 'contract',
          warning: `Do not send ${asset.symbol} to its token contract.`,
        };
      }

      const kind = await getAddressKind(address, chainId);

      return {
        kind,
        warning: kind === 'contract' ? 'Recipient is a contract address. Check it before sending.' : null,
      };
    },
    [activeWallet, assets, chainId],
  );

  const estimateSendFee = useCallback(
    async (assetId: string, recipient: string, amount: string): Promise<FeeEstimateResult> => {
      if (!activeWallet) {
        return {
          error: 'Wallet is not ready.',
          fee: null,
        };
      }

      const asset = assets.find((item) => item.id === assetId);
      const parsedAmount = Number(amount);

      if (!asset || !toEvmAddress(recipient) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return {
          error: null,
          fee: null,
        };
      }

      try {
        const fee = await estimateTransferFee({
          amount,
          asset,
          chainId,
          from: activeWallet.address,
          recipient,
        });

        return {
          error: null,
          fee,
        };
      } catch {
        return {
          error: 'Gas estimate unavailable.',
          fee: null,
        };
      }
    },
    [activeWallet, assets, chainId],
  );

  const sendTransfer = useCallback(
    async ({ assetId, recipient, amount }: SendTransferInput) => {
      if (!activeWallet) {
        throw new Error('Wallet is not ready.');
      }

      const asset = assets.find((item) => item.id === assetId);
      const validation = validateSend(assetId, recipient, amount);
      const parsedAmount = Number(amount);

      if (!asset || !validation.isValid) {
        return null;
      }

      let transactionHash: string | null = null;
      let optimisticFee = validation.estimatedGasBnb;

      if (activeWallet.isPrivy) {
        const provider = await walletAdapter.getProvider();
        const from = toEvmAddress(activeWallet.address);
        const to = toEvmAddress(recipient);

        if (!provider || !from || !to) {
          throw new Error('Wallet is not ready.');
        }

        await ensureProviderChain(provider, supportedChains[chainId]);
        optimisticFee = await runPreflightChecks({
          activeWallet,
          amount,
          asset,
          chainId,
          nativeBalance: nativeAsset?.balance ?? 0,
          recipient,
        });

        const transactionParams =
          asset.type === 'native'
            ? {
                chainId: `0x${chainId.toString(16)}`,
                from,
                to,
                value: toNativeValueHex(amount),
              }
            : await getBep20TransactionParams({
                amount,
                asset,
                chainId,
                from,
                recipient,
              });

        const response = await provider.request({
          method: 'eth_sendTransaction',
          params: [transactionParams],
        });

        transactionHash = typeof response === 'string' ? response : null;

        if (!transactionHash) {
          throw new Error('Transaction was not submitted.');
        }

      } else {
        optimisticFee = validation.estimatedGasBnb;
      }

      if (transactionHash) {
        applyPendingDebits({
          activeWallet,
          amount: parsedAmount,
          asset,
          fee: optimisticFee,
          nativeAsset,
          setAssetDebits,
        });
      }

      const chain = supportedChains[chainId];
      const normalizedRecipient = normalizeAddress(recipient);
      const submittedAt = new Date().toISOString();
      const pendingDebits = getPendingDebits({
        amount: parsedAmount,
        asset,
        fee: optimisticFee,
        nativeAsset,
      });
      const activity: WalletActivity = {
        id: `local:${Date.now()}`,
        assetId,
        chainId,
        contractAddress: asset.contractAddress ? normalizeAddress(asset.contractAddress) : undefined,
        counterparty: normalizedRecipient,
        hash: transactionHash ?? makeDemoHash(`${activeWallet.address}:${recipient}:${asset.symbol}:${amount}`),
        title: `${asset.symbol} sent`,
        subtitle: `To ${shortAddress(normalizedRecipient)}`,
        direction: 'out',
        status: transactionHash ? 'pending' : 'success',
        symbol: asset.symbol,
        amount: parsedAmount,
        feeNative: optimisticFee,
        from: normalizeAddress(activeWallet.address),
        lastCheckedAt: transactionHash ? submittedAt : undefined,
        pendingDebits: transactionHash ? pendingDebits : undefined,
        timestamp: submittedAt,
        to: normalizedRecipient,
        explorerUrl: transactionHash ? `${chain.explorerBaseUrl}/tx/${transactionHash}` : `${chain.explorerBaseUrl}/address/${activeWallet.address}`,
      };

      setLocalActivities((currentActivities) => {
        const nextActivities = [activity, ...currentActivities];
        writeStoredValue(localActivitiesKey, nextActivities);
        return nextActivities;
      });
      return activity;
    },
    [activeWallet, assets, chainId, nativeAsset, validateSend, walletAdapter],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      chainId,
      setChainId,
      wallets,
      activeWallet,
      setActiveWalletId,
      assets,
      coreAssets,
      discoveredAssets,
      totalUsd,
      lifeAsset,
      nativeAsset,
      activities,
      isRefreshing,
      refreshError,
      refreshWallet,
      refreshActivityStatus,
      lookupActivityByHash,
      lookupActivityAcrossChains,
      addTokenByContract,
      removeManualToken,
      estimateSendFee,
      inspectRecipient,
      validateSend,
      sendTransfer,
    }),
    [
      activeWallet,
      addTokenByContract,
      activities,
      assets,
      chainId,
      coreAssets,
      discoveredAssets,
      estimateSendFee,
      inspectRecipient,
      isRefreshing,
      lifeAsset,
      lookupActivityByHash,
      lookupActivityAcrossChains,
      nativeAsset,
      refreshError,
      refreshWallet,
      refreshActivityStatus,
      removeManualToken,
      sendTransfer,
      setActiveWalletId,
      setChainId,
      totalUsd,
      validateSend,
      wallets,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

async function getLiveTokenBalances(address: string, chainId: SupportedChainId, assets: AssetBalance[]) {
  const entries = await Promise.all(
    assets
      .filter((asset) => asset.type === 'bep20' && Boolean(asset.contractAddress))
      .map(async (asset) => {
        const balance = await getTokenBalance({
          address,
          chainId,
          contractAddress: asset.contractAddress ?? '',
          decimals: asset.decimals,
        });

        return [getTokenBalanceKey(chainId, asset.contractAddress ?? ''), balance] as const;
      }),
  );

  return entries.reduce<Record<string, number>>((balances, [key, balance]) => {
    if (balance !== null) {
      balances[key] = balance;
    }
    return balances;
  }, {});
}

function getTokenBalanceKey(chainId: SupportedChainId, contractAddress: string) {
  return `${chainId}:${normalizeAddress(contractAddress)}`;
}

function mergeAssets(...assetGroups: AssetBalance[][]) {
  const byId = new Map<string, AssetBalance>();

  assetGroups.flat().forEach((asset) => {
    const key = asset.contractAddress ? getTokenBalanceKey(asset.chainId, asset.contractAddress) : asset.id;
    if (!byId.has(key)) {
      byId.set(key, asset);
    }
  });

  return [...byId.values()];
}

function getLiveAssetPriceUsd(asset: AssetBalance, liveBnbPriceUsd: number | null) {
  if (asset.type === 'native' && asset.chainId === 56 && liveBnbPriceUsd) {
    return liveBnbPriceUsd;
  }

  return asset.priceUsd;
}

function getScopedManualAssets(assets: AssetBalance[], chainId: SupportedChainId, walletAddress: string) {
  return assets.filter(
    (asset) => asset.chainId === chainId && asset.discoveredBy === 'manual' && isManualAssetForWallet(asset, walletAddress),
  );
}

function isManualAssetForWallet(asset: AssetBalance, walletAddress: string) {
  return Boolean(asset.ownerAddress && isSameAddress(asset.ownerAddress, walletAddress));
}

function upsertManualAsset(assets: AssetBalance[], nextAsset: AssetBalance) {
  const nextKey = getManualAssetStorageKey(nextAsset);
  const byKey = new Map<string, AssetBalance>();

  assets.forEach((asset) => {
    byKey.set(getManualAssetStorageKey(asset), asset);
  });
  byKey.set(nextKey, nextAsset);

  return [...byKey.values()];
}

function getManualAssetStorageKey(asset: AssetBalance) {
  const ownerAddress = asset.ownerAddress ? normalizeAddress(asset.ownerAddress) : 'unscoped';
  const assetKey = asset.contractAddress ? getTokenBalanceKey(asset.chainId, asset.contractAddress) : asset.id;
  return `${ownerAddress}:${assetKey}`;
}

function mergeActivities(activities: WalletActivity[]) {
  const byId = new Map<string, WalletActivity>();

  activities.forEach((activity) => {
    const key = `${activity.hash}:${activity.symbol}:${activity.direction}`;
    const current = byId.get(key);
    if (!current || (current.status === 'pending' && activity.status !== 'pending')) {
      byId.set(key, activity);
    }
  });

  return [...byId.values()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function isActivityForWallet(activity: WalletActivity, walletAddress: string) {
  return [activity.from, activity.to, activity.counterparty].some((address) => Boolean(address && isSameAddress(address, walletAddress)));
}

function pickPrimaryTokenTransfer(transfers: TokenTransferSummary[], walletAddress: string | null) {
  if (transfers.length === 0) {
    return null;
  }

  if (!walletAddress) {
    return transfers[0];
  }

  return (
    transfers.find((transfer) => isSameAddress(transfer.from, walletAddress) || isSameAddress(transfer.to, walletAddress)) ??
    transfers[0]
  );
}

function applyPendingDebits({
  activeWallet,
  amount,
  asset,
  fee,
  nativeAsset,
  setAssetDebits,
}: {
  activeWallet: WalletAccount;
  amount: number;
  asset: AssetBalance;
  fee: number;
  nativeAsset: AssetBalance | undefined;
  setAssetDebits: Dispatch<SetStateAction<Record<string, number>>>;
}) {
  const pendingDebits = getPendingDebits({ amount, asset, fee, nativeAsset });

  if (pendingDebits.length === 0) {
    return;
  }

  setAssetDebits((currentDebits) => {
    const nextDebits = { ...currentDebits };

    pendingDebits.forEach((debit) => {
      const debitKey = `${activeWallet.address}:${debit.assetId}`;
      nextDebits[debitKey] = (nextDebits[debitKey] ?? 0) + debit.amount;
    });

    return {
      ...writeAndReturn(assetDebitsKey, nextDebits),
    };
  });
}

function getPendingDebits({
  amount,
  asset,
  fee,
  nativeAsset,
}: {
  amount: number;
  asset: AssetBalance;
  fee: number;
  nativeAsset: AssetBalance | undefined;
}) {
  const feeDebit = Number.isFinite(fee) && fee > 0 ? fee : 0;

  if (asset.type === 'native') {
    return [
      {
        amount: amount + feeDebit,
        assetId: asset.id,
      },
    ];
  }

  return [
    {
      amount,
      assetId: asset.id,
    },
    ...(nativeAsset && feeDebit > 0
      ? [
          {
            amount: feeDebit,
            assetId: nativeAsset.id,
          },
        ]
      : []),
  ];
}

function getPendingMeta(activity: WalletActivity, checkedAt: string) {
  const ageMs = getActivityAgeMs(activity, checkedAt);
  const pendingNotice =
    ageMs >= stalePendingMs
      ? 'Pending for over 1 hour. Check BscScan before sending again.'
      : ageMs >= slowPendingMs
        ? 'Confirmation is taking longer than usual.'
        : undefined;

  return {
    lastCheckedAt: checkedAt,
    pendingNotice,
  };
}

function hasPendingMetaChanged(activity: WalletActivity, nextMeta: ReturnType<typeof getPendingMeta>) {
  return activity.pendingNotice !== nextMeta.pendingNotice || toMinuteBucket(activity.lastCheckedAt) !== toMinuteBucket(nextMeta.lastCheckedAt);
}

function getActivityAgeMs(activity: WalletActivity, checkedAt: string) {
  const activityTime = new Date(activity.timestamp).getTime();
  const checkedTime = new Date(checkedAt).getTime();

  if (!Number.isFinite(activityTime) || !Number.isFinite(checkedTime)) {
    return 0;
  }

  return Math.max(checkedTime - activityTime, 0);
}

function toMinuteBucket(value?: string) {
  if (!value) {
    return '';
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return '';
  }

  return String(Math.floor(timestamp / 60000));
}

async function runPreflightChecks({
  activeWallet,
  amount,
  asset,
  chainId,
  nativeBalance,
  recipient,
}: {
  activeWallet: WalletAccount;
  amount: string;
  asset: AssetBalance;
  chainId: SupportedChainId;
  nativeBalance: number;
  recipient: string;
}) {
  const freshNativeBalance = (await getNativeBalance(activeWallet.address, chainId)) ?? nativeBalance;
  const estimatedFee = getGasReserveBnb(
    (await estimateTransferFee({
      amount,
      asset,
      chainId,
      from: activeWallet.address,
      recipient,
    }).catch(() => null)) ?? (asset.type === 'native' ? nativeTransferGasFallbackBnb : bep20TransferGasFallbackBnb),
  );

  if (asset.type === 'native' && isAmountWithGasGreaterThanBalance(amount, estimatedFee, freshNativeBalance)) {
    throw new Error(`Leave enough ${supportedChains[chainId].nativeCurrency.symbol} for gas.`);
  }

  if (asset.type === 'bep20') {
    if (!asset.contractAddress) {
      throw new Error('Token contract is missing.');
    }

    if (isAmountGreaterThanBalance(String(estimatedFee), freshNativeBalance, 18)) {
      throw new Error(`Insufficient ${supportedChains[chainId].nativeCurrency.symbol} for gas.`);
    }

    const tokenBalance = await getTokenBalance({
      address: activeWallet.address,
      chainId,
      contractAddress: asset.contractAddress,
      decimals: asset.decimals,
    });

    if (tokenBalance !== null && isAmountGreaterThanBalance(amount, tokenBalance, asset.decimals)) {
      throw new Error(`Insufficient ${asset.symbol} balance.`);
    }

    const simulation = await simulateBep20Transfer({
      amount,
      asset,
      chainId,
      from: activeWallet.address,
      recipient,
    });

    if (!simulation.ok) {
      throw new Error(simulation.error ?? `${asset.symbol} transfer would fail.`);
    }
  }

  return estimatedFee;
}

async function ensureProviderChain(provider: Eip1193Provider, chain: ChainConfig) {
  const expectedChainId = `0x${chain.id.toString(16)}`;
  const currentChainId = await provider.request({ method: 'eth_chainId' }).catch(() => null);

  if (typeof currentChainId === 'string' && currentChainId.toLowerCase() === expectedChainId.toLowerCase()) {
    return;
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: expectedChainId }],
    });
  } catch {
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            blockExplorerUrls: [chain.explorerBaseUrl],
            chainId: expectedChainId,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: [chain.rpcUrl],
          },
        ],
      });
    } catch {
      throw new Error(`Switch wallet to ${chain.shortName}.`);
    }
  }
}

async function getBep20TransactionParams({
  amount,
  asset,
  chainId,
  from,
  recipient,
}: {
  amount: string;
  asset: AssetBalance;
  chainId: SupportedChainId;
  from: string;
  recipient: string;
}) {
  const token = asset.contractAddress ? toEvmAddress(asset.contractAddress) : null;
  const data = await encodeBep20Transfer(recipient, amount, asset.decimals);

  if (!token || !data) {
    throw new Error('Token transfer is not ready.');
  }

  return {
    chainId: `0x${chainId.toString(16)}`,
    data,
    from,
    to: token,
    value: '0x0',
  };
}

function readStoredValue<T>(key: string): T | null {
  return readStorageValue<T>(key);
}

function readStoredChainId() {
  const storedChainId = readStoredValue<SupportedChainId>(chainIdKey);
  return storedChainId && supportedChains[storedChainId] ? storedChainId : defaultChain.id;
}

function writeStoredValue<T>(key: string, value: T) {
  writeStorageValue(key, value);
}

function writeAndReturn<T>(key: string, value: T) {
  writeStoredValue(key, value);
  return value;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }

  return context;
}
