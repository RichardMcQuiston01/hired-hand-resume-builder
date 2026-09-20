import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBlankResume, createId, type Resume } from '../../lib/resume';
import {
  loadPersistedState,
  savePersistedState,
  STORAGE_SCHEMA_VERSION,
} from '../../lib/storage/resumeStorage';
import { installFakeChromeStorage } from '../../test/chromeStorageFake';
import { useResumeProfiles } from './useResumeProfiles';

const AUTOSAVE_DEBOUNCE_MS = 400;

/** Flushes the hook's initial `loadPersistedState()` microtask. */
async function flushLoad(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

function setFullName(resume: Resume, fullName: string): Resume {
  return { ...resume, contact: { ...resume.contact, fullName } };
}

beforeEach(() => {
  installFakeChromeStorage();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useResumeProfiles', () => {
  it('starts with a single default profile', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.activeProfile.name).toBe('My Resume');
    expect(result.current.activeProfile.resume.experience).toStrictEqual([]);
  });

  it('creates a new profile and makes it active', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();
    const firstProfileId = result.current.activeProfile.id;

    act(() => {
      result.current.createProfile('Second Resume');
    });

    expect(result.current.profiles).toHaveLength(2);
    expect(result.current.activeProfile.name).toBe('Second Resume');
    expect(result.current.activeProfile.id).not.toBe(firstProfileId);
  });

  it('updates only the active profile resume', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();

    act(() => {
      result.current.createProfile('Second Resume');
    });
    act(() => {
      result.current.updateActiveResume((resume) =>
        setFullName(resume, 'Jordan Rivera'),
      );
    });

    const [first, second] = result.current.profiles;
    expect(first?.resume.contact.fullName).toBe('');
    expect(second?.resume.contact.fullName).toBe('Jordan Rivera');
  });

  it('duplicates a profile with a new id', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();
    const originalId = result.current.activeProfile.id;

    act(() => {
      result.current.updateActiveResume((resume) =>
        setFullName(resume, 'Jordan Rivera'),
      );
    });
    act(() => {
      result.current.duplicateProfile(originalId);
    });

    expect(result.current.profiles).toHaveLength(2);
    expect(result.current.activeProfile.name).toBe('My Resume (copy)');
    expect(result.current.activeProfile.resume.contact.fullName).toBe(
      'Jordan Rivera',
    );
    expect(result.current.activeProfile.id).not.toBe(originalId);
  });

  it('refuses to delete the last remaining profile', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();
    const onlyProfileId = result.current.activeProfile.id;

    act(() => {
      result.current.deleteProfile(onlyProfileId);
    });

    expect(result.current.profiles).toHaveLength(1);
  });

  it('falls back to a remaining profile after deleting the active one', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();
    const firstProfileId = result.current.activeProfile.id;

    act(() => {
      result.current.createProfile('Second Resume');
    });
    act(() => {
      result.current.deleteProfile(result.current.activeProfile.id);
    });

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.activeProfile.id).toBe(firstProfileId);
  });

  it('loads a previously persisted state instead of the default profile', async () => {
    const persistedProfileId = createId();
    await savePersistedState({
      version: STORAGE_SCHEMA_VERSION,
      activeProfileId: persistedProfileId,
      profiles: [
        {
          id: persistedProfileId,
          name: 'Saved Resume',
          resume: setFullName(createBlankResume(), 'Taylor Kim'),
        },
      ],
    });

    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();

    expect(result.current.activeProfile.name).toBe('Saved Resume');
    expect(result.current.activeProfile.resume.contact.fullName).toBe(
      'Taylor Kim',
    );
  });

  it('autosaves to chrome.storage.local after the debounce', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();

    act(() => {
      result.current.updateActiveResume((resume) =>
        setFullName(resume, 'Jordan Rivera'),
      );
    });

    await expect(loadPersistedState()).resolves.toBeUndefined();

    await act(async () => {
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 1);
      await Promise.resolve();
    });

    const persisted = await loadPersistedState();
    expect(persisted?.profiles[0]?.resume.contact.fullName).toBe(
      'Jordan Rivera',
    );
  });

  it('undoes an uncommitted edit back to the last checkpoint', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();

    expect(result.current.canUndo).toBe(false);

    act(() => {
      result.current.updateActiveResume((resume) => setFullName(resume, 'A'));
    });
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undoActiveResume();
    });

    expect(result.current.activeProfile.resume.contact.fullName).toBe('');
    expect(result.current.canUndo).toBe(false);
  });

  it('undoes past a committed checkpoint', async () => {
    const { result } = renderHook(() => useResumeProfiles());
    await flushLoad();

    act(() => {
      result.current.updateActiveResume((resume) => setFullName(resume, 'A'));
    });
    // Let the debounce commit "A" as a checkpoint (history: [""]).
    await act(async () => {
      vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 1);
      await Promise.resolve();
    });

    act(() => {
      result.current.updateActiveResume((resume) => setFullName(resume, 'B'));
    });

    // First undo: back to the pending snapshot ("A").
    act(() => {
      result.current.undoActiveResume();
    });
    expect(result.current.activeProfile.resume.contact.fullName).toBe('A');
    expect(result.current.canUndo).toBe(true);

    // Second undo: pop the committed checkpoint ("").
    act(() => {
      result.current.undoActiveResume();
    });
    expect(result.current.activeProfile.resume.contact.fullName).toBe('');
    expect(result.current.canUndo).toBe(false);
  });
});
