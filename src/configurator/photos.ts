/**
 * Photos the customer attaches to an enquiry.
 *
 * Two kinds, both landing in the same list:
 *
 *  - one tied to a measurement, taken on the spot to show the tape in place
 *  - loose photos of the room added at the end
 *
 * The first kind is worth more. A number on its own cannot be checked by
 * anyone; a number with a photo of the tape against the wall can be, and the
 * customer is carrying the measurements for this job, so being able to check
 * them matters more here than it would if a fitter had taken them.
 */

/** Which measurement a photo backs up, or 'extra' for a loose one. */
export type PhotoSlot =
  | 'height'
  | 'width-floor'
  | 'width-top'
  | 'walls'
  | 'floor'
  | 'extra';

export interface Photo {
  id: string;
  slot: PhotoSlot;
  /** Object URL for the thumbnail. Revoked when the photo is removed. */
  previewUrl: string;
  filename: string;
  /** Base64 JPEG, no data: prefix. */
  content: string;
}

/** Long edge, in pixels. Enough to read a tape, small enough to email. */
const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.75;

/** How many loose photos the review step accepts on top of the measurement ones. */
export const MAX_EXTRA_PHOTOS = 4;

/** Names the workshop can read without opening them. */
const SLOT_FILENAMES: Record<PhotoSlot, string> = {
  height: 'measured-height',
  'width-floor': 'measured-width-at-floor',
  'width-top': 'measured-width-at-top',
  walls: 'measured-wall-lean',
  floor: 'measured-floor-level',
  extra: 'photo',
};

/** How each is introduced in the enquiry email. */
export const SLOT_LABELS: Record<PhotoSlot, string> = {
  height: 'Height',
  'width-floor': 'Width at the floor',
  'width-top': 'Width at the top',
  walls: 'Wall lean',
  floor: 'Floor level',
  extra: 'The opening',
};

/**
 * Downscale and re-encode in the browser.
 *
 * Returns null rather than throwing on an unreadable file — a photo that will
 * not load is a reason to carry on without it, never a reason to lose the
 * enquiry the customer has just spent ten minutes on.
 */
export async function toDownscaledJpeg(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1] ?? null;
  } catch {
    return null;
  }
}

/** Build a Photo from a file, or null if the image could not be read. */
export async function createPhoto(
  file: File,
  slot: PhotoSlot,
  index = 1
): Promise<Photo | null> {
  const content = await toDownscaledJpeg(file);
  if (!content) return null;
  return {
    id: `${slot}-${Date.now()}-${index}`,
    slot,
    previewUrl: URL.createObjectURL(file),
    filename: `${SLOT_FILENAMES[slot]}${slot === 'extra' ? `-${index}` : ''}.jpg`,
    content,
  };
}

/** Free the thumbnail's object URL. Safe to call on an already-revoked one. */
export function releasePhoto(photo: Photo | undefined) {
  if (photo) URL.revokeObjectURL(photo.previewUrl);
}
