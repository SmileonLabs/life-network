import { supportedChains, type SupportedChainId } from '@/shared/config/chains';
import { makeDemoHash } from '@/shared/utils/address';
import { shortAddress } from '@/shared/utils/format';
import type { WalletActivity } from '@/features/activity/types';

export function getDemoActivities(address: string, chainId: SupportedChainId): WalletActivity[] {
  const chain = supportedChains[chainId];
  const now = Date.now();

  return [
    {
      id: `${chainId}:reward`,
      chainId,
      hash: makeDemoHash(`${address}:reward`),
      title: 'LIFE received',
      subtitle: `From reward treasury to ${shortAddress(address)}`,
      direction: 'in',
      status: 'success',
      symbol: 'LIFE',
      amount: 2400,
      timestamp: new Date(now - 1000 * 60 * 46).toISOString(),
      explorerUrl: `${chain.explorerBaseUrl}/address/${address}`,
    },
    {
      id: `${chainId}:swap`,
      chainId,
      hash: makeDemoHash(`${address}:usdt`),
      title: 'USDT sent',
      subtitle: `To ${shortAddress('0x2c9fD8D1144C337E4b337C6aB5Db4Caa6a9F27F1')}`,
      direction: 'out',
      status: 'success',
      symbol: 'USDT',
      amount: 125,
      timestamp: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
      explorerUrl: `${chain.explorerBaseUrl}/address/${address}`,
    },
    {
      id: `${chainId}:gas`,
      chainId,
      hash: makeDemoHash(`${address}:gas`),
      title: 'BNB received',
      subtitle: 'Gas top-up from connected account',
      direction: 'in',
      status: 'success',
      symbol: chain.nativeCurrency.symbol,
      amount: 0.25,
      timestamp: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      explorerUrl: `${chain.explorerBaseUrl}/address/${address}`,
    },
  ];
}
