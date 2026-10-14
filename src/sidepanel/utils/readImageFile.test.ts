import { describe, expect, it } from 'vitest';

import { MAX_SCREENSHOT_DATA_URL_LENGTH } from '../../lib/resume';
import { readImageFileAsDataUrl } from './readImageFile';

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
