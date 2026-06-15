import { isAddress } from '@/shared/utils/address';
import type { AssetBalance } from '@/features/tokens/types';
import type { TransferValidation } from '@/features/transfer/types';

export function validateTransfer(
  asset: AssetBalance | undefined,
  recipient: string,
  amount: string,
  nativeBalance: number,
): TransferValidation {
  const errors: string[] = [];
  const parsedAmount = Number(amount);
  const estimatedGasBnb = asset?.type === 'native' ? 0.00021 : 0.0028;

  if (!asset) {
    errors.push('Select an asset to send.');
  }

  if (!isAddress(recipient.trim())) {
    errors.push('Enter a valid BSC address.');
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.push('Enter an amount greater than zero.');
  }

  if (asset && parsedAmount > asset.balance) {
    errors.push(`Insufficient ${asset.symbol} balance.`);
  }

  if (asset?.type === 'bep20' && nativeBalance < estimatedGasBnb) {
    errors.push('Insufficient BNB for gas.');
  }

  if (asset?.type === 'native' && parsedAmount + estimatedGasBnb > nativeBalance) {
    errors.push('Leave enough BNB for network gas.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    estimatedGasBnb,
  };
}

