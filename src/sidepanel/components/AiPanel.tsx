import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import {
  clearAiSettings,
  loadAiSettings,
  saveAiSettings,
  suggestBulletRewrite,
  suggestKeywordGaps,
  suggestSummary,
} from '../../lib/ai';
import type { Resume } from '../../lib/resume';
import { TextAreaField } from './ui/TextAreaField';

interface AiPanelProps {
  resume: Resume;
  onApplySummary: (summary: string) => void;
}

const BUTTON_CLASS =
  'self-start rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400';
const SMALL_BUTTON_CLASS =
  'self-start rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400';
const RESULT_CLASS =
  'flex flex-col gap-2 rounded border border-slate-200 bg-slate-50 p-2 text-sm';

export function AiPanel({
  resume,
  onApplySummary,
}: AiPanelProps): ReactElement {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState('');

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

  useEffect(() => {
    let cancelled = false;

    loadAiSettings()
      .then((settings) => {
        if (!cancelled) {
          setApiKey(settings?.anthropicApiKey ?? null);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load AI settings from storage.', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveKey(): Promise<void> {
    const trimmed = keyDraft.trim();
    if (!trimmed) {
      return;
    }
    await saveAiSettings(trimmed);
    setApiKey(trimmed);
    setKeyDraft('');
  }

  async function handleForgetKey(): Promise<void> {
    await clearAiSettings();
    setApiKey(null);
  }

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
      <section className="flex flex-col gap-3 border-t border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-900">
          AI Suggestions
        </h2>
        <p className="text-sm text-slate-600">
          Get AI-assisted summary/bullet rewrites and keyword-gap suggestions
          using your own Anthropic API key. Your resume content is sent to
          Anthropic&apos;s API only when you click a suggestion button below —
          never automatically.{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Get an API key
          </a>
          .
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={keyDraft}
            onChange={(event) => {
              setKeyDraft(event.target.value);
            }}
            placeholder="sk-ant-..."
            aria-label="Anthropic API key"
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <button
            type="button"
            disabled={!keyDraft.trim()}
            onClick={() => {
              void handleSaveKey();
            }}
            className={SMALL_BUTTON_CLASS}
          >
            Save key
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 border-t border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          AI Suggestions
        </h2>
        <button
          type="button"
          onClick={() => {
            void handleForgetKey();
          }}
          className="text-xs font-medium text-slate-600 hover:underline"
        >
          Forget API key
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-slate-700">
          Improve summary
        </h3>
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
          <p role="alert" className="text-sm text-red-600">
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
                className="text-xs text-slate-500 hover:underline"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-slate-700">
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
          <p role="alert" className="text-sm text-red-600">
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
        <h3 className="text-sm font-semibold text-slate-700">
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
          <p role="alert" className="text-sm text-red-600">
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
