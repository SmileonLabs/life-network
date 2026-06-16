import { readStorageValue, removeStorageValue, writeStorageValue } from '@/shared/utils/storage';

const pendingAuthRedirectKey = 'life-wallet-pending-auth-redirect';

export function getSafeAppPath(value: unknown, fallback = '/') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const path = value.trim();

  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/sign-in')) {
    return fallback;
  }

  return path;
}

export function clearPendingAuthRedirect() {
  removeStorageValue(pendingAuthRedirectKey);
}

export function readPendingAuthRedirect(fallback = '/') {
  return getSafeAppPath(readStorageValue<string>(pendingAuthRedirectKey), fallback);
}

export function writePendingAuthRedirect(path: string) {
  writeStorageValue(pendingAuthRedirectKey, getSafeAppPath(path));
}
