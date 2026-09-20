import { describe, expect, it } from 'vitest';

import { exportResumeAsJson } from '../export';
import { createBlankResume, createFixtureResume } from '../resume';
import { importResumeFromJson } from './fromJson';

describe('importResumeFromJson', () => {
  it('imports a fully valid exported resume with a fresh id and timestamps', () => {
    const original = createFixtureResume();
    const json = exportResumeAsJson(original);

    const result = importResumeFromJson(json);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.resume.id).not.toBe(original.id);
    expect(result.resume.createdAt).not.toBe(original.createdAt);
    expect(result.resume.contact).toStrictEqual(original.contact);
    expect(result.resume.experience).toStrictEqual(original.experience);
  });

  it('imports an in-progress (incomplete) exported resume', () => {
    const json = exportResumeAsJson(createBlankResume());

    const result = importResumeFromJson(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.resume.contact.fullName).toBe('');
    }
  });

  it('rejects text that is not valid JSON', () => {
    const result = importResumeFromJson('{not json');

    expect(result).toStrictEqual({
      success: false,
      error: 'That file is not valid JSON.',
    });
  });

  it('rejects valid JSON that is not shaped like a resume export', () => {
    const result = importResumeFromJson(JSON.stringify({ hello: 'world' }));

    expect(result).toStrictEqual({
      success: false,
      error: 'That file does not look like a Hired Hand resume export.',
    });
  });

  it('rejects an unsupported schema version', () => {
    const resume = createFixtureResume();
    const json = JSON.stringify({ ...resume, schemaVersion: 999 });

    const result = importResumeFromJson(json);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Unsupported resume file version (999)');
    }
  });

  it('rejects a structurally invalid resume', () => {
    const resume = createFixtureResume();
    const json = JSON.stringify({
      ...resume,
      contact: { ...resume.contact, fullName: 42 },
    });

    const result = importResumeFromJson(json);

    expect(result).toStrictEqual({
      success: false,
      error: 'That file is not a valid resume export.',
    });
  });
});
