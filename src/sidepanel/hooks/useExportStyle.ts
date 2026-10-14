import { useEffect, useRef, useState } from 'react';

import {
  DEFAULT_EXPORT_STYLE_SETTINGS,
  loadExportStyleSettings,
  resolveExportStyleSettings,
  saveExportStyleSettings,
} from '../../lib/export/styleSettings';
import type {
  ExportStyleSettings,
  ResolvedExportStyleSettings,
} from '../../lib/export/styleSettings';

export interface UseExportStyleResult {
  settings: ExportStyleSettings;
  resolved: ResolvedExportStyleSettings;
  updateSettings: (changes: Partial<ExportStyleSettings>) => void;
  resetSettings: () => void;
}

/**
 * The user's export style choices: in-memory state, loaded once from
 * `chrome.storage.local` and saved on every change. A failed load or save is
 * logged and never blocks exporting (the defaults, or the unsaved choices,
 * still apply for this session).
 */
export function useExportStyle(): UseExportStyleResult {
  const [settings, setSettings] = useState<ExportStyleSettings>(
    DEFAULT_EXPORT_STYLE_SETTINGS,
  );
  // Set once the user changes anything, so a slow initial load never
  // overwrites a choice they have already made.
  const hasEditedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    loadExportStyleSettings()
      .then((saved) => {
        if (!cancelled && saved && !hasEditedRef.current) {
          setSettings(saved);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load export style from storage.', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function persist(next: ExportStyleSettings): void {
    hasEditedRef.current = true;
    setSettings(next);
    saveExportStyleSettings(next).catch((error: unknown) => {
      console.error('Failed to save export style to storage.', error);
    });
  }

  return {
    settings,
    resolved: resolveExportStyleSettings(settings),
    updateSettings: (changes) => {
      persist({ ...settings, ...changes });
    },
    resetSettings: () => {
      persist(DEFAULT_EXPORT_STYLE_SETTINGS);
    },
  };
}
