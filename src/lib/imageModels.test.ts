import { describe, expect, it } from 'vitest';
import { DEFAULT_IMAGE_MODEL_ID, getImageDimensions, getImageModel, resolveImageModel } from './imageModels';

describe('image model selection', () => {
  it('uses a supported NVIDIA flux model by default', () => {
    expect(DEFAULT_IMAGE_MODEL_ID).toBe('nvidia-flux-2-klein');
    expect(getImageModel(DEFAULT_IMAGE_MODEL_ID).apiModel).toBe('black-forest-labs/flux.2-klein-4b');
  });

  it('rejects unsupported legacy model names and falls back safely', () => {
    expect(resolveImageModel('nvidia', 'google/gemini-2.5-flash-image')).toBe('black-forest-labs/flux.2-klein-4b');
    expect(resolveImageModel('nvidia', 'black-forest-labs/flux.1-dev')).toBe('black-forest-labs/flux.2-klein-4b');
  });

  it('marks official Klein generation and editing capabilities in the registry', () => {
    const flux2 = getImageModel('nvidia-flux-2-klein');
    const flux3 = getImageModel('nvidia-flux-3-klein');

    expect(flux2.capabilities).toEqual(['text-to-image', 'image-to-image']);
    expect(flux2.steps).toBe(4);
    expect(flux3.capabilities).toContain('image-to-image');
    expect(flux3.apiModel).toBe('black-forest-labs/flux.3-image-klein');
    expect(getImageModel('nvidia-flux-1-kontext-dev').availability).toBe('license-review');
  });

  it('maps supported aspect ratios to NVIDIA-supported image dimensions', () => {
    expect(getImageDimensions('1:1')).toEqual({ width: 1024, height: 1024 });
    expect(getImageDimensions('16:9')).toEqual({ width: 1568, height: 880 });
    expect(getImageDimensions('9:16')).toEqual({ width: 880, height: 1568 });
  });
});
