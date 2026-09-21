import { useEffect, useState } from 'react';

import {
  clearAiSettings,
  loadAiSettings,
  saveAiSettings,
} from '../../lib/ai/settings';

export interface UseAiSettingsResult {
  /** `null` until the initial load from chrome.storage has settled. */
  apiKey: string | null;
  isLoaded: boolean;
  saveApiKey: (apiKey: string) => Promise<void>;
  forgetApiKey: () => Promise<void>;
}

/**
 * Manages the user's Anthropic API key: in-memory state, backed by
 * `chrome.storage.local` (loaded once on mount). Shared by the Settings
 * panel (where the key is entered/forgotten) and the AI Suggestions panel
 * (which only reads it).
 */
export function useAiSettings(): UseAiSettingsResult {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadAiSettings()
      .then((settings) => {
        if (!cancelled) {
          setApiKey(settings?.anthropicApiKey ?? null);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load AI settings from storage.', error);
        if (!cancelled) {
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveApiKey(nextApiKey: string): Promise<void> {
    const trimmed = nextApiKey.trim();
    if (!trimmed) {
      return;
    }
    await saveAiSettings(trimmed);
    setApiKey(trimmed);
  }

  async function forgetApiKey(): Promise<void> {
    await clearAiSettings();
    setApiKey(null);
  }

  return { apiKey, isLoaded, saveApiKey, forgetApiKey };
}
