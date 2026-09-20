import {
  createId,
  RESUME_SCHEMA_VERSION,
  resumeDraftSchema,
  type Resume,
} from '../resume';

export interface ImportResumeSuccess {
  success: true;
  resume: Resume;
}

export interface ImportResumeFailure {
  success: false;
  error: string;
}

export type ImportResumeResult = ImportResumeSuccess | ImportResumeFailure;

/**
 * Parses a JSON resume export (see `src/lib/export/toJson.ts`) back into a
 * `Resume`, assigning it a fresh id and timestamps so it never collides
 * with an existing profile. Uses the permissive draft schema — not the
 * strict export-readiness one — since an imported resume may
 * legitimately be incomplete (e.g. exported mid-edit, or from a sibling
 * Hired Hand tool with different required fields).
 */
export function importResumeFromJson(jsonText: string): ImportResumeResult {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return { success: false, error: 'That file is not valid JSON.' };
  }

  if (typeof raw !== 'object' || raw === null || !('schemaVersion' in raw)) {
    return {
      success: false,
      error: 'That file does not look like a Hired Hand resume export.',
    };
  }

  const rawSchemaVersion = (raw as { schemaVersion: unknown }).schemaVersion;
  if (rawSchemaVersion !== RESUME_SCHEMA_VERSION) {
    return {
      success: false,
      error: `Unsupported resume file version (${String(rawSchemaVersion)}). This build supports version ${RESUME_SCHEMA_VERSION}.`,
    };
  }

  const result = resumeDraftSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: 'That file is not a valid resume export.',
    };
  }

  const now = new Date().toISOString();
  return {
    success: true,
    resume: { ...result.data, id: createId(), createdAt: now, updatedAt: now },
  };
}
