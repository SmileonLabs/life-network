import { type ReactNode } from 'react';
import { PrivyProvider as ExpoPrivyProvider, type Chain } from '@privy-io/expo';

import { env } from '@/shared/config/env';
import { supportedViemChains } from '@/shared/config/viem-chains';

const privySupportedChains = [supportedViemChains[0], supportedViemChains[1]] as [Chain, ...Chain[]];

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <ExpoPrivyProvider
      appId={env.privyAppId}
      clientId={env.privyClientId}
      supportedChains={privySupportedChains}
      config={{
        embedded: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
      }}>
      {children}
    </ExpoPrivyProvider>
  );
}
