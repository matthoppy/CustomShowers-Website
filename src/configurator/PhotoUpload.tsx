/**
 * Photos of the opening.
 *
 * Optional, but the cheapest insurance in the whole flow. Measurements
 * describe a rectangle; a photo shows the kerb, the pipework, the window in
 * the return wall and the ceiling that slopes — all the things a customer
 * does not think to mention because they have stopped seeing them.
 *
 * Phone photos run to several megabytes each and go out as base64 inside an
 * email, so they are downscaled in the browser before they leave. A workshop
 * needs to see what is in the room, not count the grout.
 */

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2, X } from 'lucide-react';
import type { EnquiryAttachment } from './submit';

export interface Photo {
  id: string;
  /** Object URL for the thumbnail. Revoked when the photo is removed. */
  previewUrl: string;
  attachment: EnquiryAttachment;
}

/** Long edge, in pixels. Enough to read a tile layout, small enough to email. */
const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.75;
const MAX_PHOTOS = 4;

/**
 * Downscale and re-encode in the browser.
 *
 * Returns null rather than throwing on an unreadable file — a photo that will
 * not load is a reason to carry on without it, never a reason to lose the
 * enquiry the customer has just spent ten minutes on.
 */
async function toDownscaledJpeg(file: File): Promise<string | null> {
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

export function PhotoUpload({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);

  const room = MAX_PHOTOS - photos.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setFailed([]);

    const accepted: Photo[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(files).slice(0, room)) {
      const content = await toDownscaledJpeg(file);
      if (!content) {
        rejected.push(file.name);
        continue;
      }
      accepted.push({
        id: `${file.name}-${Date.now()}-${accepted.length}`,
        previewUrl: URL.createObjectURL(file),
        attachment: {
          // Named by position so the workshop can refer to "photo 2" without
          // inheriting whatever the phone called it.
          filename: `photo-${photos.length + accepted.length + 1}.jpg`,
          content,
        },
      });
    }

    onChange([...photos, ...accepted]);
    setFailed(rejected);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-semibold">Photos of the opening (optional)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          A couple of photos tell us things a measurement cannot — where the pipework runs, how
          the tray sits, whether the ceiling drops. It is the quickest way for us to spot
          something before it becomes a problem. Up to {MAX_PHOTOS}.
        </p>
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((photo, i) => (
            <li key={photo.id} className="group relative overflow-hidden rounded border">
              <img
                src={photo.previewUrl}
                alt={`Opening, photo ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground shadow-sm transition-opacity hover:bg-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {failed.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          We could not read {failed.join(', ')}. Everything else was added — try those again as
          a JPEG or PNG if you want them included.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || room <= 0}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding
          </>
        ) : (
          <>
            <ImagePlus className="mr-2 h-4 w-4" />
            {photos.length ? 'Add another' : 'Add photos'}
          </>
        )}
      </Button>
      {room <= 0 && (
        <p className="text-xs text-muted-foreground">
          That is the {MAX_PHOTOS} we can attach. Remove one to swap it.
        </p>
      )}
    </div>
  );
}
