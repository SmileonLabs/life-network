import { type ReactNode } from 'react';
import { PrivyProvider as ExpoPrivyProvider } from '@privy-io/expo';

import { env } from '@/shared/config/env';

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <ExpoPrivyProvider
      appId={env.privyAppId}
      clientId={env.privyMobileClientId}
      config={{
        embedded: {
          solana: {
            createOnLogin: 'all-users',
          },
        },
      }}>
      {children}
    </ExpoPrivyProvider>
  );
}
