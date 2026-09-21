import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exportResumeAsJson } from '../lib/export';
import { createBlankResume } from '../lib/resume';
import { installFakeChromeStorage } from '../test/chromeStorageFake';
import { App } from './App';

const createMessageMock = vi.fn();

class MockAnthropic {
  static AuthenticationError = class extends Error {};
  static RateLimitError = class extends Error {};
  static APIConnectionError = class extends Error {};
  static APIError = class extends Error {};
  messages = { create: createMessageMock };
  constructor(public options: unknown) {}
}

vi.mock('@anthropic-ai/sdk', () => ({ default: MockAnthropic }));

/** Flushes the App's initial `loadPersistedState()`/`loadAiSettings()` microtasks. */
async function flushLoad(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

function openSettings(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
}

beforeEach(() => {
  installFakeChromeStorage();
  createMessageMock.mockReset();
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

  it('cancels a profile rename on Escape without committing it', async () => {
    render(<App />);
    await flushLoad();

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const renameInput = screen.getByLabelText('Resume profile name');
    fireEvent.change(renameInput, { target: { value: 'Should not save' } });
    fireEvent.keyDown(renameInput, { key: 'Escape' });

    expect(
      screen.queryByLabelText('Resume profile name'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'My Resume' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Should not save' }),
    ).not.toBeInTheDocument();
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

  it('triggers a TXT download when the export button is clicked', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    // jsdom doesn't implement the `download` attribute; without this it logs
    // a "not implemented: navigation" warning when the anchor is clicked.
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    render(<App />);
    await flushLoad();

    fireEvent.click(screen.getByRole('checkbox', { name: 'TXT' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledOnce();
    });
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('imports a resume from a JSON file as a new profile', async () => {
    const imported = createBlankResume();
    imported.contact.fullName = 'Taylor Kim';
    const file = new File([exportResumeAsJson(imported)], 'taylor-kim.json', {
      type: 'application/json',
    });

    render(<App />);
    await flushLoad();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Import JSON'), {
        target: { files: [file] },
      });
      await Promise.resolve();
    });

    expect(
      screen.getByRole('heading', { name: 'Taylor Kim', level: 1 }),
    ).toBeInTheDocument();
    const select = screen.getByLabelText(
      'Active resume profile',
    ) as HTMLSelectElement;
    expect(select.options).toHaveLength(2);
    expect(
      screen.getByRole('option', { name: 'taylor-kim' }),
    ).toBeInTheDocument();
  });

  it('shows an error when an invalid file is imported', async () => {
    const file = new File(['not json'], 'broken.json', {
      type: 'application/json',
    });

    render(<App />);
    await flushLoad();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Import JSON'), {
        target: { files: [file] },
      });
      await Promise.resolve();
    });

    expect(
      screen.getByText('That file is not valid JSON.'),
    ).toBeInTheDocument();
  });

  it('shows an API key setup form until AI suggestions are configured', async () => {
    render(<App />);
    await flushLoad();
    openSettings();

    expect(screen.getByLabelText('Anthropic API key')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /improve summary/i }),
    ).not.toBeInTheDocument();
  });

  it('unlocks AI suggestion actions after saving an API key', async () => {
    render(<App />);
    await flushLoad();
    openSettings();

    fireEvent.change(screen.getByLabelText('Anthropic API key'), {
      target: { value: 'sk-ant-test-key' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save key' }));
      await Promise.resolve();
    });

    expect(
      screen.getByRole('button', { name: /improve summary/i }),
    ).toBeInTheDocument();
    expect(createMessageMock).not.toHaveBeenCalled();
  });

  it('applies an AI-suggested summary rewrite to the resume', async () => {
    createMessageMock.mockResolvedValueOnce({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'A sharper, rewritten summary.' }],
    });

    render(<App />);
    await flushLoad();
    openSettings();

    fireEvent.change(screen.getByLabelText('Anthropic API key'), {
      target: { value: 'sk-ant-test-key' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save key' }));
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /improve summary/i }));
      await Promise.resolve();
    });

    expect(
      screen.getByText('A sharper, rewritten summary.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByLabelText('Professional summary')).toHaveValue(
      'A sharper, rewritten summary.',
    );
  });
});
