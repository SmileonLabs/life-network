import { type ReactNode, useCallback, useMemo } from 'react';
import { type Href, useGlobalSearchParams, useRouter } from 'expo-router';
import {
  PrivyProvider as ReactPrivyProvider,
  useLoginWithOAuth,
  usePrivy,
  type User,
} from '@privy-io/react-auth';
import {
  useCreateWallet as useCreateSolanaWallet,
  useExportWallet as useExportSolanaWallet,
  useSignAndSendTransaction,
  useWallets as useSolanaWallets,
  type ConnectedStandardSolanaWallet,
} from '@privy-io/react-auth/solana';

import type { AuthAdapter } from '@/features/auth/services/auth-adapter.types';
import type { AuthUser } from '@/features/auth/types';
import type { WalletAdapter } from '@/features/wallet/services/wallet-adapter.types';
import { PrivyWebBridge } from '@/providers/privy-web-bridge';
import {
  encodeSolanaSignature,
  getPrivySolanaChain,
  serializeSolanaTransaction,
} from '@/shared/api/solana-client';
import { env } from '@/shared/config/env';
import { clearPendingAuthRedirect, getSafeAppPath, readPendingAuthRedirect } from '@/shared/utils/routes';

export function PrivyWebLiveProvider({ children }: { children: ReactNode }) {
  const oauthRedirectUrl = typeof window === 'undefined' ? undefined : window.location.origin;

  return (
    <ReactPrivyProvider
      appId={env.privyAppId}
      clientId={env.privyWebClientId || undefined}
      config={{
        appearance: {
          accentColor: '#C76A3C',
          theme: '#FAF8F4',
        },
        customOAuthRedirectUrl: oauthRedirectUrl,
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users',
          },
        },
        loginMethods: ['google'],
      }}>
      <PrivyWebLiveBridge>{children}</PrivyWebLiveBridge>
    </ReactPrivyProvider>
  );
}

function PrivyWebLiveBridge({ children }: { children: ReactNode }) {
  const authAdapter = useLiveAuthAdapter();
  const walletAdapter = useLiveWalletAdapter();

  return (
    <PrivyWebBridge authAdapter={authAdapter} walletAdapter={walletAdapter}>
      {children}
    </PrivyWebBridge>
  );
}

function useLiveAuthAdapter(): AuthAdapter {
  const { authenticated, error, ready, logout, user } = usePrivy();
  const router = useRouter();
  const params = useGlobalSearchParams<{ redirect?: string }>();
  const redirectPath = getSafeAppPath(params.redirect, readPendingAuthRedirect());
  const { initOAuth, loading } = useLoginWithOAuth({
    onComplete: () => {
      clearPendingAuthRedirect();
      if (redirectPath !== '/' || getBrowserPathname() === '/sign-in') {
        router.replace(redirectPath as Href);
      }
    },
  });

  const signInWithGoogle = useCallback(async () => {
    await initOAuth({ provider: 'google' });
  }, [initOAuth]);

  const signOut = useCallback(async () => {
    await logout();
  }, [logout]);

  const authUser = useMemo(() => toAuthUser(user), [user]);

  return useMemo(
    () => ({
      error: error?.message ?? null,
      isAuthenticated: authenticated && Boolean(authUser),
      isDemoMode: false,
      isReady: ready && !loading,
      signInWithGoogle,
      signOut,
      user: authUser,
    }),
    [authenticated, authUser, error?.message, loading, ready, signInWithGoogle, signOut],
  );
}

function useLiveWalletAdapter(): WalletAdapter {
  const { createWallet: createEmbeddedWallet } = useCreateSolanaWallet();
  const { exportWallet } = useExportSolanaWallet();
  const { ready, wallets } = useSolanaWallets();
  const { signAndSendTransaction: signAndSendSolanaTransaction } = useSignAndSendTransaction();
  const primaryWallet = useMemo(() => findPrimaryWallet(wallets), [wallets]);

  const createWallet = useCallback(async () => {
    if (primaryWallet?.address) {
      return primaryWallet.address;
    }

    const result = await createEmbeddedWallet();
    return result.wallet.address ?? null;
  }, [createEmbeddedWallet, primaryWallet]);

  const exportPrivateKey = useCallback(async () => {
    if (!primaryWallet?.address) {
      throw new Error('Wallet is not ready.');
    }

    await exportWallet({ address: primaryWallet.address });
  }, [exportWallet, primaryWallet]);

  const getProvider = useCallback(async () => null, []);
  const signMessage = useCallback(async () => null, []);

  const signAndSendTransaction = useCallback<WalletAdapter['signAndSendTransaction']>(
    async (transaction, chain) => {
      if (!primaryWallet) {
        return null;
      }

      const response = await signAndSendSolanaTransaction({
        chain: getPrivySolanaChain(chain),
        transaction: serializeSolanaTransaction(transaction),
        wallet: primaryWallet,
      });

      return encodeSolanaSignature(response.signature);
    },
    [primaryWallet, signAndSendSolanaTransaction],
  );

  return useMemo(
    () => ({
      address: primaryWallet?.address ?? null,
      createWallet,
      exportPrivateKey,
      getProvider,
      isReady: ready,
      privateKeyExportMode: 'privy-modal' as const,
      signAndSendTransaction,
      signMessage,
    }),
    [createWallet, exportPrivateKey, getProvider, primaryWallet, ready, signAndSendTransaction, signMessage],
  );
}

function findPrimaryWallet(wallets: ConnectedStandardSolanaWallet[]) {
  return wallets[0] ?? null;
}

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }

  const google = findGoogleAccount(user);
  const email = google?.email ?? '';
  const name = google?.name || email || 'LIFE Member';

  return {
    avatarInitials: getInitials(name),
    email,
    id: user.id,
    isPrivy: true,
    method: 'google',
    name,
  };
}

function findGoogleAccount(user: User) {
  const linkedAccounts = 'linkedAccounts' in user ? user.linkedAccounts : [];

  return linkedAccounts.find((account) => account.type === 'google_oauth') as
    | {
        email?: string;
        name?: string;
      }
    | undefined;
}

function getInitials(value: string) {
  const initials = value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'LM';
}

function getBrowserPathname() {
  return typeof window === 'undefined' ? '/' : window.location.pathname;
}
