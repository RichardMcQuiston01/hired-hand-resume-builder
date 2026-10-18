import { useState } from 'react';
import type { ReactElement } from 'react';

import type { Resume } from '@richardmcquiston01/ats-resume-export';
import {
  portfolioFileBaseName,
  selectPortfolioContent,
} from '../../lib/export/portfolioContent';
import type { PortfolioContent } from '../../lib/export/portfolioContent';
import { exportPortfolioAsHtml } from '../../lib/export/toPortfolioHtml';
import { useExportStyle } from '../hooks/useExportStyle';
import { downloadBlob } from '../utils/downloadBlob';
import { DownloadIcon } from './icons';

interface PortfolioExportPanelProps {
  resume: Resume;
}

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

/** Describes what the download will contain, so nothing is a surprise. */
function describeContent(content: PortfolioContent): string {
  const parts: string[] = [
    `${pluralize(content.featuredProjects.length, 'featured project')}`,
    `${pluralize(content.publishableRecommendations.length, 'recommendation')}`,
  ];
  const summary = `Includes ${parts.join(' and ')}.`;
  return content.withheldRecommendationCount > 0
    ? `${summary} ${pluralize(content.withheldRecommendationCount, 'recommendation')} left out (no author permission).`
    : summary;
}

export function PortfolioExportPanel({
  resume,
}: PortfolioExportPanelProps): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportStyle = useExportStyle();
  const content: PortfolioContent = selectPortfolioContent(resume);
  const canExport: boolean = content.featuredProjects.length > 0;

  function handleDownload(): void {
    setError(null);
    setNotice(null);
    try {
      const html: string = exportPortfolioAsHtml(resume, {
        style: exportStyle.resolved.style,
      });
      downloadBlob(
        new Blob([html], { type: 'text/html' }),
        `${portfolioFileBaseName(resume)}.html`,
      );
    } catch (exportError: unknown) {
      console.error('Failed to export the portfolio as HTML.', exportError);
      const reason: string =
        exportError instanceof Error
          ? exportError.message
          : String(exportError);
      setError(`Failed to export the portfolio: ${reason}`);
    }
  }

  async function handleDownloadPdf(): Promise<void> {
    setError(null);
    setNotice(null);
    setIsExportingPdf(true);
    try {
      // pdf-lib is large; load it only when a PDF is actually requested.
      const { exportPortfolioAsPdf } =
        await import('../../lib/export/toPortfolioPdf');
      const result = await exportPortfolioAsPdf(resume, {
        style: exportStyle.resolved.style,
      });
      downloadBlob(result.blob, `${portfolioFileBaseName(resume)}.pdf`);
      if (result.skippedScreenshotCount > 0) {
        setNotice(
          `${pluralize(result.skippedScreenshotCount, 'screenshot')} left out of the PDF (WebP images can't be embedded). Use PNG or JPEG, or export HTML to keep them.`,
        );
      }
    } catch (exportError: unknown) {
      console.error('Failed to export the portfolio as PDF.', exportError);
      const reason: string =
        exportError instanceof Error
          ? exportError.message
          : String(exportError);
      setError(`Failed to export the portfolio as PDF: ${reason}`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-subtle p-3">
      <h3 className="text-sm font-semibold text-ink-900">Export portfolio</h3>
      <p className="text-sm text-ink-600">
        {canExport
          ? describeContent(content)
          : 'Feature at least one project above to export a portfolio.'}
      </p>
      <button
        type="button"
        disabled={!canExport}
        onClick={handleDownload}
        className="flex w-full items-center justify-center gap-2 rounded bg-accent-600 px-3 py-2 text-sm font-medium text-on-accent hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-ink-400"
      >
        <DownloadIcon />
        Download portfolio (HTML)
      </button>
      <button
        type="button"
        disabled={!canExport || isExportingPdf}
        onClick={() => {
          void handleDownloadPdf();
        }}
        className="flex w-full items-center justify-center gap-2 rounded border border-accent-600 px-3 py-2 text-sm font-medium text-accent-700 hover:bg-surface-100 disabled:cursor-not-allowed disabled:border-border-subtle disabled:text-ink-400"
      >
        <DownloadIcon />
        {isExportingPdf ? 'Creating PDF…' : 'Download portfolio (PDF)'}
      </button>
      {notice && (
        <p role="status" className="text-sm text-ink-600">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
