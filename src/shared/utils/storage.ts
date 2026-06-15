const memoryStorage = new Map<string, string>();

export function readStorageValue<T>(key: string): T | null {
  const savedValue = readStorageString(key);

  if (!savedValue) {
    return null;
  }

  try {
    return JSON.parse(savedValue) as T;
  } catch {
    return null;
  }
}

export function writeStorageValue<T>(key: string, value: T) {
  writeStorageString(key, JSON.stringify(value));
}

export function removeStorageValue(key: string) {
  const storage = getBrowserStorage();

  if (storage) {
    storage.removeItem(key);
    return;
  }

  memoryStorage.delete(key);
}

function readStorageString(key: string) {
  const storage = getBrowserStorage();

  if (storage) {
    return storage.getItem(key);
  }

  return memoryStorage.get(key) ?? null;
}

function writeStorageString(key: string, value: string) {
  const storage = getBrowserStorage();

  if (storage) {
    storage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = window.localStorage;
    if (!storage) {
      return null;
    }

    const probeKey = 'life-wallet-storage-probe';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}
