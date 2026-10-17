import { beforeEach, describe, expect, it } from 'vitest';

import { installFakeChromeStorage } from '../../test/chromeStorageFake';
import {
  DEFAULT_EXPORT_STYLE_SETTINGS,
  EXPORT_STYLE_STORAGE_KEY,
  loadExportStyleSettings,
  resolveExportStyleSettings,
  saveExportStyleSettings,
} from './styleSettings';
import type { ExportStyleSettings } from './styleSettings';

function withChanges(
  changes: Partial<ExportStyleSettings>,
): ExportStyleSettings {
  return { ...DEFAULT_EXPORT_STYLE_SETTINGS, ...changes };
}

describe('resolveExportStyleSettings', () => {
  it('resolves the defaults to the standard preset with nothing overridden', () => {
    const resolved = resolveExportStyleSettings(DEFAULT_EXPORT_STYLE_SETTINGS);

    expect(resolved.style).toEqual({ preset: 'standard' });
    expect(resolved.problems).toEqual({});
    expect(resolved.warnings).toEqual([]);
  });

  it('prints no extra details by default', () => {
    expect(
      resolveExportStyleSettings(DEFAULT_EXPORT_STYLE_SETTINGS).details,
    ).toEqual({
      projectLinks: 'off',
      projectTechStack: 'off',
      projectOutcome: 'off',
      credentialUrl: 'off',
    });
  });

  it('passes the chosen detail placements through', () => {
    const resolved = resolveExportStyleSettings(
      withChanges({
        projectLinks: 'below',
        projectTechStack: 'heading',
        projectOutcome: 'below',
        credentialUrl: 'heading',
      }),
    );

    expect(resolved.details).toEqual({
      projectLinks: 'below',
      projectTechStack: 'heading',
      projectOutcome: 'below',
      credentialUrl: 'heading',
    });
  });

  it('turns typed numbers and chosen options into a style', () => {
    const resolved = resolveExportStyleSettings(
      withChanges({
        preset: 'compact',
        fontFamily: 'serif',
        pageSize: 'a4',
        headingCase: 'upper',
        fontSize: '11',
        lineSpacing: ' 1.4 ',
        margin: '64',
      }),
    );

    expect(resolved.style).toEqual({
      preset: 'compact',
      fontFamily: 'serif',
      pageSize: 'a4',
      headingCase: 'upper',
      fontSize: 11,
      lineSpacing: 1.4,
      margin: 64,
    });
    expect(resolved.problems).toEqual({});
  });

  it('ignores and reports a value that is not a number', () => {
    const resolved = resolveExportStyleSettings(
      withChanges({ fontSize: 'big' }),
    );

    expect(resolved.style).toEqual({ preset: 'standard' });
    expect(resolved.problems.fontSize).toBe('"big" is not a number.');
  });

  it('ignores and reports a value outside the supported range, keeping the rest', () => {
    const resolved = resolveExportStyleSettings(
      withChanges({ fontSize: '99', margin: '60' }),
    );

    expect(resolved.style).toEqual({ preset: 'standard', margin: 60 });
    expect(resolved.problems.fontSize).toContain('99');
    expect(resolved.problems.fontSize).toContain('8 to 16');
    expect(resolved.problems.margin).toBeUndefined();
  });

  it('warns, without ignoring, about choices that hurt readability', () => {
    const resolved = resolveExportStyleSettings(withChanges({ fontSize: '8' }));

    expect(resolved.style).toEqual({ preset: 'standard', fontSize: 8 });
    expect(resolved.problems).toEqual({});
    expect(resolved.warnings.length).toBeGreaterThan(0);
  });
});

describe('export style storage', () => {
  beforeEach(() => {
    installFakeChromeStorage();
  });

  it('returns undefined when nothing has been saved yet', async () => {
    await expect(loadExportStyleSettings()).resolves.toBeUndefined();
  });

  it('round-trips saved settings', async () => {
    const settings = withChanges({ preset: 'comfortable', fontSize: '12' });

    await saveExportStyleSettings(settings);

    await expect(loadExportStyleSettings()).resolves.toEqual(settings);
  });

  it('loads settings saved before the detail options existed, defaulting them to off', async () => {
    const {
      projectLinks,
      projectTechStack,
      projectOutcome,
      credentialUrl,
      ...older
    } = withChanges({ preset: 'compact', fontSize: '11' });
    void [projectLinks, projectTechStack, projectOutcome, credentialUrl];
    await chrome.storage.local.set({ [EXPORT_STYLE_STORAGE_KEY]: older });

    await expect(loadExportStyleSettings()).resolves.toEqual(
      withChanges({ preset: 'compact', fontSize: '11' }),
    );
  });

  it('ignores a stored value that fails validation', async () => {
    await chrome.storage.local.set({
      [EXPORT_STYLE_STORAGE_KEY]: { version: 1, preset: 'huge' },
    });

    await expect(loadExportStyleSettings()).resolves.toBeUndefined();
  });
});
