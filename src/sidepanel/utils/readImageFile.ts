import { MAX_SCREENSHOT_DATA_URL_LENGTH } from '@richardmcquiston01/ats-resume-export';

export const ACCEPTED_IMAGE_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
];

export interface ReadImageSuccess {
  success: true;
  dataUrl: string;
}

export interface ReadImageFailure {
  success: false;
  error: string;
}

export type ReadImageResult = ReadImageSuccess | ReadImageFailure;

function formatMegabytes(characterCount: number): string {
  return (characterCount / 1_000_000).toFixed(1);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader: FileReader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('The file reader returned a non-text result.'));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('The file could not be read.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a user-selected image into a base64 data URL suitable for storing on
 * a screenshot, rejecting unsupported types and files too large to keep in
 * extension storage. Never throws; failures come back with a descriptive
 * message for the caller to display.
 */
export async function readImageFileAsDataUrl(
  file: File,
): Promise<ReadImageResult> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `"${file.name}" is a ${file.type || 'unknown'} file. Choose a PNG, JPEG, or WebP image.`,
    };
  }

  let dataUrl: string;
  try {
    dataUrl = await readFileAsDataUrl(file);
  } catch (readError: unknown) {
    const reason: string =
      readError instanceof Error ? readError.message : String(readError);
    return {
      success: false,
      error: `"${file.name}" could not be read: ${reason}`,
    };
  }

  if (dataUrl.length > MAX_SCREENSHOT_DATA_URL_LENGTH) {
    return {
      success: false,
      error: `"${file.name}" is too large (${formatMegabytes(dataUrl.length)} MB once encoded; the limit is ${formatMegabytes(MAX_SCREENSHOT_DATA_URL_LENGTH)} MB). Resize or compress it and try again.`,
    };
  }

  return { success: true, dataUrl };
}
