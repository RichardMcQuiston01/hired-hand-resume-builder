import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFixtureResume } from '@richardmcquiston01/ats-resume-export';
import { installFakeChromeStorage } from '../../test/chromeStorageFake';
import {
  EXPORT_STYLE_STORAGE_KEY,
  loadExportStyleSettings,
} from '../../lib/export/styleSettings';
import { ExportPanel } from './ExportPanel';

const downloadBlob = vi.hoisted(() => vi.fn());
vi.mock('../utils/downloadBlob', () => ({ downloadBlob }));

/** The text of the first file handed to `downloadBlob`. */
async function readDownloadedText(): Promise<string> {
  const firstCall: unknown[] | undefined = downloadBlob.mock.calls[0];
  if (!(firstCall?.[0] instanceof Blob)) {
    throw new Error('Expected downloadBlob to be called with a Blob.');
  }
  return firstCall[0].text();
}

describe('ExportPanel style options', () => {
  beforeEach(() => {
    installFakeChromeStorage();
    downloadBlob.mockReset();
  });

  it('exports HTML with the chosen preset and font', async () => {
    render(<ExportPanel resume={createFixtureResume()} />);

    fireEvent.click(screen.getByText('Style and details'));
    fireEvent.change(screen.getByLabelText('Font'), {
      target: { value: 'serif' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'HTML' }));
    fireEvent.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledTimes(1);
    });
    const html: string = await readDownloadedText();
    expect(html).toContain('Times');
  });

  it('leaves HTML unchanged from the built-in look when no style is chosen', async () => {
    render(<ExportPanel resume={createFixtureResume()} />);

    fireEvent.click(screen.getByRole('button', { name: 'HTML' }));
    fireEvent.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledTimes(1);
    });
    const html: string = await readDownloadedText();
    expect(html).not.toContain('Times');
  });

  it('saves a chosen style and restores it on the next open', async () => {
    const { unmount } = render(<ExportPanel resume={createFixtureResume()} />);

    fireEvent.click(screen.getByText('Style and details'));
    fireEvent.change(screen.getByLabelText('Preset'), {
      target: { value: 'comfortable' },
    });
    await waitFor(async () => {
      await expect(loadExportStyleSettings()).resolves.toMatchObject({
        preset: 'comfortable',
      });
    });
    unmount();

    render(<ExportPanel resume={createFixtureResume()} />);
    fireEvent.click(screen.getByText('Style and details'));

    await waitFor(() => {
      expect(screen.getByLabelText('Preset')).toHaveValue('comfortable');
    });
  });

  it('reports an out-of-range value and still exports', async () => {
    render(<ExportPanel resume={createFixtureResume()} />);

    fireEvent.click(screen.getByText('Style and details'));
    fireEvent.change(screen.getByLabelText(/Text size/), {
      target: { value: '99' },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('8 to 16');

    fireEvent.click(screen.getByRole('button', { name: 'TXT' }));
    fireEvent.click(screen.getByRole('button', { name: /download/i }));
    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledTimes(1);
    });
  });

  it('resets every choice to the defaults', async () => {
    render(<ExportPanel resume={createFixtureResume()} />);

    fireEvent.click(screen.getByText('Style and details'));
    fireEvent.change(screen.getByLabelText('Preset'), {
      target: { value: 'compact' },
    });
    fireEvent.change(screen.getByLabelText(/Margins/), {
      target: { value: '40' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(screen.getByLabelText('Preset')).toHaveValue('standard');
    expect(screen.getByLabelText(/Margins/)).toHaveValue('');
    await act(async () => {
      await Promise.resolve();
    });
    const stored = (await chrome.storage.local.get(EXPORT_STYLE_STORAGE_KEY))[
      EXPORT_STYLE_STORAGE_KEY
    ];
    expect(stored).toMatchObject({ preset: 'standard', margin: '' });
  });

  it('prints project and certification details only once they are switched on', async () => {
    render(<ExportPanel resume={createFixtureResume()} />);
    fireEvent.click(screen.getByRole('button', { name: 'TXT' }));

    fireEvent.click(screen.getByRole('button', { name: /download/i }));
    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledTimes(1);
    });
    expect(await readDownloadedText()).not.toContain('Tech stack:');

    downloadBlob.mockReset();
    fireEvent.click(screen.getByText('Style and details'));
    fireEvent.change(screen.getByLabelText('Project tech stack'), {
      target: { value: 'below' },
    });
    fireEvent.change(screen.getByLabelText('Project outcome'), {
      target: { value: 'below' },
    });
    fireEvent.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledTimes(1);
    });
    const text: string = await readDownloadedText();
    expect(text).toContain('Tech stack: TypeScript');
    expect(text).toContain('Outcome: ');
    expect(text).not.toContain('Link:');
  });

  it('offers only off and its own line for the project outcome', () => {
    render(<ExportPanel resume={createFixtureResume()} />);

    fireEvent.click(screen.getByText('Style and details'));

    const labels: string[] = Array.from(
      (screen.getByLabelText('Project outcome') as HTMLSelectElement).options,
    ).map((option) => option.textContent ?? '');
    expect(labels).toEqual(['Off', 'On its own line']);
  });
});
