import { type Href, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { type ReactNode, useEffect } from 'react';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { clearPendingAuthRedirect, getSafeAppPath, readPendingAuthRedirect, writePendingAuthRedirect } from '@/shared/utils/routes';

const unauthenticatedRedirectDelayMs = 900;

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useGlobalSearchParams<Record<string, string | string[]>>();
  const router = useRouter();
  const effectivePathname = getEffectivePathname(pathname);
  const effectiveFullPath = getEffectiveFullPath(effectivePathname, params);
  const signInRedirectPath = getSafeAppPath(getFirstParam(params.redirect), readPendingAuthRedirect());
  const { isAuthenticated, isReady } = useAuthSession();
  const isAuthCallbackRoute = effectivePathname.startsWith('/auth/callback');
  const isOnboardingRoute = effectivePathname.startsWith('/onboarding');
  const isPublicRoute = effectivePathname === '/sign-in';
  const redirectHref = getRedirectHref({
    isAuthCallbackRoute,
    isAuthenticated,
    isReady,
    isOnboardingRoute,
    isPublicRoute,
    pathname: effectivePathname,
    redirectPath: effectiveFullPath,
    signInRedirectPath,
  });

  useEffect(() => {
    if (!redirectHref) {
      return undefined;
    }

    if (isSignInRedirect(redirectHref)) {
      writePendingAuthRedirect(effectiveFullPath);
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
  }, [effectiveFullPath, effectivePathname, redirectHref, router]);

  if (!isReady || redirectHref) {
    return null;
  }

  return children;
}

function getRedirectHref({
  isAuthenticated,
  isAuthCallbackRoute,
  isReady,
  isOnboardingRoute,
  isPublicRoute,
  pathname,
  redirectPath,
  signInRedirectPath,
}: {
  isAuthenticated: boolean;
  isAuthCallbackRoute: boolean;
  isReady: boolean;
  isOnboardingRoute: boolean;
  isPublicRoute: boolean;
  pathname: string;
  redirectPath: string;
  signInRedirectPath: string;
}): Href | null {
  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return isPublicRoute || isAuthCallbackRoute
      ? null
      : {
          pathname: '/sign-in',
          params: {
            redirect: redirectPath,
          },
        };
  }

  if (isOnboardingRoute) {
    return null;
  }

  if (pathname === '/sign-in' || isAuthCallbackRoute) {
    return signInRedirectPath as Href;
  }

  return null;
}

function isSignInRedirect(href: Href) {
  return typeof href === 'object' && 'pathname' in href && href.pathname === '/sign-in';
}

function getEffectivePathname(pathname?: string | null) {
  const safePathname = pathname || '/';

  if (safePathname !== '/' || typeof window === 'undefined') {
    return safePathname;
  }

  const browserPathname = window.location?.pathname;
  return browserPathname && browserPathname !== '/' ? browserPathname : safePathname;
}

function getEffectiveFullPath(pathname: string, params: Record<string, string | string[]>) {
  if (pathname === '/sign-in') {
    return pathname;
  }

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === 'redirect' || value == null) {
      continue;
    }

    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (typeof item === 'string' && item.length > 0) {
        query.append(key, item);
      }
    }
  }

  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function getFirstParam(value: unknown) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
