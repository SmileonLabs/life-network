import { makeDemoAddress } from '@/shared/utils/address';
import type { WalletImportPreview } from '@/features/wallet/types';

export function classifyWalletSecret(input: string): WalletImportPreview | null {
  const normalized = input.trim().replace(/\s+/g, ' ');

  if (/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    return {
      kind: 'private-key',
      address: makeDemoAddress(normalized),
    };
  }

  const words = normalized.split(' ').filter(Boolean);
  if ((words.length === 12 || words.length === 24) && words.every((word) => /^[a-z]+$/i.test(word))) {
    return {
      kind: 'seed-phrase',
      address: makeDemoAddress(normalized),
      wordCount: words.length,
    };
  }

  return null;
}

export function getSecretKindLabel(kind: WalletImportPreview['kind']) {
  return kind === 'private-key' ? 'Private key' : 'Seed phrase';
}

