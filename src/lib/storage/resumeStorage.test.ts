import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installFakeChromeStorage } from '../../test/chromeStorageFake';
import { createFixtureResume, createId } from '../resume';
import {
  loadPersistedState,
  savePersistedState,
  STORAGE_KEY,
  STORAGE_SCHEMA_VERSION,
  type PersistedState,
} from './resumeStorage';

function createPersistedState(): PersistedState {
  const profile = {
    id: createId(),
    name: 'My Resume',
    resume: createFixtureResume(),
  };
  return {
    version: STORAGE_SCHEMA_VERSION,
    activeProfileId: profile.id,
    profiles: [profile],
  };
}

describe('resumeStorage', () => {
  beforeEach(() => {
    installFakeChromeStorage();
  });

  it('returns undefined when nothing has been saved yet', async () => {
    await expect(loadPersistedState()).resolves.toBeUndefined();
  });

  it('round-trips a saved state', async () => {
    const state = createPersistedState();

    await savePersistedState(state);

    await expect(loadPersistedState()).resolves.toStrictEqual(state);
  });

  it('ignores and logs corrupted storage instead of throwing', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await chrome.storage.local.set({
      [STORAGE_KEY]: { not: 'a valid persisted state' },
    });

    await expect(loadPersistedState()).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledOnce();

    consoleErrorSpy.mockRestore();
  });
});
