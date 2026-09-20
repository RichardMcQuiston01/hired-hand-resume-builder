import { useEffect, useState } from 'react';

import { createBlankResume, createId, type Resume } from '../../lib/resume';
import {
  loadPersistedState,
  savePersistedState,
  STORAGE_SCHEMA_VERSION,
  type PersistedProfile,
} from '../../lib/storage/resumeStorage';

export type ResumeProfile = PersistedProfile;

export interface UseResumeProfilesResult {
  profiles: ResumeProfile[];
  activeProfile: ResumeProfile;
  /** False until the initial load from chrome.storage has settled. */
  isLoaded: boolean;
  /** Whether there is an edit to `undoActiveResume` back to. */
  canUndo: boolean;
  selectProfile: (profileId: string) => void;
  createProfile: (name: string) => void;
  duplicateProfile: (profileId: string) => void;
  renameProfile: (profileId: string, name: string) => void;
  deleteProfile: (profileId: string) => void;
  updateActiveResume: (updater: (resume: Resume) => Resume) => void;
  undoActiveResume: () => void;
}

interface ProfilesState {
  profiles: ResumeProfile[];
  activeProfileId: string;
}

interface PendingSnapshot {
  profileId: string;
  resume: Resume;
}

const AUTOSAVE_DEBOUNCE_MS = 400;
const UNDO_HISTORY_LIMIT = 20;

function createInitialState(): ProfilesState {
  const profile: ResumeProfile = {
    id: createId(),
    name: 'My Resume',
    resume: createBlankResume(),
  };

  return { profiles: [profile], activeProfileId: profile.id };
}

/**
 * Manages the set of resume profiles for the builder UI: in-memory state,
 * backed by `chrome.storage.local` (loaded once on mount, autosaved on a
 * debounce), plus a per-profile undo stack checkpointed on that same
 * debounce.
 */
export function useResumeProfiles(): UseResumeProfilesResult {
  const [state, setState] = useState<ProfilesState>(createInitialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [historyByProfile, setHistoryByProfile] = useState<
    Record<string, Resume[]>
  >({});
  const [pendingSnapshot, setPendingSnapshot] =
    useState<PendingSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadPersistedState()
      .then((persisted) => {
        if (cancelled) {
          return;
        }
        if (persisted) {
          setState({
            profiles: persisted.profiles,
            activeProfileId: persisted.activeProfileId,
          });
        }
        setIsLoaded(true);
      })
      .catch((error: unknown) => {
        console.error('Failed to load resume profiles from storage.', error);
        if (!cancelled) {
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (pendingSnapshot) {
        const { profileId, resume } = pendingSnapshot;
        setHistoryByProfile((history) => {
          const stack = [...(history[profileId] ?? []), resume].slice(
            -UNDO_HISTORY_LIMIT,
          );
          return { ...history, [profileId]: stack };
        });
        setPendingSnapshot(null);
      }

      savePersistedState({
        version: STORAGE_SCHEMA_VERSION,
        activeProfileId: state.activeProfileId,
        profiles: state.profiles,
      }).catch((error: unknown) => {
        console.error('Failed to save resume profiles to storage.', error);
      });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [state, isLoaded, pendingSnapshot]);

  const activeProfile =
    state.profiles.find((profile) => profile.id === state.activeProfileId) ??
    state.profiles[0];

  if (!activeProfile) {
    throw new Error('There must always be at least one resume profile.');
  }

  function selectProfile(profileId: string): void {
    setState({ ...state, activeProfileId: profileId });
  }

  function createProfile(name: string): void {
    const profile: ResumeProfile = {
      id: createId(),
      name: name.trim() || 'Untitled resume',
      resume: createBlankResume(),
    };

    setState({
      profiles: [...state.profiles, profile],
      activeProfileId: profile.id,
    });
  }

  function duplicateProfile(profileId: string): void {
    const source = state.profiles.find((profile) => profile.id === profileId);
    if (!source) {
      return;
    }

    const copy: ResumeProfile = {
      id: createId(),
      name: `${source.name} (copy)`,
      resume: {
        ...source.resume,
        id: createId(),
        updatedAt: new Date().toISOString(),
      },
    };

    setState({ profiles: [...state.profiles, copy], activeProfileId: copy.id });
  }

  function renameProfile(profileId: string, name: string): void {
    setState({
      ...state,
      profiles: state.profiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, name: name.trim() || 'Untitled resume' }
          : profile,
      ),
    });
  }

  function deleteProfile(profileId: string): void {
    if (state.profiles.length <= 1) {
      return;
    }

    const remaining = state.profiles.filter(
      (profile) => profile.id !== profileId,
    );
    const activeProfileId =
      state.activeProfileId === profileId
        ? (remaining[0]?.id ?? state.activeProfileId)
        : state.activeProfileId;

    if (profileId in historyByProfile) {
      const { [profileId]: _removed, ...rest } = historyByProfile;
      setHistoryByProfile(rest);
    }
    setPendingSnapshot((prev) => (prev?.profileId === profileId ? null : prev));

    setState({ profiles: remaining, activeProfileId });
  }

  function updateActiveResume(updater: (resume: Resume) => Resume): void {
    const activeId = state.activeProfileId;
    const current = state.profiles.find((profile) => profile.id === activeId);
    if (!current) {
      return;
    }

    setPendingSnapshot((prev) =>
      prev && prev.profileId === activeId
        ? prev
        : { profileId: activeId, resume: current.resume },
    );

    setState({
      ...state,
      profiles: state.profiles.map((profile) =>
        profile.id === activeId
          ? {
              ...profile,
              resume: {
                ...updater(profile.resume),
                updatedAt: new Date().toISOString(),
              },
            }
          : profile,
      ),
    });
  }

  function undoActiveResume(): void {
    const activeId = state.activeProfileId;

    if (pendingSnapshot && pendingSnapshot.profileId === activeId) {
      const { resume } = pendingSnapshot;
      setPendingSnapshot(null);
      setState({
        ...state,
        profiles: state.profiles.map((profile) =>
          profile.id === activeId ? { ...profile, resume } : profile,
        ),
      });
      return;
    }

    const stack = historyByProfile[activeId];
    if (!stack || stack.length === 0) {
      return;
    }
    const previousResume = stack.at(-1);
    if (!previousResume) {
      return;
    }

    setHistoryByProfile({
      ...historyByProfile,
      [activeId]: stack.slice(0, -1),
    });
    setState({
      ...state,
      profiles: state.profiles.map((profile) =>
        profile.id === activeId
          ? { ...profile, resume: previousResume }
          : profile,
      ),
    });
  }

  const canUndo =
    pendingSnapshot?.profileId === activeProfile.id ||
    (historyByProfile[activeProfile.id]?.length ?? 0) > 0;

  return {
    profiles: state.profiles,
    activeProfile,
    isLoaded,
    canUndo,
    selectProfile,
    createProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
    updateActiveResume,
    undoActiveResume,
  };
}
