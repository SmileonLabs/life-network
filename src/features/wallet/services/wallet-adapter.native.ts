import { useCallback, useMemo } from 'react';
import { useEmbeddedEthereumWallet } from '@privy-io/expo';

import type { Eip1193Provider, WalletAdapter } from '@/features/wallet/services/wallet-adapter.types';

export function useWalletAdapter(): WalletAdapter {
  const { create, wallets } = useEmbeddedEthereumWallet();
  const primaryWallet = wallets[0] ?? null;

  const createWallet = useCallback(async () => {
    if (primaryWallet?.address) {
      return primaryWallet.address;
    }

    const result = await create();
    const embeddedWallet = result.user.linked_accounts.find(
      (account) => account.type === 'wallet' && 'wallet_client_type' in account && account.wallet_client_type === 'privy',
    ) as { address?: string } | undefined;

    return embeddedWallet?.address ?? null;
  }, [create, primaryWallet]);

  const getProvider = useCallback(async () => {
    if (!primaryWallet) {
      return null;
    }

    return (await primaryWallet.getProvider()) as Eip1193Provider;
  }, [primaryWallet]);

  return useMemo(
    () => ({
      address: primaryWallet?.address ?? null,
      createWallet,
      getProvider,
      isReady: true,
    }),
    [createWallet, getProvider, primaryWallet?.address],
  );
}
