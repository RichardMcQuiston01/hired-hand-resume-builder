import type { ReactElement } from 'react';

import {
  FONT_FAMILIES,
  HEADING_CASES,
  PAGE_SIZES,
  STYLE_LIMITS,
  STYLE_PRESETS,
} from '@richardmcquiston01/ats-resume-export';
import type { StylePreset } from '@richardmcquiston01/ats-resume-export';
import type {
  ExportStyleSettings,
  NumericStyleKey,
  ResolvedExportStyleSettings,
} from '../../lib/export/styleSettings';
import { SelectField } from './ui/SelectField';
import type { SelectOption } from './ui/SelectField';
import { TextField } from './ui/TextField';

interface ExportStyleFieldsProps {
  settings: ExportStyleSettings;
  resolved: ResolvedExportStyleSettings;
  onChange: (changes: Partial<ExportStyleSettings>) => void;
  onReset: () => void;
}

const PRESET_LABELS: Record<StylePreset, string> = {
  compact: 'Compact (fits more on a page)',
  standard: 'Standard (default)',
  comfortable: 'Comfortable (easier to read)',
};

const PRESET_OPTIONS: SelectOption[] = STYLE_PRESETS.map((preset) => ({
  value: preset,
  label: PRESET_LABELS[preset],
}));

const FONT_FAMILY_LABELS: Record<(typeof FONT_FAMILIES)[number], string> = {
  'sans-serif': 'Sans-serif (Arial)',
  serif: 'Serif (Times)',
  monospace: 'Monospace (Courier)',
};

const FONT_FAMILY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Preset default' },
  ...FONT_FAMILIES.map((family) => ({
    value: family,
    label: FONT_FAMILY_LABELS[family],
  })),
];

const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Format default' },
  ...PAGE_SIZES.map((size) => ({ value: size, label: size.toUpperCase() })),
];

const HEADING_CASE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Preset default' },
  ...HEADING_CASES.map((headingCase) => ({
    value: headingCase,
    label: headingCase === 'upper' ? 'UPPERCASE' : 'As written',
  })),
];

interface NumericFieldConfig {
  key: NumericStyleKey;
  label: string;
  unit: string;
}

const NUMERIC_FIELDS: NumericFieldConfig[] = [
  { key: 'fontSize', label: 'Text size', unit: 'pt' },
  { key: 'nameFontSize', label: 'Name size', unit: 'pt' },
  { key: 'headingFontSize', label: 'Heading size', unit: 'pt' },
  { key: 'lineSpacing', label: 'Line spacing', unit: '×' },
  { key: 'sectionSpacing', label: 'Space before sections', unit: 'pt' },
  { key: 'entrySpacing', label: 'Space between entries', unit: 'pt' },
  { key: 'margin', label: 'Margins', unit: 'pt' },
];

function isFontFamily(value: string): value is (typeof FONT_FAMILIES)[number] {
  return (FONT_FAMILIES as readonly string[]).includes(value);
}

function isPageSize(value: string): value is (typeof PAGE_SIZES)[number] {
  return (PAGE_SIZES as readonly string[]).includes(value);
}

function isHeadingCase(value: string): value is (typeof HEADING_CASES)[number] {
  return (HEADING_CASES as readonly string[]).includes(value);
}

function isPreset(value: string): value is StylePreset {
  return (STYLE_PRESETS as readonly string[]).includes(value);
}

/**
 * Presentation options for the HTML, DOCX, and PDF exports. The exporters keep
 * the output ATS-safe whatever is chosen (one column, real text, standard
 * fonts), so these only change how it reads for the people reviewing it.
 */
export function ExportStyleFields({
  settings,
  resolved,
  onChange,
  onReset,
}: ExportStyleFieldsProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-600">
        Applies to HTML, DOCX, and PDF. The layout stays a single column of
        plain text, so applicant tracking systems can still read it.
      </p>
      <div className="flex gap-2">
        <SelectField
          label="Preset"
          value={settings.preset}
          options={PRESET_OPTIONS}
          onChange={(value) => {
            if (isPreset(value)) {
              onChange({ preset: value });
            }
          }}
        />
      </div>
      <div className="flex gap-2">
        <SelectField
          label="Font"
          value={settings.fontFamily}
          options={FONT_FAMILY_OPTIONS}
          onChange={(value) => {
            onChange({ fontFamily: isFontFamily(value) ? value : '' });
          }}
        />
        <SelectField
          label="Headings"
          value={settings.headingCase}
          options={HEADING_CASE_OPTIONS}
          onChange={(value) => {
            onChange({ headingCase: isHeadingCase(value) ? value : '' });
          }}
        />
      </div>
      <div className="flex gap-2">
        <SelectField
          label="Paper size (DOCX, PDF)"
          value={settings.pageSize}
          options={PAGE_SIZE_OPTIONS}
          onChange={(value) => {
            onChange({ pageSize: isPageSize(value) ? value : '' });
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {NUMERIC_FIELDS.map(({ key, label, unit }) => {
          const limits = STYLE_LIMITS[key];
          const problem: string | undefined = resolved.problems[key];
          return (
            <div key={key} className="flex min-w-0 flex-col gap-1">
              <TextField
                label={`${label} (${unit})`}
                value={settings[key]}
                placeholder={`${limits.min}–${limits.max}`}
                onChange={(value) => {
                  onChange({ [key]: value });
                }}
              />
              {problem && (
                <p role="alert" className="text-xs text-danger-600">
                  {problem} Ignored; using the preset value.
                </p>
              )}
            </div>
          );
        })}
      </div>
      {resolved.warnings.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-ink-600">
          {resolved.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onReset}
        className="self-start rounded border border-border-subtle px-2 py-1 text-xs font-medium text-ink-900 hover:bg-white"
      >
        Reset to defaults
      </button>
    </div>
  );
}
