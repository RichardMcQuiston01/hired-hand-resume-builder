import { describe, expect, it } from 'vitest';

import { createFixtureResume } from './fixtures';
import {
  parseResume,
  RESUME_SCHEMA_VERSION,
  resumeSchema,
  safeParseResume,
} from './schema';

describe('resumeSchema', () => {
  it('accepts a fully populated, valid resume', () => {
    const fixture = createFixtureResume();

    expect(() => parseResume(fixture)).not.toThrow();
  });

  it('round-trips through JSON serialization unchanged', () => {
    const fixture = createFixtureResume();
    const roundTripped = parseResume(
      JSON.parse(JSON.stringify(fixture)) as unknown,
    );

    expect(roundTripped).toStrictEqual(fixture);
  });

  it('defaults optional collections to empty arrays', () => {
    const fixture = createFixtureResume();
    const minimal = safeParseResume({
      schemaVersion: RESUME_SCHEMA_VERSION,
      id: fixture.id,
      createdAt: fixture.createdAt,
      updatedAt: fixture.updatedAt,
      contact: {
        fullName: fixture.contact.fullName,
        email: fixture.contact.email,
      },
    });

    expect(minimal.success).toBe(true);
    if (minimal.success) {
      expect(minimal.data.experience).toStrictEqual([]);
      expect(minimal.data.contact.links).toStrictEqual([]);
    }
  });

  it('rejects an unsupported schema version', () => {
    const fixture = createFixtureResume();
    const result = safeParseResume({ ...fixture, schemaVersion: 999 });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid contact email', () => {
    const fixture = createFixtureResume();
    const result = safeParseResume({
      ...fixture,
      contact: { ...fixture.contact, email: 'not-an-email' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects a startDate that is not in YYYY-MM format', () => {
    const fixture = createFixtureResume();
    const [firstExperience] = fixture.experience;
    if (!firstExperience) {
      throw new Error('Fixture resume must have at least one job.');
    }

    const result = safeParseResume({
      ...fixture,
      experience: [{ ...firstExperience, startDate: '03/2022' }],
    });

    expect(result.success).toBe(false);
  });

  it('requires an endDate when a job is not marked as current', () => {
    const fixture = createFixtureResume();
    const [firstExperience] = fixture.experience;
    if (!firstExperience) {
      throw new Error('Fixture resume must have at least one job.');
    }

    const result = safeParseResume({
      ...fixture,
      experience: [
        { ...firstExperience, isCurrent: false, endDate: undefined },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('requires at least one highlight per job', () => {
    const fixture = createFixtureResume();
    const [firstExperience] = fixture.experience;
    if (!firstExperience) {
      throw new Error('Fixture resume must have at least one job.');
    }

    const result = resumeSchema.safeParse({
      ...fixture,
      experience: [{ ...firstExperience, highlights: [] }],
    });

    expect(result.success).toBe(false);
  });
});
