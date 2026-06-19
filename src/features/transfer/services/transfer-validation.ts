import type { AssetBalance } from '@/features/tokens/types';
import {
  getGasReserveBnb,
  nativeTransferGasFallbackBnb,
  splTransferGasFallbackSol,
  type TransferValidation,
} from '@/features/transfer/types';
import { isAddress, isSameAddress, isZeroAddress } from '@/shared/utils/address';

type ValidateTransferOptions = {
  gasReserveBnb?: number | null;
  senderAddress?: string | null;
};

export function validateTransfer(
  asset: AssetBalance | undefined,
  recipient: string,
  amount: string,
  nativeBalance: number,
  options: ValidateTransferOptions = {},
): TransferValidation {
  const errors: string[] = [];
  const normalizedAmount = amount.trim();
  const parsedAmount = Number(normalizedAmount);
  const hasValidAmountFormat = isDecimalAmount(normalizedAmount);
  const normalizedRecipient = recipient.trim();
  const hasValidRecipient = isAddress(normalizedRecipient);
  const fallbackFeeSol = getGasReserveBnb(asset?.type === 'native' ? nativeTransferGasFallbackBnb : splTransferGasFallbackSol);
  const estimatedGasBnb =
    typeof options.gasReserveBnb === 'number' && Number.isFinite(options.gasReserveBnb) && options.gasReserveBnb > 0
      ? options.gasReserveBnb
      : fallbackFeeSol;

  if (!asset) {
    errors.push('Select an asset to send.');
  }

  if (asset?.type === 'spl' && !asset.contractAddress) {
    errors.push('Token address is missing.');
  }

  if (!hasValidRecipient) {
    errors.push('Enter a valid Solana address.');
  } else {
    if (isZeroAddress(normalizedRecipient)) {
      errors.push('Do not send assets to the system program.');
    }

    if (options.senderAddress && isSameAddress(normalizedRecipient, options.senderAddress)) {
      errors.push('Recipient is your active wallet.');
    }

    if (asset?.type === 'spl' && asset.contractAddress && isSameAddress(normalizedRecipient, asset.contractAddress)) {
      errors.push(`Do not send ${asset.symbol} to its token address.`);
    }
  }

  if (!hasValidAmountFormat) {
    errors.push('Enter a valid amount.');
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.push('Enter an amount greater than zero.');
  }

  if (asset && hasValidAmountFormat && hasTooManyDecimals(normalizedAmount, asset.decimals)) {
    errors.push(`${asset.symbol} supports up to ${asset.decimals} decimals.`);
  }

  if (asset && hasValidAmountFormat && isAmountGreaterThanBalance(normalizedAmount, asset.balance, asset.decimals)) {
    errors.push(`Insufficient ${asset.symbol} balance.`);
  }

  if (asset?.type === 'spl' && isAmountGreaterThanBalance(String(estimatedGasBnb), nativeBalance, 9)) {
    errors.push('Insufficient SOL for network fee.');
  }

  if (asset?.type === 'native' && isAmountWithGasGreaterThanBalance(normalizedAmount, estimatedGasBnb, nativeBalance)) {
    errors.push('Leave enough SOL for network fee.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    estimatedGasBnb,
  };
}

function hasTooManyDecimals(amount: string, decimals: number) {
  const [, fraction = ''] = amount.split('.');
  return fraction.length > decimals;
}

function isDecimalAmount(amount: string) {
  return /^\d+(?:\.\d+)?$/.test(amount);
}

export function isAmountGreaterThanBalance(amount: string, balance: number, decimals: number) {
  const amountUnits = decimalToUnits(amount, decimals);
  const balanceUnits = numberToUnits(balance, decimals);

  if (amountUnits === null || balanceUnits === null) {
    return Number(amount) > balance;
  }

  return amountUnits > balanceUnits;
}

export function isAmountWithGasGreaterThanBalance(amount: string, gasBnb: number, nativeBalance: number) {
  const amountUnits = decimalToUnits(amount, 9);
  const gasUnits = numberToUnits(gasBnb, 9);
  const balanceUnits = numberToUnits(nativeBalance, 9);

  if (amountUnits === null || gasUnits === null || balanceUnits === null) {
    return Number(amount) + gasBnb > nativeBalance;
  }

  return amountUnits + gasUnits > balanceUnits;
}

function decimalToUnits(value: string, decimals: number) {
  const normalized = value.trim();

  if (!isDecimalAmount(normalized) || hasTooManyDecimals(normalized, decimals)) {
    return null;
  }

  const [whole = '0', fraction = ''] = normalized.split('.');
  const paddedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals);

  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
}

function numberToUnits(value: number, decimals: number) {
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const decimal = value.toFixed(decimals);

  if (decimal.includes('e')) {
    return null;
  }

  return decimalToUnits(decimal, decimals);
}
