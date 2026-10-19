import { afterEach, describe, expect, it, vi } from 'vitest';

import { MAX_SCREENSHOT_DATA_URL_LENGTH } from '@richardmcquiston01/ats-resume-export';
import {
  convertWebpToPngDataUrl,
  MAX_CONVERTED_DIMENSION,
  readImageFileAsDataUrl,
} from './readImageFile';

describe('readImageFileAsDataUrl', () => {
  it('returns a base64 data URL for a supported image', async () => {
    const file: File = new File(['abc'], 'shot.png', { type: 'image/png' });

    const result = await readImageFileAsDataUrl(file);

    expect(result).toStrictEqual({
      success: true,
      dataUrl: 'data:image/png;base64,YWJj',
    });
  });

  it('rejects an unsupported file type with a descriptive message', async () => {
    const file: File = new File(['<svg/>'], 'logo.svg', {
      type: 'image/svg+xml',
    });

    const result = await readImageFileAsDataUrl(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('logo.svg');
      expect(result.error).toContain('PNG, JPEG, or WebP');
    }
  });

  it('rejects an image whose encoded size exceeds the storage limit', async () => {
    const file: File = new File(
      [new Uint8Array(MAX_SCREENSHOT_DATA_URL_LENGTH)],
      'huge.png',
      { type: 'image/png' },
    );

    const result = await readImageFileAsDataUrl(file);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('too large');
    }
  });
});

describe('readImageFileAsDataUrl with WebP', () => {
  const webp: File = new File(['webp-bytes'], 'shot.webp', {
    type: 'image/webp',
  });

  it('stores the converted PNG instead of the WebP', async () => {
    const convert = vi.fn(() => Promise.resolve('data:image/png;base64,UE5H'));

    const result = await readImageFileAsDataUrl(webp, convert);

    expect(convert).toHaveBeenCalledWith(webp);
    expect(result).toStrictEqual({
      success: true,
      dataUrl: 'data:image/png;base64,UE5H',
    });
  });

  it('does not run the converter for PNG files', async () => {
    const convert = vi.fn(() => Promise.resolve('unused'));
    const png: File = new File(['abc'], 'shot.png', { type: 'image/png' });

    await readImageFileAsDataUrl(png, convert);

    expect(convert).not.toHaveBeenCalled();
  });

  it('reports a conversion failure with the file name and reason', async () => {
    const result = await readImageFileAsDataUrl(webp, () =>
      Promise.reject(new Error('decode failed')),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('shot.webp');
      expect(result.error).toContain('could not be converted to PNG');
      expect(result.error).toContain('decode failed');
    }
  });

  it('still rejects a converted image that is too large to store', async () => {
    const result = await readImageFileAsDataUrl(webp, () =>
      Promise.resolve(
        `data:image/png;base64,${'A'.repeat(MAX_SCREENSHOT_DATA_URL_LENGTH)}`,
      ),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('too large');
    }
  });
});

describe('convertWebpToPngDataUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Stubs the browser APIs jsdom lacks; returns the drawn canvas size. */
  function stubBrowserImageApis(
    width: number,
    height: number,
  ): {
    canvas: { width: number; height: number };
    close: ReturnType<typeof vi.fn>;
  } {
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => Promise.resolve({ width, height, close })),
    );
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (callback: (blob: Blob | null) => void) => {
        callback(new Blob(['PNG'], { type: 'image/png' }));
      },
    };
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) =>
        tag === 'canvas'
          ? (canvas as unknown as HTMLCanvasElement)
          : realCreateElement(tag, options),
    );
    return { canvas, close };
  }

  it('encodes the image as a PNG data URL and releases the bitmap', async () => {
    const { canvas, close } = stubBrowserImageApis(800, 600);

    const dataUrl: string = await convertWebpToPngDataUrl(
      new File(['x'], 'a.webp', { type: 'image/webp' }),
    );

    expect(dataUrl).toBe('data:image/png;base64,UE5H');
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('downscales images larger than the maximum dimension', async () => {
    const { canvas } = stubBrowserImageApis(
      MAX_CONVERTED_DIMENSION * 2,
      MAX_CONVERTED_DIMENSION,
    );

    await convertWebpToPngDataUrl(
      new File(['x'], 'big.webp', { type: 'image/webp' }),
    );

    expect(canvas.width).toBe(MAX_CONVERTED_DIMENSION);
    expect(canvas.height).toBe(MAX_CONVERTED_DIMENSION / 2);
  });
});
