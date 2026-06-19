import type { WalletActivity } from '@/features/activity/types';
import {
  getSolanaExplorerUrl,
  supportedChains,
  type SupportedChainId,
} from '@/shared/config/chains';
import { makeDemoAddress, makeDemoHash, normalizeAddress } from '@/shared/utils/address';
import { shortAddress } from '@/shared/utils/format';

export function getDemoActivities(address: string, chainId: SupportedChainId): WalletActivity[] {
  const chain = supportedChains[chainId];
  const now = Date.now();
  const walletAddress = normalizeAddress(address);
  const rewardTreasury = makeDemoAddress('life-reward-treasury');
  const externalWallet = makeDemoAddress('life-external-wallet');
  const feeSource = makeDemoAddress('life-sol-source');

  if (chainId === 103) {
    return [];
  }

  return [
    {
      id: `${chainId}:reward`,
      amount: 2400,
      chainId,
      counterparty: rewardTreasury,
      direction: 'in',
      explorerUrl: getSolanaExplorerUrl(chain, 'address', walletAddress),
      from: rewardTreasury,
      hash: makeDemoHash(`${address}:reward`),
      status: 'success',
      subtitle: `From reward treasury to ${shortAddress(walletAddress)}`,
      symbol: 'LIFE',
      timestamp: new Date(now - 1000 * 60 * 46).toISOString(),
      title: 'LIFE received',
      to: walletAddress,
    },
    {
      id: `${chainId}:life-transfer`,
      amount: 125,
      chainId,
      counterparty: externalWallet,
      direction: 'out',
      explorerUrl: getSolanaExplorerUrl(chain, 'address', walletAddress),
      from: walletAddress,
      hash: makeDemoHash(`${address}:life`),
      status: 'success',
      subtitle: `To ${shortAddress(externalWallet)}`,
      symbol: 'LIFE',
      timestamp: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      title: 'LIFE sent',
      to: externalWallet,
    },
    {
      id: `${chainId}:sol`,
      amount: 0.25,
      chainId,
      counterparty: feeSource,
      direction: 'in',
      explorerUrl: getSolanaExplorerUrl(chain, 'address', walletAddress),
      from: feeSource,
      hash: makeDemoHash(`${address}:sol`),
      status: 'success',
      subtitle: 'Network fee top-up',
      symbol: chain.nativeCurrency.symbol,
      timestamp: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      title: 'SOL received',
      to: walletAddress,
    },
  ];
}
