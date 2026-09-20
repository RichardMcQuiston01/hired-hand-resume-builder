import type { Resume } from '../resume';

/**
 * Serializes a resume to pretty-printed JSON. Round-trips losslessly
 * through `parseResume` — this is also the interop format for other
 * Hired Hand tools (see ROADMAP.md).
 */
export function exportResumeAsJson(resume: Resume): string {
  return JSON.stringify(resume, null, 2);
}
