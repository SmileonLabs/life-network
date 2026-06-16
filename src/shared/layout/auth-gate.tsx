import { type Href, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { type ReactNode, useEffect } from 'react';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { clearPendingAuthRedirect, getSafeAppPath, readPendingAuthRedirect, writePendingAuthRedirect } from '@/shared/utils/routes';

const unauthenticatedRedirectDelayMs = 900;

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useGlobalSearchParams<{ redirect?: string }>();
  const effectivePathname = getEffectivePathname(pathname);
  const storedRedirectPath = readPendingAuthRedirect();
  const { isAuthenticated, isReady } = useAuthSession();
  const isOnboardingRoute = effectivePathname.startsWith('/onboarding');
  const isPublicRoute = effectivePathname === '/sign-in';
  const redirectHref = getRedirectHref({
    isAuthenticated,
    isReady,
    isOnboardingRoute,
    isPublicRoute,
    pathname: effectivePathname,
    redirectPath: params.redirect,
    storedRedirectPath,
  });

  useEffect(() => {
    if (!redirectHref) {
      return undefined;
    }

    if (isSignInRedirect(redirectHref)) {
      writePendingAuthRedirect(effectivePathname);
      const redirectTimer = setTimeout(() => {
        router.replace(redirectHref);
      }, unauthenticatedRedirectDelayMs);

      return () => clearTimeout(redirectTimer);
    }

    if (effectivePathname === '/sign-in') {
      clearPendingAuthRedirect();
    }
    router.replace(redirectHref);
    return undefined;
  }, [effectivePathname, redirectHref, router]);

  return children;
}

function getRedirectHref({
  isAuthenticated,
  isReady,
  isOnboardingRoute,
  isPublicRoute,
  pathname,
  redirectPath,
  storedRedirectPath,
}: {
  isAuthenticated: boolean;
  isReady: boolean;
  isOnboardingRoute: boolean;
  isPublicRoute: boolean;
  pathname: string;
  redirectPath?: string;
  storedRedirectPath: string;
}): Href | null {
  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return isPublicRoute
      ? null
      : {
          pathname: '/sign-in',
          params: {
            redirect: pathname,
          },
        };
  }

  if (isOnboardingRoute) {
    return null;
  }

  if (pathname === '/sign-in') {
    return getSafeAppPath(redirectPath, storedRedirectPath) as Href;
  }

  return null;
}

function isSignInRedirect(href: Href) {
  return typeof href === 'object' && 'pathname' in href && href.pathname === '/sign-in';
}

function getEffectivePathname(pathname: string) {
  if (pathname !== '/' || typeof window === 'undefined') {
    return pathname;
  }

  const browserPathname = window.location.pathname;
  return browserPathname && browserPathname !== '/' ? browserPathname : pathname;
}
