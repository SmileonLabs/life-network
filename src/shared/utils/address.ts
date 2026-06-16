const zeroAddress = '0x0000000000000000000000000000000000000000';
const addressPattern = /0x[a-fA-F0-9]{40}/;
const addressOrHashPattern = /0x[a-fA-F0-9]{40,64}/g;
const transactionHashPattern = /0x[a-fA-F0-9]{64}/;

export function isAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function isTransactionHash(hash: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash.trim());
}

export function extractAddressFromText(value: string) {
  const text = value.trim();

  if (isAddress(text)) {
    return normalizeAddress(text);
  }

  const pathMatch = text.match(new RegExp(`(?:address|token)/(${addressPattern.source})`, 'i'));

  if (pathMatch?.[1] && isAddress(pathMatch[1])) {
    return normalizeAddress(pathMatch[1]);
  }

  const ethereumUriMatch = text.match(new RegExp(`^ethereum:(${addressPattern.source})(?:[@/?].*)?$`, 'i'));

  if (ethereumUriMatch?.[1] && isAddress(ethereumUriMatch[1])) {
    return normalizeAddress(ethereumUriMatch[1]);
  }

  const matches = text.match(addressOrHashPattern) ?? [];
  const address = matches.find((match) => match.length === 42);
  return address && isAddress(address) ? normalizeAddress(address) : null;
}

export function extractTransactionHashFromText(value: string) {
  const text = value.trim();

  if (isTransactionHash(text)) {
    return text.toLowerCase();
  }

  const pathMatch = text.match(new RegExp(`tx/(${transactionHashPattern.source})`, 'i'));

  if (pathMatch?.[1] && isTransactionHash(pathMatch[1])) {
    return pathMatch[1].toLowerCase();
  }

  const match = text.match(transactionHashPattern)?.[0];
  return match && isTransactionHash(match) ? match.toLowerCase() : null;
}

export function normalizeAddress(address: string) {
  const trimmed = address.trim();
  return isAddress(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
}

export function isSameAddress(left: string, right: string) {
  return isAddress(left) && isAddress(right) && normalizeAddress(left) === normalizeAddress(right);
}

export function isZeroAddress(address: string) {
  return normalizeAddress(address) === zeroAddress;
}

export function makeDemoAddress(seed: string) {
  return `0x${hashToHex(seed || 'life-wallet', 40)}`;
}

export function makeDemoHash(seed: string) {
  return `0x${hashToHex(`${seed}:${Date.now()}`, 64)}`;
}

function hashToHex(input: string, length: number) {
  let stateA = 0x811c9dc5;
  let stateB = 0x01000193;
  let output = '';
  let cursor = input;

  while (output.length < length) {
    for (let index = 0; index < cursor.length; index += 1) {
      stateA ^= cursor.charCodeAt(index);
      stateA = Math.imul(stateA, 0x01000193);
      stateB ^= stateA >>> 7;
      stateB = Math.imul(stateB, 0x85ebca6b);
    }

    output += `${(stateA >>> 0).toString(16).padStart(8, '0')}${(stateB >>> 0)
      .toString(16)
      .padStart(8, '0')}`;
    cursor = `${cursor}:${output.length}`;
  }

  return output.slice(0, length);
}
