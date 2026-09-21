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
    <div className="flex flex-col items-end gap-1">
      <input
        id={inputId}
        type="file"
        accept="application/json,.json"
        disabled={isImporting}
        onChange={(event) => {
          void handleFileChange(event);
        }}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className="inline-block cursor-pointer rounded border border-border-subtle px-3 py-1 text-sm font-medium text-ink-900 hover:bg-surface-50 peer-focus-visible:ring-2 peer-focus-visible:ring-ink-400 aria-disabled:cursor-not-allowed aria-disabled:text-ink-400"
        aria-disabled={isImporting}
      >
        {isImporting ? 'Importing…' : 'Import JSON'}
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
