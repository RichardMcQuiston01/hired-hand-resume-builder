import { useState } from 'react';
import type { ReactElement } from 'react';

// DOCX and PDF come from their own package entries (not the main one) so the
// dynamic imports below actually split docx/pdf-lib into separate chunks
// instead of pulling them into the initial side panel bundle.
import {
  exportResumeAsHtml,
  exportResumeAsJson,
  exportResumeAsPlainText,
  resumeFileBaseName,
} from '@richardmcquiston01/ats-resume-export';
import type {
  Resume,
  StyleOption,
} from '@richardmcquiston01/ats-resume-export';
import { downloadBlob } from '../utils/downloadBlob';
import { useExportStyle } from '../hooks/useExportStyle';
import { ExportStyleFields } from './ExportStyleFields';
import { DownloadIcon } from './icons';

interface ExportPanelProps {
  resume: Resume;
}

interface ExportFormatConfig {
  label: string;
  extension: string;
  generate: (resume: Resume, style: StyleOption) => Promise<Blob>;
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
    generate: (resume, style) =>
      Promise.resolve(
        new Blob([exportResumeAsHtml(resume, { style })], {
          type: 'text/html',
        }),
      ),
  },
  docx: {
    label: 'DOCX',
    extension: 'docx',
    generate: async (resume, style) => {
      const { exportResumeAsDocx } =
        await import('@richardmcquiston01/ats-resume-export/docx');
      return exportResumeAsDocx(resume, { style });
    },
  },
  pdf: {
    label: 'PDF',
    extension: 'pdf',
    generate: async (resume, style) => {
      const { exportResumeAsPdf } =
        await import('@richardmcquiston01/ats-resume-export/pdf');
      return exportResumeAsPdf(resume, { style });
    },
  },
};

export function ExportPanel({ resume }: ExportPanelProps): ReactElement {
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
    () => new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportStyle = useExportStyle();

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
        const blob = await config.generate(resume, exportStyle.resolved.style);
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
      <details className="rounded border border-border-subtle px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-ink-900">
          Style
        </summary>
        <div className="mt-3">
          <ExportStyleFields
            settings={exportStyle.settings}
            resolved={exportStyle.resolved}
            onChange={exportStyle.updateSettings}
            onReset={exportStyle.resetSettings}
          />
        </div>
      </details>
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
