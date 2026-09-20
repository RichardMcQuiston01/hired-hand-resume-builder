import { z } from 'zod';

import { resumeDraftSchema } from '../resume';

/**
 * Bumped whenever the persisted envelope shape below changes, so a future
 * load can detect and migrate old data instead of silently rejecting it.
 */
export const STORAGE_SCHEMA_VERSION = 1;

export const STORAGE_KEY = 'hiredHand.resumeProfiles.v1';

const persistedProfileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  // A permissive draft schema, not the strict `resumeSchema`: a profile
  // stored mid-edit is legitimately incomplete (e.g. an empty email while
  // the user is still typing), and it must still round-trip.
  resume: resumeDraftSchema,
});

const persistedStateSchema = z.object({
  version: z.literal(STORAGE_SCHEMA_VERSION),
  activeProfileId: z.uuid(),
  profiles: z.array(persistedProfileSchema).min(1),
});

export type PersistedProfile = z.infer<typeof persistedProfileSchema>;
export type PersistedState = z.infer<typeof persistedStateSchema>;

/**
 * Reads and validates the persisted resume profiles from
 * `chrome.storage.local`. Returns `undefined` when nothing has been saved
 * yet, or when the stored value fails validation (e.g. corrupted data, or
 * a future storage format this build doesn't understand) — callers should
 * fall back to a fresh default state in that case rather than crash.
 */
export async function loadPersistedState(): Promise<
  PersistedState | undefined
> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const raw: unknown = stored[STORAGE_KEY];

  if (raw === undefined) {
    return undefined;
  }

  const result = persistedStateSchema.safeParse(raw);
  if (!result.success) {
    console.error('Ignoring corrupted resume profile storage.', result.error);
    return undefined;
  }

  return result.data;
}

/** Writes the given resume profiles to `chrome.storage.local`. */
export async function savePersistedState(state: PersistedState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}
