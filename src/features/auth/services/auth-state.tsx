import { createContext, type ReactNode, useContext } from 'react';

import { useAuthAdapter } from '@/features/auth/services/auth-adapter';
import type { AuthSession } from '@/features/auth/types';

type AuthContextValue = AuthSession & {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthAdapter();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }

  return context;
}
