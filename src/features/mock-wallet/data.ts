export type MockAsset = {
  address: string;
  accent: string;
  balance: string;
  change: string;
  fiatValue: string;
  kind: 'Core' | 'Gas' | 'BEP-20';
  name: string;
  price: string;
  symbol: string;
};

export type MockActivity = {
  amount: string;
  asset: string;
  date: string;
  direction: 'in' | 'out';
  status: 'Success' | 'Pending' | 'Failed';
  subtitle: string;
  title: string;
};

export type MockWallet = {
  address: string;
  label: string;
  source: 'Generated' | 'Imported';
};

export const mockAddress = '0x7A04C6A4F3218d29C7D8A63c4e4f522B4F2fB91F';

export const mockAssets: MockAsset[] = [
  {
    address: 'life',
    accent: '#C7FF3D',
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
    accent: '#F3BA2F',
    balance: '1.284',
    change: '+0.6%',
    fiatValue: '$815.37',
    kind: 'Gas',
    name: 'BNB',
    price: '$635.02',
    symbol: 'BNB',
  },
  {
    address: 'usdt',
    accent: '#50AF95',
    balance: '1,240.00',
    change: '0.0%',
    fiatValue: '$1,240.00',
    kind: 'BEP-20',
    name: 'Tether USD',
    price: '$1.00',
    symbol: 'USDT',
  },
  {
    address: 'cake',
    accent: '#D1884F',
    balance: '82.31',
    change: '-1.2%',
    fiatValue: '$236.19',
    kind: 'BEP-20',
    name: 'PancakeSwap',
    price: '$2.87',
    symbol: 'CAKE',
  },
];

export const mockActivities: MockActivity[] = [
  {
    amount: '+250 LIFE',
    asset: 'LIFE',
    date: 'Today',
    direction: 'in',
    status: 'Success',
    subtitle: 'Health data reward',
    title: 'Reward received',
  },
  {
    amount: '-0.014 BNB',
    asset: 'BNB',
    date: 'Today',
    direction: 'out',
    status: 'Success',
    subtitle: 'Gas fee',
    title: 'Network fee',
  },
  {
    amount: '-120 LIFE',
    asset: 'LIFE',
    date: 'Yesterday',
    direction: 'out',
    status: 'Pending',
    subtitle: '0x62A1...92C0',
    title: 'Sent',
  },
  {
    amount: '+85 USDT',
    asset: 'USDT',
    date: 'Yesterday',
    direction: 'in',
    status: 'Success',
    subtitle: 'BEP-20 transfer',
    title: 'Received',
  },
  {
    amount: '-14 CAKE',
    asset: 'CAKE',
    date: 'Jun 12',
    direction: 'out',
    status: 'Failed',
    subtitle: 'Insufficient gas',
    title: 'Swap attempt',
  },
];

export const mockWallets: MockWallet[] = [
  {
    address: mockAddress,
    label: 'LIFE Main Wallet',
    source: 'Generated',
  },
  {
    address: '0xF49c2E1517a0451f1dD97167f6C77FaE1b309c80',
    label: 'Imported Wallet',
    source: 'Imported',
  },
];

export const totalValue = '$11,409.80';
