/**
 * Photo upload — camera capture and file picker.
 */

import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  onPhotoSelected: (dataUrl: string) => void;
  onBack: () => void;
}

const MAX_DIMENSION = 1600;

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height && width > MAX_DIMENSION) {
        height = (height / width) * MAX_DIMENSION;
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = (width / height) * MAX_DIMENSION;
        height = MAX_DIMENSION;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

async function handleFileInput(file: File | null): Promise<string | null> {
  if (!file) return null;

  const type = file.type.toLowerCase();

  if (type === 'image/heic' || type === 'image/heif') {
    try {
      const heic2any = (await import('heic2any')).default;
      const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      return await resizeImage(new File([blob], 'converted.jpg', { type: 'image/jpeg' }));
    } catch (err) {
      console.error('HEIC conversion failed:', err);
      throw new Error(
        'Could not convert HEIC image. Please use JPEG or PNG, or convert the photo first.'
      );
    }
  }

  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(type)) {
    throw new Error('Please upload a JPEG or PNG photo.');
  }

  return await resizeImage(file);
}

export function PhotoUpload({ onPhotoSelected, onBack }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const dataUrl = await handleFileInput(file);
      if (dataUrl) {
        onPhotoSelected(dataUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back
        </Button>
        <h2 className="text-2xl font-bold">Upload a photo of your space</h2>
        <p className="mt-2 text-muted-foreground">
          Take or upload a photo showing the shower opening. You'll mark the corners in the next
          step.
        </p>
      </div>

      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/heic,image/heif"
          capture="environment"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="hidden"
          aria-label="Photo file input"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            size="lg"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-auto flex-col gap-3 py-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Take a photo</div>
              <div className="mt-1 text-xs text-muted-foreground">Use your device camera</div>
            </div>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
              }
            }}
            disabled={uploading}
            className="h-auto flex-col gap-3 py-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Choose from library</div>
              <div className="mt-1 text-xs text-muted-foreground">Pick an existing photo</div>
            </div>
          </Button>
        </div>

        {uploading && (
          <div className="rounded-lg border bg-muted p-4 text-center text-sm">
            Processing photo...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-4">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1 text-sm text-destructive">{error}</div>
          </div>
        )}

        <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
          <strong className="block text-foreground">Tips for a good photo:</strong>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li>Stand back so the whole opening is visible</li>
            <li>Face the opening straight on if possible</li>
            <li>Make sure the area is well lit</li>
            <li>Photos stay on your device — nothing is uploaded</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
