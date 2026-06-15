import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { getDemoActivities } from '@/features/activity/services/demo-activity';
import type { WalletActivity } from '@/features/activity/types';
import { getDemoAssets } from '@/features/tokens/services/demo-tokens';
import type { AssetBalance } from '@/features/tokens/types';
import { validateTransfer } from '@/features/transfer/services/transfer-validation';
import type { TransferValidation } from '@/features/transfer/types';
import { useWalletAdapter } from '@/features/wallet/services/wallet-adapter';
import type { WalletAccount } from '@/features/wallet/types';
import { getNativeBalance, toEvmAddress, toNativeValueHex } from '@/shared/api/evm-client';
import { defaultChain, supportedChains, type SupportedChainId } from '@/shared/config/chains';
import { makeDemoAddress, makeDemoHash, normalizeAddress } from '@/shared/utils/address';
import { shortAddress } from '@/shared/utils/format';
import { readStorageValue, writeStorageValue } from '@/shared/utils/storage';

type SendTransferInput = {
  assetId: string;
  recipient: string;
  amount: string;
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
  validateSend: (assetId: string, recipient: string, amount: string) => TransferValidation;
  sendTransfer: (input: SendTransferInput) => Promise<WalletActivity | null>;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const activeWalletKey = 'life-wallet-active-wallet';
const assetDebitsKey = 'life-wallet-asset-debits';
const localActivitiesKey = 'life-wallet-local-activities';

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
}): WalletAccount {
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
  const [chainId, setChainId] = useState<SupportedChainId>(defaultChain.id);
  const [activeWalletId, setActiveWalletIdState] = useState<string>(
    () => readStoredValue(activeWalletKey) ?? '',
  );
  const [assetDebits, setAssetDebits] = useState<Record<string, number>>(
    () => readStoredValue(assetDebitsKey) ?? {},
  );
  const [localActivities, setLocalActivities] = useState<WalletActivity[]>(
    () => readStoredValue(localActivitiesKey) ?? [],
  );
  const [liveNativeBalance, setLiveNativeBalance] = useState<{
    address: string;
    balance: number;
    chainId: SupportedChainId;
  } | null>(null);

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

  const setActiveWalletId = useCallback((walletId: string) => {
    writeStoredValue(activeWalletKey, walletId);
    setActiveWalletIdState(walletId);
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

  const assets = useMemo(() => {
    const walletKey = activeWallet?.address ?? 'no-wallet';
    return getDemoAssets(chainId).map((asset) => {
      const liveBalance =
        asset.type === 'native' &&
        Boolean(liveNativeBalance) &&
        liveNativeBalance?.address === activeWallet?.address &&
        liveNativeBalance?.chainId === chainId
          ? liveNativeBalance.balance
          : null;
      const debitKey = `${walletKey}:${asset.id}`;
      const debit = assetDebits[debitKey] ?? 0;
      return {
        ...asset,
        balance: Math.max((liveBalance ?? asset.balance) - debit, 0),
      };
    });
  }, [activeWallet?.address, assetDebits, chainId, liveNativeBalance]);

  const nativeAsset = assets.find((asset) => asset.type === 'native');
  const lifeAsset = assets.find((asset) => asset.symbol === 'LIFE');
  const coreAssets = assets.filter((asset) => asset.discoveredBy === 'core');
  const discoveredAssets = assets.filter((asset) => asset.discoveredBy !== 'core');
  const totalUsd = assets.reduce((sum, asset) => sum + asset.balance * asset.priceUsd, 0);
  const activities = useMemo(() => {
    if (!activeWallet) {
      return [];
    }

    const chainLocalActivities = localActivities.filter((activity) => activity.chainId === chainId);
    return [...chainLocalActivities, ...getDemoActivities(activeWallet.address, chainId)];
  }, [activeWallet, chainId, localActivities]);

  const validateSend = useCallback(
    (assetId: string, recipient: string, amount: string) => {
      const asset = assets.find((item) => item.id === assetId);
      const nativeBalance = nativeAsset?.balance ?? 0;
      return validateTransfer(asset, recipient, amount, nativeBalance);
    },
    [assets, nativeAsset?.balance],
  );

  const sendTransfer = useCallback(
    async ({ assetId, recipient, amount }: SendTransferInput) => {
      if (!activeWallet) {
        return null;
      }

      const asset = assets.find((item) => item.id === assetId);
      const validation = validateSend(assetId, recipient, amount);
      const parsedAmount = Number(amount);

      if (!asset || !validation.isValid) {
        return null;
      }

      let transactionHash: string | null = null;

      if (activeWallet.isPrivy && asset.type === 'native') {
        const provider = await walletAdapter.getProvider();
        const from = toEvmAddress(activeWallet.address);
        const to = toEvmAddress(recipient);

        if (!provider || !from || !to) {
          return null;
        }

        const response = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from,
              to,
              value: toNativeValueHex(amount),
            },
          ],
        });

        transactionHash = typeof response === 'string' ? response : null;
      } else {
        const debitKey = `${activeWallet.address}:${assetId}`;
        setAssetDebits((currentDebits) => ({
          ...writeAndReturn(assetDebitsKey, {
            ...currentDebits,
            [debitKey]: (currentDebits[debitKey] ?? 0) + parsedAmount,
          }),
        }));
      }

      const chain = supportedChains[chainId];
      const activity: WalletActivity = {
        id: `local:${Date.now()}`,
        chainId,
        hash: transactionHash ?? makeDemoHash(`${activeWallet.address}:${recipient}:${asset.symbol}:${amount}`),
        title: `${asset.symbol} sent`,
        subtitle: `To ${shortAddress(normalizeAddress(recipient))}`,
        direction: 'out',
        status: 'success',
        symbol: asset.symbol,
        amount: parsedAmount,
        timestamp: new Date().toISOString(),
        explorerUrl: `${chain.explorerBaseUrl}/address/${activeWallet.address}`,
      };

      setLocalActivities((currentActivities) => {
        const nextActivities = [activity, ...currentActivities];
        writeStoredValue(localActivitiesKey, nextActivities);
        return nextActivities;
      });
      return activity;
    },
    [activeWallet, assets, chainId, validateSend, walletAdapter],
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
      validateSend,
      sendTransfer,
    }),
    [
      activeWallet,
      activities,
      assets,
      chainId,
      coreAssets,
      discoveredAssets,
      lifeAsset,
      nativeAsset,
      sendTransfer,
      setActiveWalletId,
      totalUsd,
      validateSend,
      wallets,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

function readStoredValue<T>(key: string): T | null {
  return readStorageValue<T>(key);
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
