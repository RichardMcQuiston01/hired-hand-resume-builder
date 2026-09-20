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
  const [pendingFormat, setPendingFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(
    formatId: string,
    config: ExportFormatConfig,
  ): Promise<void> {
    setError(null);
    setPendingFormat(formatId);

    try {
      const blob = await config.generate(resume);
      downloadBlob(blob, `${resumeFileBaseName(resume)}.${config.extension}`);
    } catch (exportError: unknown) {
      console.error(`Failed to export resume as ${config.label}.`, exportError);
      setError(`Failed to export as ${config.label}. Try again.`);
    } finally {
      setPendingFormat(null);
    }
  }

  return (
    <section className="flex flex-col gap-3 border-t border-slate-200 p-4">
      <h2 className="text-base font-semibold text-slate-900">Export</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(EXPORT_FORMATS).map(([formatId, config]) => (
          <button
            key={formatId}
            type="button"
            disabled={pendingFormat !== null}
            onClick={() => {
              void handleExport(formatId, config);
            }}
            className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {pendingFormat === formatId ? 'Exporting…' : config.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
