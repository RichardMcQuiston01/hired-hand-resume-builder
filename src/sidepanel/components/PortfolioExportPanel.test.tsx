import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBlankResume,
  createFixtureResume,
} from '@richardmcquiston01/ats-resume-export';
import { installFakeChromeStorage } from '../../test/chromeStorageFake';
import { PortfolioExportPanel } from './PortfolioExportPanel';

const downloadBlob = vi.hoisted(() => vi.fn());
vi.mock('../utils/downloadBlob', () => ({ downloadBlob }));

describe('PortfolioExportPanel', () => {
  beforeEach(() => {
    installFakeChromeStorage();
    downloadBlob.mockReset();
  });

  it('disables the download until a project is featured', () => {
    render(<PortfolioExportPanel resume={createBlankResume()} />);

    expect(
      screen.getByRole('button', { name: /download portfolio \(html\)/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /download portfolio \(pdf\)/i }),
    ).toBeDisabled();
    expect(screen.getByText(/feature at least one project/i)).toBeVisible();
  });

  it('summarizes what will be exported and downloads an HTML file', async () => {
    render(<PortfolioExportPanel resume={createFixtureResume()} />);

    expect(
      screen.getByText('Includes 1 featured project and 1 recommendation.'),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', { name: /download portfolio \(html\)/i }),
    );

    expect(downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, fileName] = downloadBlob.mock.calls[0] as [Blob, string];
    expect(fileName).toMatch(/-portfolio\.html$/);
    expect(await blob.text()).toContain('<!DOCTYPE html>');
  });

  it('says how many recommendations are left out for lack of permission', () => {
    const resume = createFixtureResume();
    render(
      <PortfolioExportPanel
        resume={{
          ...resume,
          portfolio: {
            ...resume.portfolio,
            recommendations: resume.portfolio.recommendations.map((item) => ({
              ...item,
              hasAuthorPermission: false,
            })),
          },
        }}
      />,
    );

    expect(screen.getByText(/1 recommendation left out/)).toBeVisible();
  });

  it('downloads a PDF', async () => {
    render(<PortfolioExportPanel resume={createFixtureResume()} />);

    fireEvent.click(
      screen.getByRole('button', { name: /download portfolio \(pdf\)/i }),
    );

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledTimes(1);
    });
    const [blob, fileName] = downloadBlob.mock.calls[0] as [Blob, string];
    expect(fileName).toMatch(/-portfolio\.pdf$/);
    expect(blob.type).toBe('application/pdf');
  });
});
