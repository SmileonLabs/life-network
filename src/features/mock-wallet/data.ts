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
    hash: '0x8f41a0c7e72d5f6a3d19b4e8a0f13c6b9d2a4e5f7b8c9d01122334455667788',
    status: 'Success',
    subtitle: 'Health data reward',
    title: 'Reward received',
  },
  {
    amount: '-0.014 BNB',
    asset: 'BNB',
    date: 'Today',
    direction: 'out',
    hash: '0x9235b4c18a6f7d2e1c0b9a88776655443322110fedcba9876543210011223344',
    status: 'Success',
    subtitle: 'Gas fee',
    title: 'Network fee',
  },
  {
    amount: '-120 LIFE',
    asset: 'LIFE',
    date: 'Yesterday',
    direction: 'out',
    hash: '0x7246ed1c0b9a8f76543210123456789abcdef0123456789abcdef01122334455',
    status: 'Pending',
    subtitle: '0x62A1...92C0',
    title: 'Sent',
  },
  {
    amount: '+85 USDT',
    asset: 'USDT',
    date: 'Yesterday',
    direction: 'in',
    hash: '0xa3e7291f8b6c5d4e3f2019876543210abcdefabcdef1234567890abcdef1234',
    status: 'Success',
    subtitle: 'BEP-20 transfer',
    title: 'Received',
  },
  {
    amount: '-14 CAKE',
    asset: 'CAKE',
    date: 'Jun 12',
    direction: 'out',
    hash: '0xfd1098c7b6a543210fedcba98765432100112233445566778899aabbccddeeff',
    status: 'Failed',
    subtitle: 'Insufficient gas',
    title: 'Swap attempt',
  },
];

export const mockWallets: MockWallet[] = [
  {
    address: mockAddress,
    label: 'Main Wallet',
    source: 'Main',
  },
];

export const totalValue = '$11,409.80';
