import { useWallet } from '@/features/wallet/hooks/use-wallet';

export function useActivity() {
  const { activities } = useWallet();

  return {
    activities,
  };
}

