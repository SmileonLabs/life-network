import { type ReactNode, useCallback, useMemo } from 'react';
import { type Href, useGlobalSearchParams, useRouter } from 'expo-router';
import {
  PrivyProvider as ReactPrivyProvider,
  useCreateWallet,
  useLoginWithOAuth,
  usePrivy,
  useWallets,
  type ConnectedWallet,
  type EIP1193Provider,
  type User,
} from '@privy-io/react-auth';

import type { AuthAdapter } from '@/features/auth/services/auth-adapter.types';
import type { AuthUser } from '@/features/auth/types';
import type { Eip1193Provider, WalletAdapter } from '@/features/wallet/services/wallet-adapter.types';
import { PrivyWebBridge } from '@/providers/privy-web-bridge';
import { bscTestnetViem, supportedViemChains } from '@/shared/config/viem-chains';
import { env } from '@/shared/config/env';
import { clearPendingAuthRedirect, getSafeAppPath, readPendingAuthRedirect } from '@/shared/utils/routes';

const privySupportedChains = [supportedViemChains[0], supportedViemChains[1]];

export function PrivyWebLiveProvider({ children }: { children: ReactNode }) {
  const oauthRedirectUrl = typeof window === 'undefined' ? undefined : window.location.origin;

  return (
    <ReactPrivyProvider
      appId={env.privyAppId}
      clientId={env.privyWebClientId || undefined}
      config={{
        defaultChain: bscTestnetViem,
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        customOAuthRedirectUrl: oauthRedirectUrl,
        loginMethods: ['google'],
        supportedChains: privySupportedChains,
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
  const { createWallet: createEmbeddedWallet } = useCreateWallet();
  const { ready, wallets } = useWallets();

  const primaryWallet = useMemo(() => findPrimaryWallet(wallets), [wallets]);

  const createWallet = useCallback(async () => {
    if (primaryWallet?.address) {
      return primaryWallet.address;
    }

    const wallet = await createEmbeddedWallet();
    return wallet.address;
  }, [createEmbeddedWallet, primaryWallet]);

  const getProvider = useCallback(async () => {
    if (!primaryWallet) {
      return null;
    }

    return normalizeProvider(await primaryWallet.getEthereumProvider());
  }, [primaryWallet]);

  return useMemo(
    () => ({
      address: primaryWallet?.address ?? null,
      createWallet,
      getProvider,
      isReady: ready,
    }),
    [createWallet, getProvider, primaryWallet?.address, ready],
  );
}

function findPrimaryWallet(wallets: ConnectedWallet[]) {
  return (
    wallets.find((wallet) => wallet.walletClientType === 'privy-v2') ??
    wallets.find((wallet) => wallet.walletClientType === 'privy') ??
    wallets[0] ??
    null
  );
}

function normalizeProvider(provider: EIP1193Provider): Eip1193Provider {
  return {
    request: (input) =>
      provider.request({
        method: input.method,
        params: Array.isArray(input.params)
          ? input.params
          : input.params
            ? [input.params]
            : undefined,
      }),
  };
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
