import { z } from 'zod';

/**
 * Bumped whenever the persisted shape below changes.
 */
export const AI_SETTINGS_SCHEMA_VERSION = 1;

export const AI_SETTINGS_STORAGE_KEY = 'hiredHand.aiSettings.v1';

const aiSettingsSchema = z.object({
  version: z.literal(AI_SETTINGS_SCHEMA_VERSION),
  anthropicApiKey: z.string().min(1),
});

export type AiSettings = z.infer<typeof aiSettingsSchema>;

/**
 * Reads the user's Anthropic API key from `chrome.storage.local`. Stored
 * separately from resume profile data so it's never bundled into a resume
 * export. Returns `undefined` when no key has been saved, or when the
 * stored value fails validation.
 */
export async function loadAiSettings(): Promise<AiSettings | undefined> {
  const stored = await chrome.storage.local.get(AI_SETTINGS_STORAGE_KEY);
  const raw: unknown = stored[AI_SETTINGS_STORAGE_KEY];

  if (raw === undefined) {
    return undefined;
  }

  const result = aiSettingsSchema.safeParse(raw);
  if (!result.success) {
    console.error('Ignoring corrupted AI settings storage.', result.error);
    return undefined;
  }

  return result.data;
}

/** Saves the user's Anthropic API key to `chrome.storage.local`. */
export async function saveAiSettings(anthropicApiKey: string): Promise<void> {
  const settings: AiSettings = {
    version: AI_SETTINGS_SCHEMA_VERSION,
    anthropicApiKey,
  };
  await chrome.storage.local.set({ [AI_SETTINGS_STORAGE_KEY]: settings });
}

/** Removes the user's saved Anthropic API key. */
export async function clearAiSettings(): Promise<void> {
  await chrome.storage.local.remove(AI_SETTINGS_STORAGE_KEY);
}
