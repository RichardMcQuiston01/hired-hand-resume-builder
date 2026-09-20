/**
 * Minimal in-memory stand-in for `chrome.storage.local`, since jsdom (the
 * Vitest test environment) has no `chrome` global. Only the promise-based
 * `get`/`set`/`remove` surface used by `src/lib/storage/resumeStorage.ts`
 * and `src/lib/ai/settings.ts` is implemented.
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

  async function remove(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      store.delete(key);
    }
  }

  globalThis.chrome = {
    storage: { local: { get, set, remove } },
  } as unknown as typeof chrome;
}
