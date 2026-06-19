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
import { AppState, Platform } from 'react-native';

import { getDemoActivities } from '@/features/activity/services/demo-activity';
import type { WalletActivity } from '@/features/activity/types';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { getDemoAssets } from '@/features/tokens/services/demo-tokens';
import type { AssetBalance } from '@/features/tokens/types';
import { validateTransfer } from '@/features/transfer/services/transfer-validation';
import {
  getGasReserveBnb,
  nativeTransferGasFallbackBnb,
  splTransferGasFallbackSol,
  type TransferValidation,
} from '@/features/transfer/types';
import { useWalletAdapter } from '@/features/wallet/services/wallet-adapter';
import type { WalletAccount } from '@/features/wallet/types';
import {
  buildSolTransferTransaction,
  estimateTransferFee,
  getAddressKind,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  getNativeBalance,
  getSplTokenBalance,
  getSplTokenMetadata,
  getTransactionStatus,
  type SolanaAccountKind,
} from '@/shared/api/solana-client';
import { fetchSolUsdPrice } from '@/shared/api/price-feed';
import { defaultChain, supportedChains, type SupportedChainId } from '@/shared/config/chains';
import { getKnownTokenByMint } from '@/shared/config/token-registry';
import { colors } from '@/shared/theme/tokens';
import {
  isAddress,
  isSameAddress,
  makeDemoAddress,
  makeDemoHash,
  normalizeAddress,
  toSolanaSignature,
} from '@/shared/utils/address';
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
  kind: SolanaAccountKind;
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
  isWalletInitializing: boolean;
  walletSetupError: string | null;
  retryWalletSetup: () => Promise<string | null>;
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
    address: address ?? makeDemoAddress(`${userId}:solana:generated`),
    chainId,
    createdAt: new Date().toISOString(),
    id: `generated:${userId}:solana`,
    isPrivy,
    label: 'Main Wallet',
    source: 'privy-generated',
  };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const walletAdapter = useWalletAdapter();
  const lastForegroundRefreshRef = useRef(0);
  const walletSetupInFlightRef = useRef(false);
  const [chainId, setChainIdState] = useState<SupportedChainId>(() => readStoredChainId());
  const [activeWalletId, setActiveWalletIdState] = useState<string>(() => readStoredValue(activeWalletKey) ?? '');
  const [assetDebits, setAssetDebits] = useState<Record<string, number>>(() => readStoredValue(assetDebitsKey) ?? {});
  const [localActivities, setLocalActivities] = useState<WalletActivity[]>(() => readStoredValue(localActivitiesKey) ?? []);
  const [manualAssets, setManualAssets] = useState<AssetBalance[]>(() => readStoredValue(manualAssetsKey) ?? []);
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
  const [liveSolPriceUsd, setLiveSolPriceUsd] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isWalletInitializing, setIsWalletInitializing] = useState(false);
  const [walletSetupError, setWalletSetupError] = useState<string | null>(null);
  const liveSyncEnabled = Platform.OS === 'web' || walletAdapter.isReady;

  useEffect(() => {
    if (!liveSyncEnabled) {
      return undefined;
    }

    let cancelled = false;

    fetchSolUsdPrice().then((price) => {
      if (!cancelled && price !== null) {
        setLiveSolPriceUsd(price);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [liveSyncEnabled]);

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
  const activeWallet = useMemo(() => wallets.find((wallet) => wallet.id === activeWalletId) ?? wallets[0] ?? null, [activeWalletId, wallets]);
  const activeWalletAddress = activeWallet?.address ?? null;

  const setActiveWalletId = useCallback((walletId: string) => {
    writeStoredValue(activeWalletKey, walletId);
    setActiveWalletIdState(walletId);
  }, []);

  const setChainId = useCallback((nextChainId: SupportedChainId) => {
    writeStoredValue(chainIdKey, nextChainId);
    setChainIdState(nextChainId);
  }, []);

  const retryWalletSetup = useCallback(async () => {
    if (!user?.isPrivy) {
      return null;
    }

    if (walletAdapter.address) {
      setWalletSetupError(null);
      return walletAdapter.address;
    }

    if (!walletAdapter.isReady || walletSetupInFlightRef.current) {
      return null;
    }

    walletSetupInFlightRef.current = true;
    setIsWalletInitializing(true);
    setWalletSetupError(null);

    try {
      const nextAddress = await walletAdapter.createWallet();

      if (!nextAddress) {
        throw new Error('Wallet recovery is still pending.');
      }

      return nextAddress;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start wallet.';
      setWalletSetupError(message);
      return null;
    } finally {
      walletSetupInFlightRef.current = false;
      setIsWalletInitializing(false);
    }
  }, [user?.isPrivy, walletAdapter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      retryWalletSetup().catch(() => undefined);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [retryWalletSetup]);

  const refreshWallet = useCallback(async () => {
    if (!activeWallet?.isPrivy || !isAddress(activeWallet.address)) {
      setLiveNativeBalance(null);
      setLiveTokenBalances(null);
      setRefreshError(null);
      return;
    }

    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const baseAssets = getDemoAssets(chainId);
      const chainManualAssets = getScopedManualAssets(manualAssets, chainId, activeWallet.address);
      const splAssets = [...baseAssets, ...chainManualAssets].filter((asset) => asset.type === 'spl' && asset.contractAddress);
      const [nativeBalance, tokenBalances, solPriceUsd] = await Promise.all([
        getNativeBalance(activeWallet.address, chainId),
        getLiveTokenBalances(activeWallet.address, chainId, splAssets),
        fetchSolUsdPrice(),
      ]);

      if (nativeBalance !== null) {
        setLiveNativeBalance({
          address: activeWallet.address,
          balance: nativeBalance,
          chainId,
        });
      }

      setLiveTokenBalances({
        address: activeWallet.address,
        balances: tokenBalances,
        chainId,
      });

      if (solPriceUsd !== null) {
        setLiveSolPriceUsd(solPriceUsd);
      }
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'Solana sync delayed.');
    } finally {
      setIsRefreshing(false);
    }
  }, [activeWallet, chainId, manualAssets]);

  useEffect(() => {
    if (!liveSyncEnabled) {
      return undefined;
    }

    const timer = setTimeout(() => {
      refreshWallet();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [liveSyncEnabled, refreshWallet]);

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

      const checkedAt = new Date().toISOString();
      const statusEntries = await Promise.all(
        pendingActivities.map(async (activity) => ({
          hash: activity.hash,
          status: await getTransactionStatus(activity.hash, activity.chainId),
        })),
      );

      setLocalActivities((currentActivities) => {
        let changed = false;
        const settledDebits: { amount: number; key: string }[] = [];
        const nextActivities = currentActivities.map((activity) => {
          const entry = statusEntries.find((item) => item.hash === activity.hash);
          const pendingMeta = getPendingMeta(activity, checkedAt);

          if (!entry?.status) {
            if (!hasPendingMetaChanged(activity, pendingMeta)) {
              return activity;
            }

            changed = true;
            return {
              ...activity,
              ...pendingMeta,
            };
          }

          if (entry.status.status === 'pending') {
            if (!hasPendingMetaChanged(activity, pendingMeta)) {
              return activity;
            }

            changed = true;
            return {
              ...activity,
              confirmations: entry.status.confirmations,
              ...pendingMeta,
            };
          }

          if (entry.status.status === activity.status) {
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
            confirmations: entry.status.confirmations,
            lastCheckedAt: checkedAt,
            pendingDebits: undefined,
            pendingNotice: undefined,
            status: entry.status.status,
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
    if (!liveSyncEnabled) {
      return undefined;
    }

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
  }, [activeWalletAddress, chainId, liveSyncEnabled, localActivities, refreshActivityStatus]);

  useEffect(() => {
    if (!liveSyncEnabled) {
      return undefined;
    }

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

    if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('focus', handleWindowFocus);
    }

    return () => {
      appStateSubscription.remove();

      if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('focus', handleWindowFocus);
      }
    };
  }, [activeWallet?.isPrivy, activeWalletAddress, liveSyncEnabled, refreshActivityStatus, refreshWallet]);

  const assets = useMemo(() => {
    const walletKey = activeWalletAddress ?? 'no-wallet';
    const baseAssets = getDemoAssets(chainId);
    const chainManualAssets = activeWalletAddress ? getScopedManualAssets(manualAssets, chainId, activeWalletAddress) : [];
    const mergedAssets = mergeAssets(baseAssets, chainManualAssets);
    const shouldUseLiveBalance = Boolean(user?.isPrivy);

    return mergedAssets.map((asset) => {
      const liveBalance =
        asset.type === 'native' &&
        Boolean(liveNativeBalance) &&
        liveNativeBalance?.address === activeWalletAddress &&
        liveNativeBalance?.chainId === chainId
          ? liveNativeBalance.balance
          : null;
      const liveTokenBalance =
        asset.type === 'spl' &&
        asset.contractAddress &&
        activeWalletAddress &&
        liveTokenBalances?.address === activeWalletAddress &&
        liveTokenBalances.chainId === chainId
          ? liveTokenBalances.balances[getTokenBalanceKey(chainId, asset.contractAddress)] ?? null
          : null;
      const debit = assetDebits[`${walletKey}:${asset.id}`] ?? 0;
      const fallbackBalance = shouldUseLiveBalance ? 0 : asset.balance;

      return {
        ...asset,
        balance: Math.max((liveBalance ?? liveTokenBalance ?? fallbackBalance) - debit, 0),
        priceUsd: getLiveAssetPriceUsd(asset, liveSolPriceUsd),
      };
    });
  }, [activeWalletAddress, assetDebits, chainId, liveNativeBalance, liveSolPriceUsd, liveTokenBalances, manualAssets, user?.isPrivy]);

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
    const demoActivities = user?.isPrivy ? [] : getDemoActivities(activeWallet.address, chainId);
    return mergeActivities([...chainLocalActivities, ...demoActivities]);
  }, [activeWallet, chainId, localActivities, user?.isPrivy]);

  const buildLookupActivity = useCallback(
    async (hash: string, targetChainId: SupportedChainId): Promise<WalletActivity | null> => {
      const signature = toSolanaSignature(hash);

      if (!signature) {
        return null;
      }

      const existingActivity = localActivities.find((activity) => activity.hash === signature && activity.chainId === targetChainId);

      if (existingActivity) {
        return existingActivity;
      }

      const status = await getTransactionStatus(signature, targetChainId);

      if (!status) {
        return null;
      }

      const chain = supportedChains[targetChainId];
      const timestamp = new Date().toISOString();

      return {
        amount: 0,
        chainId: targetChainId,
        direction: 'out',
        explorerUrl: getExplorerTxUrl(signature, targetChainId),
        hash: signature,
        id: `${targetChainId}:${signature}:lookup`,
        status: status.status,
        subtitle: chain.shortName,
        symbol: chain.nativeCurrency.symbol,
        timestamp,
        title: 'Solana transaction',
      };
    },
    [localActivities],
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

      const mint = normalizeAddress(contractAddress.trim());

      if (!isAddress(mint)) {
        return {
          asset: null,
          error: 'Enter a valid token address.',
        };
      }

      const key = getTokenBalanceKey(chainId, mint);
      const existingAsset = assets.find((asset) => asset.contractAddress && getTokenBalanceKey(chainId, asset.contractAddress) === key);
      const knownToken = getKnownTokenByMint(chainId, mint);

      if (existingAsset) {
        if (knownToken && (existingAsset.symbol !== knownToken.symbol || existingAsset.name !== knownToken.name)) {
          const nextAsset = {
            ...existingAsset,
            accent: knownToken.accent,
            name: knownToken.name,
            symbol: knownToken.symbol,
          };

          if (existingAsset.discoveredBy === 'manual') {
            setManualAssets((currentAssets) => {
              const nextAssets = upsertManualAsset(currentAssets, nextAsset);
              writeStoredValue(manualAssetsKey, nextAssets);
              return nextAssets;
            });
          }

          return {
            asset: nextAsset,
            error: null,
          };
        }

        return {
          asset: existingAsset,
          error: null,
        };
      }

      const metadata = await getSplTokenMetadata(mint, chainId);

      if (!metadata) {
        return {
          asset: null,
          error: `Token address was not found on ${supportedChains[chainId].shortName}.`,
        };
      }

      const balance =
        (await getSplTokenBalance({
          address: activeWallet.address,
          chainId,
          mint,
        })) ?? 0;

      const asset: AssetBalance = {
        accent: metadata.accent ?? colors.cyan,
        balance,
        chainId,
        change24h: 0,
        contractAddress: mint,
        decimals: metadata.decimals,
        discoveredBy: 'manual',
        id: key,
        iconUrl: metadata.iconUrl,
        name: metadata.name,
        ownerAddress: normalizeAddress(activeWallet.address),
        priceUsd: 0,
        symbol: metadata.symbol,
        type: 'spl',
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
      const address = normalizeAddress(recipient.trim());

      if (!isAddress(address)) {
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

      if (asset?.type === 'spl' && asset.contractAddress && isSameAddress(address, asset.contractAddress)) {
        return {
          kind: 'account',
          warning: `Do not send ${asset.symbol} to its token address.`,
        };
      }

      const kind = await getAddressKind(address, chainId);

      return {
        kind,
        warning: kind === 'program' ? 'Recipient is a program account. Check it before sending.' : null,
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

      if (!asset || !isAddress(recipient) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return {
          error: null,
          fee: null,
        };
      }

      try {
        const fee = asset.type === 'native' ? await estimateTransferFee(chainId) : splTransferGasFallbackSol;

        return {
          error: null,
          fee,
        };
      } catch {
        return {
          error: 'Network fee unavailable.',
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
        if (asset.type !== 'native') {
          throw new Error('SPL transfers are not connected yet.');
        }

        optimisticFee = getGasReserveBnb((await estimateTransferFee(chainId).catch(() => null)) ?? nativeTransferGasFallbackBnb);
        await runPreflightChecks({
          activeWallet,
          amount,
          asset,
          chainId,
          nativeBalance: nativeAsset?.balance ?? 0,
          recipient,
        });

        const transaction = await buildSolTransferTransaction({
          amount,
          chainId,
          from: activeWallet.address,
          recipient,
        });
        transactionHash = await walletAdapter.signAndSendTransaction(transaction, supportedChains[chainId]);

        if (!transactionHash) {
          throw new Error('Transaction was not submitted.');
        }
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

      const normalizedRecipient = normalizeAddress(recipient);
      const submittedAt = new Date().toISOString();
      const pendingDebits = getPendingDebits({
        amount: parsedAmount,
        asset,
        fee: optimisticFee,
        nativeAsset,
      });
      const activity: WalletActivity = {
        amount: parsedAmount,
        assetId,
        chainId,
        contractAddress: asset.contractAddress ? normalizeAddress(asset.contractAddress) : undefined,
        counterparty: normalizedRecipient,
        direction: 'out',
        explorerUrl: transactionHash ? getExplorerTxUrl(transactionHash, chainId) : getExplorerAddressUrl(activeWallet.address, chainId),
        feeNative: optimisticFee,
        from: normalizeAddress(activeWallet.address),
        hash: transactionHash ?? makeDemoHash(`${activeWallet.address}:${recipient}:${asset.symbol}:${amount}`),
        id: `local:${Date.now()}`,
        lastCheckedAt: transactionHash ? submittedAt : undefined,
        pendingDebits: transactionHash ? pendingDebits : undefined,
        status: transactionHash ? 'pending' : 'success',
        subtitle: `To ${shortAddress(normalizedRecipient)}`,
        symbol: asset.symbol,
        timestamp: submittedAt,
        title: `${asset.symbol} sent`,
        to: normalizedRecipient,
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
      activeWallet,
      activities,
      addTokenByContract,
      assets,
      chainId,
      coreAssets,
      discoveredAssets,
      estimateSendFee,
      inspectRecipient,
      isWalletInitializing,
      isRefreshing,
      lifeAsset,
      lookupActivityAcrossChains,
      lookupActivityByHash,
      nativeAsset,
      refreshActivityStatus,
      refreshError,
      refreshWallet,
      removeManualToken,
      retryWalletSetup,
      sendTransfer,
      setActiveWalletId,
      setChainId,
      totalUsd,
      validateSend,
      walletSetupError,
      wallets,
    }),
    [
      activeWallet,
      activities,
      addTokenByContract,
      assets,
      chainId,
      coreAssets,
      discoveredAssets,
      estimateSendFee,
      inspectRecipient,
      isWalletInitializing,
      isRefreshing,
      lifeAsset,
      lookupActivityAcrossChains,
      lookupActivityByHash,
      nativeAsset,
      refreshActivityStatus,
      refreshError,
      refreshWallet,
      removeManualToken,
      retryWalletSetup,
      sendTransfer,
      setActiveWalletId,
      setChainId,
      totalUsd,
      validateSend,
      walletSetupError,
      wallets,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

async function getLiveTokenBalances(address: string, chainId: SupportedChainId, assets: AssetBalance[]) {
  const entries = await Promise.all(
    assets
      .filter((asset) => asset.type === 'spl' && Boolean(asset.contractAddress))
      .map(async (asset) => {
        const mint = asset.contractAddress ?? '';
        const balance = await getSplTokenBalance({
          address,
          chainId,
          mint,
        });

        return [getTokenBalanceKey(chainId, mint), balance] as const;
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

  assetGroups.forEach((assets) => {
    assets.forEach((asset) => {
      const key = asset.contractAddress ? getTokenBalanceKey(asset.chainId, asset.contractAddress) : asset.id;
      if (!byId.has(key)) {
        byId.set(key, asset);
      }
    });
  });

  return [...byId.values()];
}

function getLiveAssetPriceUsd(asset: AssetBalance, liveSolPriceUsd: number | null) {
  if (asset.type === 'native' && liveSolPriceUsd) {
    return liveSolPriceUsd;
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

    return writeAndReturn(assetDebitsKey, nextDebits);
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
      ? 'Pending for over 1 hour. Check Solana Explorer before sending again.'
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
}: {
  activeWallet: WalletAccount;
  amount: string;
  asset: AssetBalance;
  chainId: SupportedChainId;
  nativeBalance: number;
  recipient: string;
}) {
  const freshNativeBalance = (await getNativeBalance(activeWallet.address, chainId)) ?? nativeBalance;
  const estimatedFee = getGasReserveBnb((await estimateTransferFee(chainId).catch(() => null)) ?? nativeTransferGasFallbackBnb);

  if (asset.type === 'native' && Number(amount) + estimatedFee > freshNativeBalance) {
    throw new Error(`Leave enough ${supportedChains[chainId].nativeCurrency.symbol} for network fee.`);
  }

  return estimatedFee;
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
