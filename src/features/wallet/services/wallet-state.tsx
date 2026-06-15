import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
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
import { classifyWalletSecret } from '@/features/security/services/import-secret';
import type { WalletAccount, WalletImportPreview } from '@/features/wallet/types';
import { defaultChain, supportedChains, type SupportedChainId } from '@/shared/config/chains';
import { makeDemoAddress, makeDemoHash, normalizeAddress } from '@/shared/utils/address';
import { shortAddress } from '@/shared/utils/format';

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
  previewWalletImport: (secret: string) => WalletImportPreview | null;
  importWallet: (secret: string, label?: string) => WalletAccount | null;
  assets: AssetBalance[];
  coreAssets: AssetBalance[];
  discoveredAssets: AssetBalance[];
  totalUsd: number;
  lifeAsset: AssetBalance | undefined;
  nativeAsset: AssetBalance | undefined;
  activities: WalletActivity[];
  validateSend: (assetId: string, recipient: string, amount: string) => TransferValidation;
  sendTransfer: (input: SendTransferInput) => WalletActivity | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const importedWalletsKey = 'life-wallet-imported-wallets';
const activeWalletKey = 'life-wallet-active-wallet';
const assetDebitsKey = 'life-wallet-asset-debits';
const localActivitiesKey = 'life-wallet-local-activities';

function createGeneratedWallet(userId: string, chainId: SupportedChainId): WalletAccount {
  return {
    id: `generated:${userId}:${chainId}`,
    source: 'privy-generated',
    address: makeDemoAddress(`${userId}:${chainId}:generated`),
    label: 'Google Wallet',
    chainId,
    createdAt: new Date().toISOString(),
  };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const [chainId, setChainId] = useState<SupportedChainId>(defaultChain.id);
  const [importedWallets, setImportedWallets] = useState<WalletAccount[]>(
    () => readStoredValue(importedWalletsKey) ?? [],
  );
  const [activeWalletId, setActiveWalletIdState] = useState<string>(
    () => readStoredValue(activeWalletKey) ?? '',
  );
  const [assetDebits, setAssetDebits] = useState<Record<string, number>>(
    () => readStoredValue(assetDebitsKey) ?? {},
  );
  const [localActivities, setLocalActivities] = useState<WalletActivity[]>(
    () => readStoredValue(localActivitiesKey) ?? [],
  );

  const generatedWallet = useMemo(() => {
    if (!user) {
      return null;
    }

    return createGeneratedWallet(user.id, chainId);
  }, [chainId, user]);

  const wallets = useMemo(() => {
    const walletsForChain = importedWallets.filter((wallet) => wallet.chainId === chainId);
    return generatedWallet ? [generatedWallet, ...walletsForChain] : walletsForChain;
  }, [chainId, generatedWallet, importedWallets]);

  const activeWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === activeWalletId) ?? wallets[0] ?? null,
    [activeWalletId, wallets],
  );

  const previewWalletImport = useCallback((secret: string) => classifyWalletSecret(secret), []);

  const setActiveWalletId = useCallback((walletId: string) => {
    writeStoredValue(activeWalletKey, walletId);
    setActiveWalletIdState(walletId);
  }, []);

  const importWallet = useCallback(
    (secret: string, label?: string) => {
      const preview = classifyWalletSecret(secret);
      if (!preview || !user) {
        return null;
      }

      const importedWallet: WalletAccount = {
        id: `imported:${preview.address}:${Date.now()}`,
        source: 'privy-imported',
        address: preview.address,
        label: label?.trim() || `${preview.kind === 'private-key' ? 'Private Key' : 'Seed'} Wallet`,
        chainId,
        createdAt: new Date().toISOString(),
      };

      setImportedWallets((currentWallets) => {
        const nextWallets = [importedWallet, ...currentWallets];
        writeStoredValue(importedWalletsKey, nextWallets);
        return nextWallets;
      });
      setActiveWalletId(importedWallet.id);
      return importedWallet;
    },
    [chainId, setActiveWalletId, user],
  );

  const assets = useMemo(() => {
    const walletKey = activeWallet?.address ?? 'no-wallet';
    return getDemoAssets(chainId).map((asset) => {
      const debitKey = `${walletKey}:${asset.id}`;
      const debit = assetDebits[debitKey] ?? 0;
      return {
        ...asset,
        balance: Math.max(asset.balance - debit, 0),
      };
    });
  }, [activeWallet?.address, assetDebits, chainId]);

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
    ({ assetId, recipient, amount }: SendTransferInput) => {
      if (!activeWallet) {
        return null;
      }

      const asset = assets.find((item) => item.id === assetId);
      const validation = validateSend(assetId, recipient, amount);
      const parsedAmount = Number(amount);

      if (!asset || !validation.isValid) {
        return null;
      }

      const debitKey = `${activeWallet.address}:${assetId}`;
      setAssetDebits((currentDebits) => ({
        ...writeAndReturn(assetDebitsKey, {
          ...currentDebits,
          [debitKey]: (currentDebits[debitKey] ?? 0) + parsedAmount,
        }),
      }));

      const chain = supportedChains[chainId];
      const activity: WalletActivity = {
        id: `local:${Date.now()}`,
        chainId,
        hash: makeDemoHash(`${activeWallet.address}:${recipient}:${asset.symbol}:${amount}`),
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
    [activeWallet, assets, chainId, validateSend],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      chainId,
      setChainId,
      wallets,
      activeWallet,
      setActiveWalletId,
      previewWalletImport,
      importWallet,
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
      importWallet,
      lifeAsset,
      nativeAsset,
      previewWalletImport,
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
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedValue = window.localStorage.getItem(key);
    return savedValue ? (JSON.parse(savedValue) as T) : null;
  } catch {
    return null;
  }
}

function writeStoredValue<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
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
