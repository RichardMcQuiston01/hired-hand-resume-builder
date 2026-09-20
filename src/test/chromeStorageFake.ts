/**
 * Minimal in-memory stand-in for `chrome.storage.local`, since jsdom (the
 * Vitest test environment) has no `chrome` global. Only the promise-based
 * `get`/`set` surface used by `src/lib/storage/resumeStorage.ts` is
 * implemented.
 */
export function installFakeChromeStorage(): void {
  const store = new Map<string, unknown>();

  async function get(
    keys?: string | string[] | null,
  ): Promise<Record<string, unknown>> {
    if (keys === undefined || keys === null) {
      return Object.fromEntries(store);
    }

    const keyList = Array.isArray(keys) ? keys : [keys];
    const result: Record<string, unknown> = {};
    for (const key of keyList) {
      if (store.has(key)) {
        result[key] = store.get(key);
      }
    }
    return result;
  }

  async function set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      store.set(key, value);
    }
  }

  globalThis.chrome = {
    storage: { local: { get, set } },
  } as unknown as typeof chrome;
}
