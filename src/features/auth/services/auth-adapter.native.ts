import { useCallback, useMemo, useState } from 'react';
import { useLoginWithOAuth, usePrivy, type User } from '@privy-io/expo';

import type { AuthAdapter } from '@/features/auth/services/auth-adapter.types';
import type { AuthUser } from '@/features/auth/types';
import { isDemoMode } from '@/shared/config/env';

export function useAuthAdapter(): AuthAdapter {
  const { error, isReady, logout, user: privyUser } = usePrivy();
  const { login, state } = useLoginWithOAuth();
  const [optimisticUser, setOptimisticUser] = useState<User | null>(null);

  const signInWithGoogle = useCallback(async () => {
    const nextUser = await login({ provider: 'google', redirectUri: '/auth/callback' });
    if (nextUser) {
      setOptimisticUser(nextUser);
    }
  }, [login]);

  const signOut = useCallback(async () => {
    setOptimisticUser(null);
    await logout();
  }, [logout]);

  const authUser = useMemo(() => toAuthUser(privyUser ?? optimisticUser), [optimisticUser, privyUser]);
  const oauthError = state.status === 'error' ? state.error?.message : null;

  return useMemo(
    () => ({
      error: oauthError ?? error?.message ?? null,
      isAuthenticated: Boolean(authUser),
      isDemoMode,
      isReady: isReady && state.status !== 'loading',
      signInWithGoogle,
      signOut,
      user: authUser,
    }),
    [authUser, error?.message, isReady, oauthError, signInWithGoogle, signOut, state.status],
  );
}

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }

  const google = user.linked_accounts.find((account) => account.type === 'google_oauth') as
    | {
        email?: string;
        name?: string;
      }
    | undefined;
  const email = google?.email ?? '';
  const name = google?.name || email || 'LIFE Member';

  return {
    id: user.id,
    name,
    email,
    avatarInitials: getInitials(name),
    method: 'google',
    isPrivy: true,
  };
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
