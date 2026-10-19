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

function readFileAsDataUrl(file: Blob): Promise<string> {
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
 * Converted WebP screenshots are capped at this many pixels on their longest
 * side: a screenshot rarely needs more, and PNG is far larger than WebP, so
 * the cap keeps the result inside the storage limit.
 */
export const MAX_CONVERTED_DIMENSION = 1600;

/** Converts a WebP file to a PNG data URL. Rejects when it cannot. */
export type WebpConverter = (file: File) => Promise<string>;

/**
 * Decodes the image in the browser and re-encodes it as PNG on a canvas
 * (downscaled to `MAX_CONVERTED_DIMENSION`). PDFs can't embed WebP, so
 * converting at upload time keeps every screenshot usable in every export.
 */
export const convertWebpToPngDataUrl: WebpConverter = async (file) => {
  const bitmap: ImageBitmap = await createImageBitmap(file);
  try {
    const scale: number = Math.min(
      1,
      MAX_CONVERTED_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!context) {
      throw new Error('A 2D canvas is not available.');
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const png: Blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('The canvas could not encode a PNG.'));
        }
      }, 'image/png');
    });
    return await readFileAsDataUrl(png);
  } finally {
    bitmap.close();
  }
};

/**
 * Reads a user-selected image into a base64 data URL suitable for storing on
 * a screenshot, rejecting unsupported types and files too large to keep in
 * extension storage. WebP images are converted to PNG. Never throws;
 * failures come back with a descriptive message for the caller to display.
 */
export async function readImageFileAsDataUrl(
  file: File,
  convertWebp: WebpConverter = convertWebpToPngDataUrl,
): Promise<ReadImageResult> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `"${file.name}" is a ${file.type || 'unknown'} file. Choose a PNG, JPEG, or WebP image.`,
    };
  }

  const isWebp: boolean = file.type === 'image/webp';
  let dataUrl: string;
  try {
    dataUrl = isWebp ? await convertWebp(file) : await readFileAsDataUrl(file);
  } catch (readError: unknown) {
    const reason: string =
      readError instanceof Error ? readError.message : String(readError);
    return {
      success: false,
      error: isWebp
        ? `"${file.name}" is a WebP image that could not be converted to PNG: ${reason}`
        : `"${file.name}" could not be read: ${reason}`,
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
