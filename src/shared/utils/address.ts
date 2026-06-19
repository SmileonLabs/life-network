import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

const systemProgramAddress = '11111111111111111111111111111111';
const base58CandidatePattern = /[1-9A-HJ-NP-Za-km-z]{32,96}/g;

export function isAddress(address: string) {
  return toSolanaAddress(address) !== null;
}

export function isTransactionHash(hash: string) {
  return toSolanaSignature(hash) !== null;
}

export function extractAddressFromText(value: string) {
  const text = value.trim();

  if (isAddress(text)) {
    return normalizeAddress(text);
  }

  const pathMatch = text.match(/(?:address|account|token)\/([1-9A-HJ-NP-Za-km-z]{32,44})/i);

  if (pathMatch?.[1] && isAddress(pathMatch[1])) {
    return normalizeAddress(pathMatch[1]);
  }

  const solanaUriMatch = text.match(/^solana:([1-9A-HJ-NP-Za-km-z]{32,44})(?:[@/?].*)?$/i);

  if (solanaUriMatch?.[1] && isAddress(solanaUriMatch[1])) {
    return normalizeAddress(solanaUriMatch[1]);
  }

  const matches = text.match(base58CandidatePattern) ?? [];
  const address = matches.find((match) => isAddress(match));
  return address ? normalizeAddress(address) : null;
}

export function extractTransactionHashFromText(value: string) {
  const text = value.trim();

  if (isTransactionHash(text)) {
    return text;
  }

  const pathMatch = text.match(/(?:tx|signature)\/([1-9A-HJ-NP-Za-km-z]{64,96})/i);

  if (pathMatch?.[1] && isTransactionHash(pathMatch[1])) {
    return pathMatch[1];
  }

  const match = text.match(base58CandidatePattern)?.find((candidate) => isTransactionHash(candidate));
  return match ?? null;
}

export function normalizeAddress(address: string) {
  return toSolanaAddress(address) ?? address.trim();
}

export function isSameAddress(left: string, right: string) {
  return normalizeAddress(left) === normalizeAddress(right) && isAddress(left) && isAddress(right);
}

export function isZeroAddress(address: string) {
  return normalizeAddress(address) === systemProgramAddress;
}

export function makeDemoAddress(seed: string) {
  return new PublicKey(hashToBytes(seed || 'life-wallet', 32)).toBase58();
}

export function makeDemoHash(seed: string) {
  return bs58.encode(hashToBytes(`${seed}:${Date.now()}`, 64));
}

export function toSolanaAddress(address: string) {
  const trimmed = address.trim();

  try {
    const publicKey = new PublicKey(trimmed);
    return publicKey.toBase58() === trimmed ? trimmed : publicKey.toBase58();
  } catch {
    return null;
  }
}

export function toSolanaSignature(signature: string) {
  const trimmed = signature.trim();

  try {
    const decoded = bs58.decode(trimmed);
    return decoded.length === 64 ? trimmed : null;
  } catch {
    return null;
  }
}

function hashToBytes(input: string, length: number) {
  let stateA = 0x811c9dc5;
  let stateB = 0x01000193;
  const output = new Uint8Array(length);
  let cursor = input;
  let offset = 0;

  while (offset < length) {
    for (let index = 0; index < cursor.length; index += 1) {
      stateA ^= cursor.charCodeAt(index);
      stateA = Math.imul(stateA, 0x01000193);
      stateB ^= stateA >>> 7;
      stateB = Math.imul(stateB, 0x85ebca6b);
    }

    const words = [stateA >>> 0, stateB >>> 0];

    for (const word of words) {
      for (let shift = 0; shift < 32 && offset < length; shift += 8) {
        output[offset] = (word >>> shift) & 0xff;
        offset += 1;
      }
    }

    cursor = `${cursor}:${offset}`;
  }

  return output;
}
