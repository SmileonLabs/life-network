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

export const nativeTransferGasFallbackBnb = 0.000005;
export const splTransferGasFallbackSol = 0.00001;
export const networkFeeSafetyMultiplier = 1.25;

export function getGasReserveBnb(fee: number | null | undefined) {
  if (!Number.isFinite(fee) || !fee || fee <= 0) {
    return 0;
  }

  return fee * networkFeeSafetyMultiplier;
}
