import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { AuthProvider } from '@/features/auth/services/auth-state';
import { WalletProvider } from '@/features/wallet/services/wallet-state';
import { AppQueryProvider } from '@/providers/query-provider';
import { PrivyProvider } from '@/providers/privy-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PrivyProvider>
          <AppQueryProvider>
            <AuthProvider>
              <WalletSessionBoundary>{children}</WalletSessionBoundary>
            </AuthProvider>
          </AppQueryProvider>
        </PrivyProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function WalletSessionBoundary({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();

  if (!user) {
    return <>{children}</>;
  }

  return <WalletProvider key={user.id}>{children}</WalletProvider>;
}
