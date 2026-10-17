import { z } from 'zod';

import {
  checkExportStyle,
  DETAIL_PLACEMENTS,
  FONT_FAMILIES,
  HEADING_CASES,
  OUTCOME_PLACEMENTS,
  PAGE_SIZES,
  STYLE_PRESETS,
  validateExportStyle,
} from '@richardmcquiston01/ats-resume-export';
import type {
  ExportDetails,
  ExportStyleInput,
} from '@richardmcquiston01/ats-resume-export';

/** Bumped whenever the persisted shape below changes. */
export const EXPORT_STYLE_SCHEMA_VERSION = 1;

export const EXPORT_STYLE_STORAGE_KEY = 'hiredHand.exportStyle.v1';

export const NUMERIC_STYLE_KEYS = [
  'fontSize',
  'nameFontSize',
  'headingFontSize',
  'lineSpacing',
  'sectionSpacing',
  'entrySpacing',
  'margin',
] as const;

export type NumericStyleKey = (typeof NUMERIC_STYLE_KEYS)[number];

/**
 * What the user has chosen. Numeric options are kept as the text typed into
 * the field ("" = not set) so a half-typed value like "1." survives a render;
 * `resolveExportStyleSettings` turns them into numbers. The enum options use
 * "" for "not set" (the preset decides). The detail placements default to
 * "off" so settings saved before they existed still load.
 */
const exportStyleSettingsSchema = z.object({
  version: z.literal(EXPORT_STYLE_SCHEMA_VERSION),
  preset: z.enum(STYLE_PRESETS),
  fontFamily: z.enum(['', ...FONT_FAMILIES]),
  pageSize: z.enum(['', ...PAGE_SIZES]),
  headingCase: z.enum(['', ...HEADING_CASES]),
  fontSize: z.string(),
  nameFontSize: z.string(),
  headingFontSize: z.string(),
  lineSpacing: z.string(),
  sectionSpacing: z.string(),
  entrySpacing: z.string(),
  margin: z.string(),
  projectLinks: z.enum(DETAIL_PLACEMENTS).default('off'),
  projectTechStack: z.enum(DETAIL_PLACEMENTS).default('off'),
  projectOutcome: z.enum(OUTCOME_PLACEMENTS).default('off'),
  credentialUrl: z.enum(DETAIL_PLACEMENTS).default('off'),
});

export type ExportStyleSettings = z.infer<typeof exportStyleSettingsSchema>;

/** `standard` with nothing overridden is the exporters' built-in look. */
export const DEFAULT_EXPORT_STYLE_SETTINGS: ExportStyleSettings = {
  version: EXPORT_STYLE_SCHEMA_VERSION,
  preset: 'standard',
  fontFamily: '',
  pageSize: '',
  headingCase: '',
  fontSize: '',
  nameFontSize: '',
  headingFontSize: '',
  lineSpacing: '',
  sectionSpacing: '',
  entrySpacing: '',
  margin: '',
  projectLinks: 'off',
  projectTechStack: 'off',
  projectOutcome: 'off',
  credentialUrl: 'off',
};

export interface ResolvedExportStyleSettings {
  /** Always valid, so it can be passed straight to the exporters. */
  style: ExportStyleInput;
  /** Which project and certification details to print, and where. */
  details: ExportDetails;
  /** Options that were ignored, keyed by option name, each with why. */
  problems: Partial<Record<keyof ExportStyleInput, string>>;
  /** Readability notes about valid-but-risky choices; they never block an export. */
  warnings: string[];
}

/**
 * Turns the saved settings into a style the exporters accept. An option with
 * an invalid value (not a number, or outside the supported range) is left out
 * and reported, so a bad entry never blocks an export.
 */
export function resolveExportStyleSettings(
  settings: ExportStyleSettings,
): ResolvedExportStyleSettings {
  const problems: ResolvedExportStyleSettings['problems'] = {};
  const style: ExportStyleInput = { preset: settings.preset };

  if (settings.fontFamily !== '') {
    style.fontFamily = settings.fontFamily;
  }
  if (settings.pageSize !== '') {
    style.pageSize = settings.pageSize;
  }
  if (settings.headingCase !== '') {
    style.headingCase = settings.headingCase;
  }
  for (const key of NUMERIC_STYLE_KEYS) {
    const text: string = settings[key].trim();
    if (text === '') {
      continue;
    }
    const value: number = Number(text);
    if (Number.isFinite(value)) {
      style[key] = value;
    } else {
      problems[key] = `"${text}" is not a number.`;
    }
  }

  // Drop each out-of-range option and say why. The preset alone is always
  // valid, so this settles within one pass per option.
  for (let attempt = 0; attempt <= NUMERIC_STYLE_KEYS.length; attempt += 1) {
    const issues = validateExportStyle(style);
    if (issues.length === 0) {
      break;
    }
    for (const issue of issues) {
      const key: string | number | undefined = issue.path[0];
      if (typeof key === 'string' && key in style && key !== 'preset') {
        delete style[key as keyof ExportStyleInput];
        problems[key as keyof ExportStyleInput] = issue.message;
      }
    }
  }

  const warnings: string[] = checkExportStyle(style).map(
    (finding) => finding.message,
  );
  const details: ExportDetails = {
    projectLinks: settings.projectLinks,
    projectTechStack: settings.projectTechStack,
    projectOutcome: settings.projectOutcome,
    credentialUrl: settings.credentialUrl,
  };
  return { style, details, problems, warnings };
}

/**
 * Reads the saved export style from `chrome.storage.local`. Returns
 * `undefined` when nothing has been saved, or when the stored value fails
 * validation (callers should use the defaults in that case).
 */
export async function loadExportStyleSettings(): Promise<
  ExportStyleSettings | undefined
> {
  const stored = await chrome.storage.local.get(EXPORT_STYLE_STORAGE_KEY);
  const raw: unknown = stored[EXPORT_STYLE_STORAGE_KEY];

  if (raw === undefined) {
    return undefined;
  }

  const result = exportStyleSettingsSchema.safeParse(raw);
  if (!result.success) {
    console.error('Ignoring corrupted export style storage.', result.error);
    return undefined;
  }

  return result.data;
}

/** Saves the export style to `chrome.storage.local`. */
export async function saveExportStyleSettings(
  settings: ExportStyleSettings,
): Promise<void> {
  await chrome.storage.local.set({ [EXPORT_STYLE_STORAGE_KEY]: settings });
}
