import { lazy, Suspense, type ReactNode } from 'react';

import { PrivyWebMockBridge } from '@/providers/privy-web-bridge';
import { env } from '@/shared/config/env';

const LiveProvider = lazy(() =>
  import('@/providers/privy-web-live').then((module) => ({
    default: module.PrivyWebLiveProvider,
  })),
);

export function PrivyProvider({ children }: { children: ReactNode }) {
  if (!env.privyAppId) {
    return <PrivyWebMockBridge>{children}</PrivyWebMockBridge>;
  }

  return (
    <Suspense fallback={<PrivyWebMockBridge>{children}</PrivyWebMockBridge>}>
      <LiveProvider>{children}</LiveProvider>
    </Suspense>
  );
}
