import { useState } from 'react';
import type { ReactElement } from 'react';

interface SettingsPanelProps {
  apiKey: string | null;
  onSaveApiKey: (apiKey: string) => Promise<void>;
  onForgetApiKey: () => Promise<void>;
}

const SMALL_BUTTON_CLASS =
  'self-start rounded border border-border-subtle px-2 py-1 text-xs font-medium text-ink-900 hover:bg-white disabled:cursor-not-allowed disabled:text-ink-400';

export function SettingsPanel({
  apiKey,
  onSaveApiKey,
  onForgetApiKey,
}: SettingsPanelProps): ReactElement {
  const [keyDraft, setKeyDraft] = useState('');

  async function handleSaveKey(): Promise<void> {
    if (!keyDraft.trim()) {
      return;
    }
    await onSaveApiKey(keyDraft);
    setKeyDraft('');
  }

  return (
    <section
      aria-label="Settings"
      className="flex flex-col gap-3 border-b border-border-subtle bg-surface-50 p-4"
    >
      <h2 className="text-base font-semibold text-ink-900">Settings</h2>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-ink-900">
          Anthropic API key
        </h3>
        <p className="text-sm text-ink-600">
          Used by AI Suggestions to send your resume text to Anthropic&apos;s
          API — only when you click a suggestion button, never automatically.{' '}
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

        {apiKey ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ink-900">API key is saved.</span>
            <button
              type="button"
              onClick={() => {
                void onForgetApiKey();
              }}
              className="text-xs font-medium text-ink-600 hover:underline"
            >
              Forget API key
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={keyDraft}
              onChange={(event) => {
                setKeyDraft(event.target.value);
              }}
              placeholder="sk-ant-..."
              aria-label="Anthropic API key"
              className="min-w-0 flex-1 rounded border border-border-subtle px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        )}
      </div>
    </section>
  );
}
