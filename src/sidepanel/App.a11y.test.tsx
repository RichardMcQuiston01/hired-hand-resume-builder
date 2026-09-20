import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  savePersistedState,
  STORAGE_SCHEMA_VERSION,
} from '../lib/storage/resumeStorage';
import { createFixtureResume, createId } from '../lib/resume';
import { installFakeChromeStorage } from '../test/chromeStorageFake';
import { App } from './App';

/** Flushes the App's initial `loadPersistedState()` microtask. */
async function flushLoad(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  installFakeChromeStorage();
});

describe('App accessibility', () => {
  it('has no axe violations with a blank default resume', async () => {
    const { container } = render(<App />);
    await flushLoad();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations with a fully populated resume and ATS findings visible', async () => {
    const profileId = createId();
    await savePersistedState({
      version: STORAGE_SCHEMA_VERSION,
      activeProfileId: profileId,
      profiles: [
        { id: profileId, name: 'Full Resume', resume: createFixtureResume() },
      ],
    });

    const { container } = render(<App />);
    await flushLoad();

    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Looking for a TypeScript engineer.' },
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations while renaming a profile', async () => {
    const { container } = render(<App />);
    await flushLoad();

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    expect(await axe(container)).toHaveNoViolations();
  });
});
