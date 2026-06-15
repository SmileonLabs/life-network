import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { isDemoMode } from '@/shared/config/env';
import type { AuthSession, AuthUser } from '@/features/auth/types';

type AuthContextValue = AuthSession & {
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const demoUser: AuthUser = {
  id: 'google:demo-life-user',
  name: 'LIFE Member',
  email: 'member@life.global',
  avatarInitials: 'LM',
};

const demoSessionKey = 'life-wallet-demo-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readDemoUser());

  const signInWithGoogle = useCallback(async () => {
    writeDemoUser(demoUser);
    setUser(demoUser);
  }, []);

  const signOut = useCallback(() => {
    clearDemoUser();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isDemoMode,
      signInWithGoogle,
      signOut,
    }),
    [signInWithGoogle, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }

  return context;
}

function readDemoUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedUser = window.localStorage.getItem(demoSessionKey);
    return savedUser ? (JSON.parse(savedUser) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeDemoUser(user: AuthUser) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(demoSessionKey, JSON.stringify(user));
}

function clearDemoUser() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(demoSessionKey);
}
