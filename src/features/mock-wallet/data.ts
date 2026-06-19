import { colors } from '@/shared/theme/tokens';

export type MockAsset = {
  address: string;
  accent: string;
  balance: string;
  change: string;
  fiatValue: string;
  iconUrl?: string;
  kind: 'Core' | 'Gas' | 'SPL';
  name: string;
  price: string;
  symbol: string;
};

export type MockActivity = {
  amount: string;
  asset: string;
  date: string;
  direction: 'in' | 'out';
  hash: string;
  status: 'Success' | 'Pending' | 'Failed';
  subtitle: string;
  title: string;
};

export type MockWallet = {
  address: string;
  label: string;
  source: 'Main';
};

export const mockAssets: MockAsset[] = [
  {
    address: 'life',
    accent: colors.lime,
    balance: '18,420.50',
    change: '+4.8%',
    fiatValue: '$9,118.24',
    kind: 'Core',
    name: 'LIFE',
    price: '$0.49',
    symbol: 'LIFE',
  },
  {
    address: 'native',
    accent: colors.amber,
    balance: '1.284',
    change: '+0.6%',
    fiatValue: '$815.37',
    kind: 'Gas',
    name: 'SOL',
    price: '$635.02',
    symbol: 'SOL',
  },
];
