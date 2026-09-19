import { useCallback, useMemo, useState } from 'react';

import { createBlankResume, createId, type Resume } from '../../lib/resume';

export interface ResumeProfile {
  id: string;
  name: string;
  resume: Resume;
}

export interface UseResumeProfilesResult {
  profiles: ResumeProfile[];
  activeProfile: ResumeProfile;
  selectProfile: (profileId: string) => void;
  createProfile: (name: string) => void;
  duplicateProfile: (profileId: string) => void;
  renameProfile: (profileId: string, name: string) => void;
  deleteProfile: (profileId: string) => void;
  updateActiveResume: (updater: (resume: Resume) => Resume) => void;
}

interface ProfilesState {
  profiles: ResumeProfile[];
  activeProfileId: string;
}

function createInitialState(): ProfilesState {
  const profile: ResumeProfile = {
    id: createId(),
    name: 'My Resume',
    resume: createBlankResume(),
  };

  return { profiles: [profile], activeProfileId: profile.id };
}

/**
 * Manages an in-memory set of resume profiles for the builder UI. This is
 * intentionally not persisted yet — Stage 3 (chrome.storage) will replace
 * the `useState` here with a persisted store behind the same interface.
 */
export function useResumeProfiles(): UseResumeProfilesResult {
  const [state, setState] = useState<ProfilesState>(createInitialState);

  const activeProfile =
    state.profiles.find((profile) => profile.id === state.activeProfileId) ??
    state.profiles[0];

  if (!activeProfile) {
    throw new Error('There must always be at least one resume profile.');
  }

  const selectProfile = useCallback((profileId: string) => {
    setState((prev) => ({ ...prev, activeProfileId: profileId }));
  }, []);

  const createProfile = useCallback((name: string) => {
    const profile: ResumeProfile = {
      id: createId(),
      name: name.trim() || 'Untitled resume',
      resume: createBlankResume(),
    };

    setState((prev) => ({
      profiles: [...prev.profiles, profile],
      activeProfileId: profile.id,
    }));
  }, []);

  const duplicateProfile = useCallback((profileId: string) => {
    setState((prev) => {
      const source = prev.profiles.find((profile) => profile.id === profileId);
      if (!source) {
        return prev;
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

      return {
        profiles: [...prev.profiles, copy],
        activeProfileId: copy.id,
      };
    });
  }, []);

  const renameProfile = useCallback((profileId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, name: name.trim() || 'Untitled resume' }
          : profile,
      ),
    }));
  }, []);

  const deleteProfile = useCallback((profileId: string) => {
    setState((prev) => {
      if (prev.profiles.length <= 1) {
        return prev;
      }

      const remaining = prev.profiles.filter(
        (profile) => profile.id !== profileId,
      );
      const activeProfileId =
        prev.activeProfileId === profileId
          ? (remaining[0]?.id ?? prev.activeProfileId)
          : prev.activeProfileId;

      return { profiles: remaining, activeProfileId };
    });
  }, []);

  const updateActiveResume = useCallback(
    (updater: (resume: Resume) => Resume) => {
      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((profile) =>
          profile.id === prev.activeProfileId
            ? {
                ...profile,
                resume: {
                  ...updater(profile.resume),
                  updatedAt: new Date().toISOString(),
                },
              }
            : profile,
        ),
      }));
    },
    [],
  );

  return useMemo(
    () => ({
      profiles: state.profiles,
      activeProfile,
      selectProfile,
      createProfile,
      duplicateProfile,
      renameProfile,
      deleteProfile,
      updateActiveResume,
    }),
    [
      state.profiles,
      activeProfile,
      selectProfile,
      createProfile,
      duplicateProfile,
      renameProfile,
      deleteProfile,
      updateActiveResume,
    ],
  );
}
