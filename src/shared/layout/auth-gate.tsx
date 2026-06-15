import { type Href, usePathname, useRouter } from 'expo-router';
import { type ReactNode, useEffect } from 'react';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { useWallet } from '@/features/wallet/hooks/use-wallet';

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuthSession();
  const { wallets } = useWallet();
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isPublicRoute = pathname === '/sign-in';
  const hasWallet = wallets.length > 0;
  const redirectHref = getRedirectHref({
    hasWallet,
    isAuthenticated,
    isReady,
    isOnboardingRoute,
    isPublicRoute,
    pathname,
  });

  useEffect(() => {
    if (redirectHref) {
      router.replace(redirectHref);
    }
  }, [redirectHref, router]);

  return children;
}

function getRedirectHref({
  hasWallet,
  isAuthenticated,
  isReady,
  isOnboardingRoute,
  isPublicRoute,
  pathname,
}: {
  hasWallet: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  isOnboardingRoute: boolean;
  isPublicRoute: boolean;
  pathname: string;
}): Href | null {
  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return isPublicRoute ? null : '/sign-in';
  }

  if (!hasWallet) {
    return isPublicRoute ? null : '/sign-in';
  }

  if (isOnboardingRoute) {
    return null;
  }

  if (pathname === '/sign-in') {
    return '/';
  }

  return null;
}
