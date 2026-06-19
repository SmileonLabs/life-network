import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { AuthAdapter } from '@/features/auth/services/auth-adapter.types';
import type { AuthUser } from '@/features/auth/types';
import type { WalletAdapter } from '@/features/wallet/services/wallet-adapter.types';
import { readStorageValue, removeStorageValue, writeStorageValue } from '@/shared/utils/storage';

const demoSessionKey = 'life-wallet-demo-user';

const demoUser: AuthUser = {
  id: 'google:demo-life-user',
  name: 'LIFE Member',
  email: 'member@life.global',
  avatarInitials: 'LM',
  method: 'google',
  isPrivy: false,
};

const AuthAdapterContext = createContext<AuthAdapter | null>(null);
const WalletAdapterContext = createContext<WalletAdapter | null>(null);

export function PrivyWebBridge({
  authAdapter,
  children,
  walletAdapter,
}: {
  authAdapter: AuthAdapter;
  children: ReactNode;
  walletAdapter: WalletAdapter;
}) {
  return (
    <AuthAdapterContext.Provider value={authAdapter}>
      <WalletAdapterContext.Provider value={walletAdapter}>{children}</WalletAdapterContext.Provider>
    </AuthAdapterContext.Provider>
  );
}

export function PrivyWebMockBridge({ children }: { children: ReactNode }) {
  const authAdapter = useMockAuthAdapter();
  const walletAdapter = useMockWalletAdapter();

  return (
    <PrivyWebBridge authAdapter={authAdapter} walletAdapter={walletAdapter}>
      {children}
    </PrivyWebBridge>
  );
}

export function usePrivyWebAuthAdapter() {
  const adapter = useContext(AuthAdapterContext);

  if (!adapter) {
    throw new Error('usePrivyWebAuthAdapter must be used within PrivyProvider');
  }

  return adapter;
}

export function usePrivyWebWalletAdapter() {
  const adapter = useContext(WalletAdapterContext);

  if (!adapter) {
    throw new Error('usePrivyWebWalletAdapter must be used within PrivyProvider');
  }

  return adapter;
}

function useMockAuthAdapter(): AuthAdapter {
  const [user, setUser] = useState<AuthUser | null>(() => readDemoUser());

  const signInWithGoogle = useCallback(async () => {
    writeStorageValue(demoSessionKey, demoUser);
    setUser(demoUser);
  }, []);

  const signOut = useCallback(async () => {
    removeStorageValue(demoSessionKey);
    setUser(null);
  }, []);

  return useMemo(
    () => ({
      error: null,
      isAuthenticated: Boolean(user),
      isDemoMode: true,
      isReady: true,
      signInWithGoogle,
      signOut,
      user,
    }),
    [signInWithGoogle, signOut, user],
  );
}

function useMockWalletAdapter(): WalletAdapter {
  const createWallet = useCallback(async () => null, []);
  const exportPrivateKey = useCallback(async () => {
    throw new Error('Private key export is only available after Privy login.');
  }, []);
  const getProvider = useCallback(async () => null, []);
  const signAndSendTransaction = useCallback(async () => null, []);
  const signMessage = useCallback(async () => null, []);

  return useMemo(
    () => ({
      address: null,
      createWallet,
      exportPrivateKey,
      getProvider,
      isReady: true,
      privateKeyExportMode: 'unavailable' as const,
      signAndSendTransaction,
      signMessage,
    }),
    [createWallet, exportPrivateKey, getProvider, signAndSendTransaction, signMessage],
  );
}

function readDemoUser() {
  const savedUser = readStorageValue<AuthUser>(demoSessionKey);
  return savedUser ? { ...savedUser, isPrivy: false, method: 'google' as const } : null;
}
