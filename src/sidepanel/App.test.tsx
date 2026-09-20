import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

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

describe('App', () => {
  it('renders the side panel heading', async () => {
    render(<App />);
    await flushLoad();

    expect(
      screen.getByRole('heading', { name: 'Hired Hand: Resume Builder' }),
    ).toBeInTheDocument();
  });

  it('reflects edits to the form in the live preview', async () => {
    render(<App />);
    await flushLoad();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jordan Rivera' },
    });

    expect(
      screen.getByRole('heading', { name: 'Jordan Rivera', level: 1 }),
    ).toBeInTheDocument();
  });

  it('adds a new experience entry to the form', async () => {
    render(<App />);
    await flushLoad();

    expect(screen.queryByLabelText(/company/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ Add job' }));

    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  });

  it('creates a new profile from the profile bar', async () => {
    render(<App />);
    await flushLoad();

    fireEvent.click(screen.getByRole('button', { name: 'New' }));

    const select = screen.getByLabelText(
      'Active resume profile',
    ) as HTMLSelectElement;
    expect(select.options).toHaveLength(2);
    expect(select.value).not.toBe('');
    expect(
      screen.getByRole('option', { name: 'Untitled resume' }),
    ).toBeInTheDocument();
  });

  it('enables Undo after an edit and reverts it', async () => {
    render(<App />);
    await flushLoad();

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jordan Rivera' },
    });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(
      screen.getByRole('heading', { name: 'Your Name', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('surfaces an ATS structural warning for a blank resume', async () => {
    render(<App />);
    await flushLoad();

    expect(
      screen.getByText(/an empty resume will not pass ATS screening/i),
    ).toBeInTheDocument();
  });

  it('reports a keyword match score once a job description is pasted', async () => {
    render(<App />);
    await flushLoad();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jordan Rivera' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ Add job' }));
    fireEvent.change(screen.getByLabelText(/^company/i), {
      target: { value: 'Acme Corp' },
    });

    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Looking for someone with Acme experience.' },
    });

    expect(screen.getByText(/match score: /i)).toBeInTheDocument();
  });
});
