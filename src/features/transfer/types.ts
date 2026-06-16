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

export const nativeTransferGasFallbackBnb = 0.00021;
export const bep20TransferGasFallbackBnb = 0.0028;
export const gasSafetyMultiplier = 1.15;

export function getGasReserveBnb(fee: number | null | undefined) {
  if (!Number.isFinite(fee) || !fee || fee <= 0) {
    return 0;
  }

  return fee * gasSafetyMultiplier;
}
