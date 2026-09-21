import { useState } from 'react';
import type { ReactElement } from 'react';

// Import each generator from its own module (not the barrel) so the
// dynamic imports below for docx/pdf-lib actually split into separate
// chunks instead of being pulled in statically through index.ts.
import { resumeFileBaseName } from '../../lib/export/fileNames';
import { exportResumeAsHtml } from '../../lib/export/toHtml';
import { exportResumeAsJson } from '../../lib/export/toJson';
import { exportResumeAsPlainText } from '../../lib/export/toPlainText';
import type { Resume } from '../../lib/resume';
import { downloadBlob } from '../utils/downloadBlob';
import { DownloadIcon } from './icons';

interface ExportPanelProps {
  resume: Resume;
}

interface ExportFormatConfig {
  label: string;
  extension: string;
  generate: (resume: Resume) => Promise<Blob>;
}

// The docx and pdf-lib libraries are large; import them lazily so opening
// the side panel doesn't pay for them until the user actually exports.
const EXPORT_FORMATS: Record<string, ExportFormatConfig> = {
  txt: {
    label: 'TXT',
    extension: 'txt',
    generate: (resume) =>
      Promise.resolve(
        new Blob([exportResumeAsPlainText(resume)], { type: 'text/plain' }),
      ),
  },
  json: {
    label: 'JSON',
    extension: 'json',
    generate: (resume) =>
      Promise.resolve(
        new Blob([exportResumeAsJson(resume)], { type: 'application/json' }),
      ),
  },
  html: {
    label: 'HTML',
    extension: 'html',
    generate: (resume) =>
      Promise.resolve(
        new Blob([exportResumeAsHtml(resume)], { type: 'text/html' }),
      ),
  },
  docx: {
    label: 'DOCX',
    extension: 'docx',
    generate: async (resume) => {
      const { exportResumeAsDocx } = await import('../../lib/export/toDocx');
      return exportResumeAsDocx(resume);
    },
  },
  pdf: {
    label: 'PDF',
    extension: 'pdf',
    generate: async (resume) => {
      const { exportResumeAsPdf } = await import('../../lib/export/toPdf');
      return exportResumeAsPdf(resume);
    },
  },
};

export function ExportPanel({ resume }: ExportPanelProps): ReactElement {
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
    () => new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFormat(formatId: string): void {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(formatId)) {
        next.delete(formatId);
      } else {
        next.add(formatId);
      }
      return next;
    });
  }

  async function handleDownload(): Promise<void> {
    if (selectedFormats.size === 0) {
      return;
    }
    setError(null);
    setIsExporting(true);

    const failedLabels: string[] = [];
    for (const [formatId, config] of Object.entries(EXPORT_FORMATS)) {
      if (!selectedFormats.has(formatId)) {
        continue;
      }
      try {
        const blob = await config.generate(resume);
        downloadBlob(blob, `${resumeFileBaseName(resume)}.${config.extension}`);
      } catch (exportError: unknown) {
        console.error(
          `Failed to export resume as ${config.label}.`,
          exportError,
        );
        failedLabels.push(config.label);
      }
    }

    if (failedLabels.length > 0) {
      setError(`Failed to export as ${failedLabels.join(', ')}. Try again.`);
    }
    setIsExporting(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink-900">Export</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(EXPORT_FORMATS).map(([formatId, config]) => {
          const isSelected = selectedFormats.has(formatId);
          return (
            <button
              key={formatId}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                toggleFormat(formatId);
              }}
              className={
                isSelected
                  ? 'rounded-full border border-brand-500 bg-brand-500 px-3 py-1 text-sm font-medium text-white'
                  : 'rounded-full border border-border-subtle px-3 py-1 text-sm font-medium text-ink-900 hover:border-brand-500'
              }
            >
              {config.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={isExporting || selectedFormats.size === 0}
        onClick={() => {
          void handleDownload();
        }}
        className="flex w-full items-center justify-center gap-2 rounded bg-accent-600 px-3 py-2 text-sm font-medium text-on-accent hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-ink-400"
      >
        <DownloadIcon />
        {isExporting ? 'Downloading…' : 'Download'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
