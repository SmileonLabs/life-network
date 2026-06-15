import type { AuthUser } from '@/features/auth/types';

export type AuthAdapter = {
  error: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  user: AuthUser | null;
};
