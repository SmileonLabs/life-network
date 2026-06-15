import type { AssetBalance } from '@/features/tokens/types';

export type TransferDraft = {
  asset: AssetBalance;
  recipient: string;
  amount: string;
};

export type TransferValidation = {
  isValid: boolean;
  errors: string[];
  estimatedGasBnb: number;
};

