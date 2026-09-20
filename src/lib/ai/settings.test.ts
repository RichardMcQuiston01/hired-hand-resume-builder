import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installFakeChromeStorage } from '../../test/chromeStorageFake';
import {
  AI_SETTINGS_STORAGE_KEY,
  clearAiSettings,
  loadAiSettings,
  saveAiSettings,
} from './settings';

describe('aiSettings', () => {
  beforeEach(() => {
    installFakeChromeStorage();
  });

  it('returns undefined when no key has been saved yet', async () => {
    await expect(loadAiSettings()).resolves.toBeUndefined();
  });

  it('round-trips a saved API key', async () => {
    await saveAiSettings('sk-ant-test-key');

    await expect(loadAiSettings()).resolves.toStrictEqual({
      version: 1,
      anthropicApiKey: 'sk-ant-test-key',
    });
  });

  it('clears a saved API key', async () => {
    await saveAiSettings('sk-ant-test-key');
    await clearAiSettings();

    await expect(loadAiSettings()).resolves.toBeUndefined();
  });

  it('ignores and logs corrupted storage instead of throwing', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await chrome.storage.local.set({
      [AI_SETTINGS_STORAGE_KEY]: { not: 'valid settings' },
    });

    await expect(loadAiSettings()).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledOnce();

    consoleErrorSpy.mockRestore();
  });
});
