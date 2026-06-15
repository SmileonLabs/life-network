import type { AuthAdapter } from '@/features/auth/services/auth-adapter.types';
import { usePrivyWebAuthAdapter } from '@/providers/privy-web-bridge';

export function useAuthAdapter(): AuthAdapter {
  return usePrivyWebAuthAdapter();
}
