export function shortAddress(address: string, head = 6, tail = 4) {
  if (!address) {
    return 'No wallet';
  }

  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

export function formatTokenAmount(value: number, maxDecimals = 4) {
  const minimumDecimals = value > 0 && value < 1 ? 2 : 0;
  return formatNumber(value, {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: minimumDecimals,
  });
}

export function formatCurrency(value: number) {
  return `$${formatNumber(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
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

export function formatWholeNumber(value: number) {
  return formatNumber(value, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

export function formatShortDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Unknown';
  }

  return `${shortMonths[date.getMonth()]} ${date.getDate()}`;
}

export function formatShortTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Unknown';
  }

  const hours = date.getHours();
  const minutes = padLeft(String(date.getMinutes()), 2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${hour12}:${minutes} ${period}`;
}

function formatNumber(
  value: number,
  {
    maximumFractionDigits,
    minimumFractionDigits,
  }: {
    maximumFractionDigits: number;
    minimumFractionDigits: number;
  },
) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const fixed = value.toFixed(maximumFractionDigits);
  const trimmed = trimFractionDigits(fixed, minimumFractionDigits);
  const [integerPart, decimalPart] = trimmed.split('.');
  const withGrouping = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decimalPart ? `${withGrouping}.${decimalPart}` : withGrouping;
}

function trimFractionDigits(value: string, minimumFractionDigits: number) {
  const [integerPart, fractionPart = ''] = value.split('.');

  if (!fractionPart) {
    return integerPart;
  }

  let trimmedFraction = fractionPart;

  while (trimmedFraction.length > minimumFractionDigits && trimmedFraction.endsWith('0')) {
    trimmedFraction = trimmedFraction.slice(0, -1);
  }

  if (trimmedFraction.length < minimumFractionDigits) {
    trimmedFraction = padRight(trimmedFraction, minimumFractionDigits, '0');
  }

  return trimmedFraction ? `${integerPart}.${trimmedFraction}` : integerPart;
}

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function padLeft(value: string, targetLength: number, fill: string) {
  let result = value;

  while (result.length < targetLength) {
    result = `${fill}${result}`;
  }

  return result;
}

function padRight(value: string, targetLength: number, fill: string) {
  let result = value;

  while (result.length < targetLength) {
    result = `${result}${fill}`;
  }

  return result;
}
