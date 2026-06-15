export function isAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function normalizeAddress(address: string) {
  const trimmed = address.trim();
  return isAddress(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
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
