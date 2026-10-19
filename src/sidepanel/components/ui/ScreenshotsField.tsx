import { useState } from 'react';
import type { ChangeEvent, ReactElement } from 'react';

import {
  createBlankScreenshot,
  type Screenshot,
} from '@richardmcquiston01/ats-resume-export';
import {
  ACCEPTED_IMAGE_TYPES,
  readImageFileAsDataUrl,
} from '../../utils/readImageFile';
import { TextField } from './TextField';

/** Keeps a handful of screenshots per project from exhausting storage. */
export const MAX_SCREENSHOTS_PER_PROJECT = 4;

interface ScreenshotsFieldProps {
  /** Used to give each project's file input a unique accessible name. */
  projectName: string;
  screenshots: Screenshot[];
  onChange: (screenshots: Screenshot[]) => void;
}

export function ScreenshotsField({
  projectName,
  screenshots,
  onChange,
}: ScreenshotsFieldProps): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const displayName: string = projectName.trim() || 'untitled project';
  const isAtLimit: boolean = screenshots.length >= MAX_SCREENSHOTS_PER_PROJECT;

  async function handleFileSelected(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const input: HTMLInputElement = event.target;
    const file: File | undefined = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const result = await readImageFileAsDataUrl(file);
    if (!result.success) {
      setError(result.error);
      return;
    }

    setError(null);
    onChange([
      ...screenshots,
      { ...createBlankScreenshot(), dataUrl: result.dataUrl },
    ]);
  }

  function updateScreenshot(index: number, next: Screenshot): void {
    onChange(
      screenshots.map((screenshot, i) => (i === index ? next : screenshot)),
    );
  }

  function removeScreenshot(index: number): void {
    onChange(screenshots.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-900">Screenshots</span>
      {screenshots.map((screenshot, index) => (
        <div
          key={screenshot.id}
          className="flex items-start gap-3 rounded-md border border-border-subtle p-2"
        >
          <img
            src={screenshot.dataUrl}
            alt={screenshot.altText || `Screenshot ${index + 1} preview`}
            className="h-16 w-24 shrink-0 rounded object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <TextField
              label={`Screenshot ${index + 1} description`}
              required
              placeholder="What the screenshot shows"
              value={screenshot.altText}
              onChange={(altText) => {
                updateScreenshot(index, { ...screenshot, altText });
              }}
            />
            <button
              type="button"
              onClick={() => {
                removeScreenshot(index);
              }}
              aria-label={`Remove screenshot ${index + 1} from ${displayName}`}
              className="self-start text-xs text-danger-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink-600">
          {isAtLimit
            ? `Limit of ${MAX_SCREENSHOTS_PER_PROJECT} screenshots reached`
            : `Add a PNG, JPEG, or WebP image (up to ${MAX_SCREENSHOTS_PER_PROJECT}). WebP is converted to PNG.`}
        </span>
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          disabled={isAtLimit}
          aria-label={`Add screenshot to ${displayName}`}
          onChange={(event) => {
            void handleFileSelected(event);
          }}
          className="text-sm"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
