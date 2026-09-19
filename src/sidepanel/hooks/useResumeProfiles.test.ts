import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useResumeProfiles } from './useResumeProfiles';

describe('useResumeProfiles', () => {
  it('starts with a single default profile', () => {
    const { result } = renderHook(() => useResumeProfiles());

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.activeProfile.name).toBe('My Resume');
    expect(result.current.activeProfile.resume.experience).toStrictEqual([]);
  });

  it('creates a new profile and makes it active', () => {
    const { result } = renderHook(() => useResumeProfiles());
    const firstProfileId = result.current.activeProfile.id;

    act(() => {
      result.current.createProfile('Second Resume');
    });

    expect(result.current.profiles).toHaveLength(2);
    expect(result.current.activeProfile.name).toBe('Second Resume');
    expect(result.current.activeProfile.id).not.toBe(firstProfileId);
  });

  it('updates only the active profile resume', () => {
    const { result } = renderHook(() => useResumeProfiles());

    act(() => {
      result.current.createProfile('Second Resume');
    });
    act(() => {
      result.current.updateActiveResume((resume) => ({
        ...resume,
        contact: { ...resume.contact, fullName: 'Jordan Rivera' },
      }));
    });

    const [first, second] = result.current.profiles;
    expect(first?.resume.contact.fullName).toBe('');
    expect(second?.resume.contact.fullName).toBe('Jordan Rivera');
  });

  it('duplicates a profile with a new id', () => {
    const { result } = renderHook(() => useResumeProfiles());
    const originalId = result.current.activeProfile.id;

    act(() => {
      result.current.updateActiveResume((resume) => ({
        ...resume,
        contact: { ...resume.contact, fullName: 'Jordan Rivera' },
      }));
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

  it('refuses to delete the last remaining profile', () => {
    const { result } = renderHook(() => useResumeProfiles());
    const onlyProfileId = result.current.activeProfile.id;

    act(() => {
      result.current.deleteProfile(onlyProfileId);
    });

    expect(result.current.profiles).toHaveLength(1);
  });

  it('falls back to a remaining profile after deleting the active one', () => {
    const { result } = renderHook(() => useResumeProfiles());
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
});
