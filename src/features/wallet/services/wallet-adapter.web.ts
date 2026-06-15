import type { WalletAdapter } from '@/features/wallet/services/wallet-adapter.types';
import { usePrivyWebWalletAdapter } from '@/providers/privy-web-bridge';

export function useWalletAdapter(): WalletAdapter {
  return usePrivyWebWalletAdapter();
}
