import { useCallback, useMemo } from 'react';
import { Transaction } from '@solana/web3.js';
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo';
import { Buffer } from 'buffer';
import * as WebBrowser from 'expo-web-browser';

import type { SolanaWalletProvider, WalletAdapter } from '@/features/wallet/services/wallet-adapter.types';
import {
  encodeSolanaSignature,
  getSolanaConnection,
} from '@/shared/api/solana-client';
import { env } from '@/shared/config/env';

const defaultKeyExportUrl = 'https://life-network.co.kr/security/export';

export function useWalletAdapter(): WalletAdapter {
  const { isReady, user } = usePrivy();
  const solanaWallet = useEmbeddedSolanaWallet();
  const connectedWallet = useMemo(
    () => (solanaWallet.status === 'connected' ? solanaWallet.wallets[0] ?? null : null),
    [solanaWallet],
  );
  const address = useMemo(
    () => connectedWallet?.address ?? readSolanaWalletAddress(user),
    [connectedWallet?.address, user],
  );

  const createWallet = useCallback(async () => {
    if (connectedWallet?.address) {
      return connectedWallet.address;
    }

    if (solanaWallet.status === 'needs-recovery' && 'recover' in solanaWallet && typeof solanaWallet.recover === 'function') {
      const provider = await solanaWallet.recover();
      return readProviderPublicKey(provider) ?? readSolanaWalletAddress(user);
    }

    if ('create' in solanaWallet && typeof solanaWallet.create === 'function') {
      const provider = await solanaWallet.create({ recoveryMethod: 'privy' });
      return readProviderPublicKey(provider) ?? readSolanaWalletAddress(user);
    }

    return address;
  }, [address, connectedWallet, solanaWallet, user]);

  const getProvider = useCallback(async (): Promise<SolanaWalletProvider | null> => {
    if (connectedWallet?.getProvider) {
      return (await connectedWallet.getProvider()) as SolanaWalletProvider;
    }

    if (solanaWallet.status === 'connected' && typeof solanaWallet.getProvider === 'function') {
      return (await solanaWallet.getProvider()) as SolanaWalletProvider;
    }

    return null;
  }, [connectedWallet, solanaWallet]);

  const exportPrivateKey = useCallback(async () => {
    const exportUrl = env.privyKeyExportUrl || defaultKeyExportUrl;
    await WebBrowser.openBrowserAsync(addExportQuery(exportUrl, address), {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  }, [address]);

  const signAndSendTransaction = useCallback<WalletAdapter['signAndSendTransaction']>(
    async (transaction, chain) => {
      const provider = await getProvider();

      if (!provider?.request && !provider?.signAndSendTransaction) {
        throw new Error('Privy Solana wallet is not ready.');
      }

      const requestTransaction = transaction instanceof Uint8Array ? Transaction.from(transaction) : transaction;

      const response = provider.request
        ? await provider.request({
            method: 'signAndSendTransaction',
            params: {
              connection: getSolanaConnection(chain.id),
              options: {
                preflightCommitment: 'confirmed',
              },
              transaction: requestTransaction,
            },
          })
        : await provider.signAndSendTransaction?.(requestTransaction, {
            preflightCommitment: 'confirmed',
          });
      const signature = readSignature(response);

      if (!signature) {
        throw new Error('Transaction signature was not returned.');
      }

      return encodeSolanaSignature(signature);
    },
    [getProvider],
  );

  const signMessage = useCallback<WalletAdapter['signMessage']>(
    async (message) => {
      const provider = await getProvider();

      if (!provider?.request && !provider?.signMessage) {
        return null;
      }

      const response = provider.request
        ? await provider.request({
            method: 'signMessage',
            params: {
              encoding: 'base64',
              message: Buffer.from(message, 'utf8').toString('base64'),
            },
          })
        : await provider.signMessage?.(message);

      const signature = readSignature(response);
      return signature ? encodeSolanaSignature(signature) : null;
    },
    [getProvider],
  );
  const adapterReady = isReady && !['connecting', 'creating', 'reconnecting'].includes(solanaWallet.status);
  const privateKeyExportMode = 'external-url';

  return useMemo(
    () => ({
      address,
      createWallet,
      exportPrivateKey,
      getProvider,
      isReady: adapterReady,
      privateKeyExportMode,
      signAndSendTransaction,
      signMessage,
    }),
    [address, adapterReady, createWallet, exportPrivateKey, getProvider, privateKeyExportMode, signAndSendTransaction, signMessage],
  );
}

function addExportQuery(url: string, address?: string | null) {
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set('auto', '1');

    if (address) {
      nextUrl.searchParams.set('walletAddress', address);
    }

    return nextUrl.toString();
  } catch {
    const query = new URLSearchParams({ auto: '1' });

    if (address) {
      query.set('walletAddress', address);
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${query.toString()}`;
  }
}

function readProviderPublicKey(provider: unknown) {
  if (!provider || typeof provider !== 'object' || !('_publicKey' in provider)) {
    return null;
  }

  const publicKey = (provider as { _publicKey?: unknown })._publicKey;
  return typeof publicKey === 'string' ? publicKey : null;
}

function readSignature(response: unknown) {
  if (!response) {
    return null;
  }

  if (typeof response === 'string' || response instanceof Uint8Array || Array.isArray(response)) {
    return response;
  }

  if (typeof response === 'object' && 'signature' in response) {
    const signature = (response as { signature?: unknown }).signature;

    if (typeof signature === 'string' || signature instanceof Uint8Array || Array.isArray(signature)) {
      return signature;
    }
  }

  if (typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: unknown }).data;

    if (data && typeof data === 'object' && 'signature' in data) {
      const signature = (data as { signature?: unknown }).signature;

      if (typeof signature === 'string' || signature instanceof Uint8Array || Array.isArray(signature)) {
        return signature;
      }
    }
  }

  return null;
}

function readSolanaWalletAddress(user: unknown) {
  if (!user || typeof user !== 'object' || !('linked_accounts' in user) || !Array.isArray(user.linked_accounts)) {
    return null;
  }

  const linkedAccount = user.linked_accounts.find((account) => {
    if (!account || typeof account !== 'object') {
      return false;
    }

    return (
      'type' in account &&
      account.type === 'wallet' &&
      'chain_type' in account &&
      account.chain_type === 'solana' &&
      'address' in account &&
      typeof account.address === 'string'
    );
  });

  return linkedAccount && typeof linkedAccount === 'object' && 'address' in linkedAccount && typeof linkedAccount.address === 'string'
    ? linkedAccount.address
    : null;
}
