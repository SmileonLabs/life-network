import type { SupportedChainId } from '@/shared/config/chains';

export type KnownTokenIcon = 'usdc';

export type KnownTokenInfo = {
  accent: string;
  icon: KnownTokenIcon;
  name: string;
  symbol: string;
};

const knownTokensByMint: Record<string, KnownTokenInfo> = {
  '101:epjfwdd5aufqssqem2qn1xzybapc8g4weggkwytdt1v': {
    accent: '#2775CA',
    icon: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
  },
  '103:4zmmc9srt5ri5x14gagxhahii3gnpaeerypgzjdncdu': {
    accent: '#2775CA',
    icon: 'usdc',
    name: 'Devnet USDC',
    symbol: 'USDC',
  },
};

const knownTokensBySymbol: Record<string, KnownTokenInfo> = {
  USDC: {
    accent: '#2775CA',
    icon: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
  },
};

export function getKnownTokenByMint(chainId: SupportedChainId, mint?: string | null) {
  if (!mint) {
    return null;
  }

  return knownTokensByMint[`${chainId}:${mint.toLowerCase()}`] ?? null;
}

export function getKnownTokenBySymbol(symbol?: string | null) {
  if (!symbol) {
    return null;
  }

  return knownTokensBySymbol[symbol.toUpperCase()] ?? null;
}
