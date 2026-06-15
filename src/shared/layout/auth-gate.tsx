import { Redirect } from 'expo-router';
import { type ReactNode } from 'react';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthSession();

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return children;
}

