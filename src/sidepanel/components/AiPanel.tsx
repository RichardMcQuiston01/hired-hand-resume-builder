import { useState } from 'react';
import type { ReactElement } from 'react';

import {
  suggestBulletRewrite,
  suggestKeywordGaps,
  suggestSummary,
} from '../../lib/ai';
import type { Resume } from '../../lib/resume';
import { TextAreaField } from './ui/TextAreaField';

interface AiPanelProps {
  resume: Resume;
  apiKey: string | null;
  onApplySummary: (summary: string) => void;
}

const BUTTON_CLASS =
  'self-start rounded bg-accent-600 px-3 py-1 text-sm font-medium text-on-accent hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-ink-400';
const SMALL_BUTTON_CLASS =
  'self-start rounded border border-border-subtle px-2 py-1 text-xs font-medium text-ink-900 hover:bg-white disabled:cursor-not-allowed disabled:text-ink-400';
const RESULT_CLASS =
  'flex flex-col gap-2 rounded border border-border-subtle bg-surface-50 p-2 text-sm';

export function AiPanel({
  resume,
  apiKey,
  onApplySummary,
}: AiPanelProps): ReactElement {
  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(
    null,
  );
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const [bulletDraft, setBulletDraft] = useState('');
  const [bulletSuggestion, setBulletSuggestion] = useState<string | null>(null);
  const [bulletError, setBulletError] = useState<string | null>(null);
  const [isBulletLoading, setIsBulletLoading] = useState(false);
  const [isBulletCopied, setIsBulletCopied] = useState(false);

  const [gapJobDescription, setGapJobDescription] = useState('');
  const [gapSuggestion, setGapSuggestion] = useState<string | null>(null);
  const [gapError, setGapError] = useState<string | null>(null);
  const [isGapLoading, setIsGapLoading] = useState(false);

  async function handleImproveSummary(): Promise<void> {
    if (!apiKey) {
      return;
    }
    setSummaryError(null);
    setSummarySuggestion(null);
    setIsSummaryLoading(true);
    const result = await suggestSummary(resume, apiKey);
    setIsSummaryLoading(false);
    if (result.success) {
      setSummarySuggestion(result.text);
    } else {
      setSummaryError(result.error);
    }
  }

  function handleApplySummary(): void {
    if (!summarySuggestion) {
      return;
    }
    onApplySummary(summarySuggestion);
    setSummarySuggestion(null);
  }

  async function handleImproveBullet(): Promise<void> {
    const draft = bulletDraft.trim();
    if (!apiKey || !draft) {
      return;
    }
    const mostRecentRole = resume.experience[0];
    setBulletError(null);
    setBulletSuggestion(null);
    setIsBulletCopied(false);
    setIsBulletLoading(true);
    const result = await suggestBulletRewrite(
      draft,
      { title: mostRecentRole?.title, company: mostRecentRole?.company },
      apiKey,
    );
    setIsBulletLoading(false);
    if (result.success) {
      setBulletSuggestion(result.text);
    } else {
      setBulletError(result.error);
    }
  }

  async function handleCopyBullet(): Promise<void> {
    if (!bulletSuggestion) {
      return;
    }
    try {
      await navigator.clipboard.writeText(bulletSuggestion);
      setIsBulletCopied(true);
    } catch (error: unknown) {
      console.error('Failed to copy the suggested bullet.', error);
      setBulletError(
        'Could not copy to the clipboard. Select and copy manually.',
      );
    }
  }

  async function handleSuggestGaps(): Promise<void> {
    const jobDescription = gapJobDescription.trim();
    if (!apiKey || !jobDescription) {
      return;
    }
    setGapError(null);
    setGapSuggestion(null);
    setIsGapLoading(true);
    const result = await suggestKeywordGaps(resume, jobDescription, apiKey);
    setIsGapLoading(false);
    if (result.success) {
      setGapSuggestion(result.text);
    } else {
      setGapError(result.error);
    }
  }

  if (!apiKey) {
    return (
      <section className="flex flex-col gap-3 border-t border-border-subtle p-4">
        <h2 className="text-base font-semibold text-ink-900">AI Suggestions</h2>
        <p className="text-sm text-ink-600">
          Get AI-assisted summary/bullet rewrites and keyword-gap suggestions
          using your own Anthropic API key. Configure your key in{' '}
          <span className="font-medium">Settings</span> (the gear icon at the
          top of the window) to turn this on.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 border-t border-border-subtle p-4">
      <h2 className="text-base font-semibold text-ink-900">AI Suggestions</h2>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-ink-900">Improve summary</h3>
        <button
          type="button"
          disabled={isSummaryLoading}
          onClick={() => {
            void handleImproveSummary();
          }}
          className={BUTTON_CLASS}
        >
          {isSummaryLoading ? 'Thinking…' : '✨ Improve summary'}
        </button>
        {summaryError && (
          <p role="alert" className="text-sm text-danger-600">
            {summaryError}
          </p>
        )}
        {summarySuggestion && (
          <div aria-live="polite" className={RESULT_CLASS}>
            <p>{summarySuggestion}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplySummary}
                className={SMALL_BUTTON_CLASS}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setSummarySuggestion(null);
                }}
                className="text-xs text-ink-400 hover:underline"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-ink-900">
          Improve a bullet point
        </h3>
        <TextAreaField
          label="Bullet to improve"
          value={bulletDraft}
          onChange={(value) => {
            setBulletDraft(value);
            setIsBulletCopied(false);
          }}
          placeholder="Paste a highlight/bullet to rewrite..."
          rows={2}
        />
        <button
          type="button"
          disabled={isBulletLoading || !bulletDraft.trim()}
          onClick={() => {
            void handleImproveBullet();
          }}
          className={BUTTON_CLASS}
        >
          {isBulletLoading ? 'Thinking…' : '✨ Improve bullet'}
        </button>
        {bulletError && (
          <p role="alert" className="text-sm text-danger-600">
            {bulletError}
          </p>
        )}
        {bulletSuggestion && (
          <div aria-live="polite" className={RESULT_CLASS}>
            <p>{bulletSuggestion}</p>
            <button
              type="button"
              onClick={() => {
                void handleCopyBullet();
              }}
              className={SMALL_BUTTON_CLASS}
            >
              {isBulletCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-ink-900">
          Keyword gap suggestions
        </h3>
        <TextAreaField
          label="Target job description"
          value={gapJobDescription}
          onChange={setGapJobDescription}
          placeholder="Paste a job description to find gaps against..."
          rows={4}
        />
        <button
          type="button"
          disabled={isGapLoading || !gapJobDescription.trim()}
          onClick={() => {
            void handleSuggestGaps();
          }}
          className={BUTTON_CLASS}
        >
          {isGapLoading ? 'Thinking…' : '✨ Suggest fixes'}
        </button>
        {gapError && (
          <p role="alert" className="text-sm text-danger-600">
            {gapError}
          </p>
        )}
        {gapSuggestion && (
          <pre
            aria-live="polite"
            className={`${RESULT_CLASS} whitespace-pre-wrap font-sans`}
          >
            {gapSuggestion}
          </pre>
        )}
      </div>
    </section>
  );
}
