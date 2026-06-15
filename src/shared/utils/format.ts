export function shortAddress(address: string, head = 6, tail = 4) {
  if (!address) {
    return 'No wallet';
  }

  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

export function formatTokenAmount(value: number, maxDecimals = 4) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 0,
  }).format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function titleCase(value: string) {
  return value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

