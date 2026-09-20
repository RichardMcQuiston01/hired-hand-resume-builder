import { useId, useState } from 'react';
import type { ChangeEvent, ReactElement } from 'react';

import { importResumeFromJson } from '../../lib/import';
import type { Resume } from '../../lib/resume';

interface ImportPanelProps {
  onImport: (resume: Resume, name: string) => void;
}

function baseNameFromFileName(fileName: string): string {
  return fileName.replace(/\.json$/i, '').trim() || 'Imported resume';
}

export function ImportPanel({ onImport }: ImportPanelProps): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const inputId = useId();

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const text = await file.text();
      const result = importResumeFromJson(text);
      if (result.success) {
        onImport(result.resume, baseNameFromFileName(file.name));
      } else {
        setError(result.error);
      }
    } catch (importError: unknown) {
      console.error('Failed to read the selected file.', importError);
      setError('Failed to read the selected file. Try again.');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 border-t border-slate-200 p-4">
      <h2 className="text-base font-semibold text-slate-900">Import</h2>
      <div>
        <label
          htmlFor={inputId}
          className="inline-block cursor-pointer rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 aria-disabled:cursor-not-allowed aria-disabled:text-slate-400"
          aria-disabled={isImporting}
        >
          {isImporting ? 'Importing…' : 'Import JSON'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="application/json,.json"
          disabled={isImporting}
          onChange={(event) => {
            void handleFileChange(event);
          }}
          className="sr-only"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
