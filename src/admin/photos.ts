/**
 * The pieces behind the Photos pages that are not screens: the chips that
 * build a label, shrinking a photo before it goes up, previews of photos that
 * are committed but not yet deployed, and the same change-applying logic the
 * worker runs, so the sample-data mode behaves like the real thing.
 */

import { JOB_TYPES, type JobTypeId, type SiteImage, type SiteImages, type SiteJob } from '@/content/siteImages';
import type { PhotoChange } from './api/types';

/** Longest side of an uploaded photo, in pixels; and the JPEG quality. */
export const MAX_EDGE_PX = 1600;
/** The hero runs the full width of a big screen, so it gets more. */
export const HERO_EDGE_PX = 2000;
export const JPEG_QUALITY = 0.8;
export const MAX_TITLE_LENGTH = 80;

/** What a job of each type usually is: tap one and the label writes itself. */
export const WHAT: Record<JobTypeId, string[]> = {
  enclosure: ['Frameless enclosure', 'Corner enclosure', 'Alcove enclosure', 'Clamp-fixed enclosure', 'Quadrant enclosure', 'Steam room enclosure'],
  inline: ['Inline enclosure', 'Inline door and panel', 'Inline with return', 'Steam inline enclosure'],
  walkin: ['Walk-in screen', 'Wet room screen', 'Fixed panel', 'Clamp-fixed screen', 'Crittall-style screen', 'Framed screen'],
  sliding: ['Sliding door', 'Sliding enclosure', 'Bath sliding screen'],
  bath: ['Bath screen', 'Hinged bath screen', 'Fixed bath screen', 'Folding bath screen'],
  other: ['Mirror', 'Splashback', 'Glass partition', 'Glass door', 'Balustrade'],
};

/** Where jobs tend to be. The label can always be typed instead. */
export const AREAS = ['Battersea', 'Chelsea', 'Clapham', 'Fulham', 'Hampstead', 'Islington', 'Kensington', 'Putney', 'Richmond', 'Wandsworth', 'Wimbledon', 'London'];

export function composeTitle(what: string | null, where: string | null): string {
  if (what && where) return `${what} in ${where}`;
  if (what) return what;
  if (where) return `Shower glass in ${where}`;
  return '';
}

export function photoWord(n: number): string {
  return n === 1 ? '1 photo' : `${n} photos`;
}

export function typeName(id: string | null): string {
  return JOB_TYPES.find((t) => t.id === id)?.name || '';
}

// ── Previews ─────────────────────────────────────────────────────────────────

/**
 * A photo published a moment ago is in the repository but not yet on the
 * site, so until the deployment finishes its path would show nothing. The
 * preview made when it was picked stands in, for the rest of this visit.
 */
const localPreviews = new Map<string, string>();

export function rememberPreview(path: string, url: string) {
  localPreviews.set(path, url);
}

export function photoSrc(path: string, siteOrigin: string): string {
  return localPreviews.get(path) || `${siteOrigin}${path}`;
}

// ── Shrinking ────────────────────────────────────────────────────────────────

export interface ShrunkPhoto {
  blob: Blob;
  /** An object URL of the shrunk photo, for showing it. */
  url: string;
  bytes: number;
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      // Phones store the rotation in EXIF; this bakes it in.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall through to the <img> route below
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That photo could not be read. Try a JPEG or PNG.'));
    };
    img.src = url;
  });
}

/** The photo at most MAX_EDGE_PX on its longest side, as a JPEG on a white background. */
export async function shrink(file: File, maxEdge: number = MAX_EDGE_PX): Promise<ShrunkPhoto> {
  const img = await decode(file);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('That photo could not be read.');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if ('close' in img) img.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('That photo could not be saved as a JPEG.'))), 'image/jpeg', JPEG_QUALITY);
  });
  return { blob, url: URL.createObjectURL(blob), bytes: blob.size };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('That photo could not be read.'));
    reader.readAsDataURL(blob);
  });
}

export function isImageFile(file: File): boolean {
  return /^image\//.test(file.type) || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name);
}

// ── Applying a change (the worker's logic, for the sample-data mode) ─────────

export function normaliseManifest(raw: SiteImages): SiteImages {
  const out: SiteImages = { ...raw, version: 2, jobs: {} };
  for (const t of JOB_TYPES) out.jobs[t.id] = (raw.jobs?.[t.id] || []).map((j) => ({ title: j.title, photos: [...j.photos] }));
  out.about = raw.about.map((a) => ({ ...a }));
  out.hero = { ...raw.hero };
  return out;
}

function conflict(message: string): Error & { conflict: true } {
  return Object.assign(new Error(message), { conflict: true as const });
}

/** As the worker: the change on a copy of the manifest, and the photos nothing uses any more. */
export function applyPhotoChange(current: SiteImages, change: PhotoChange, newPaths: string[] = []): { manifest: SiteImages; removed: string[] } {
  const manifest = normaliseManifest(current);
  const resolve = (p: string) => (/^new:\d+$/.test(p) ? newPaths[Number(p.slice(4))] : p);
  const dropped: string[] = [];
  const unused = () => {
    const still = JSON.stringify(manifest);
    return [...new Set(dropped)].filter((p) => p.startsWith('/images/site/') && !still.includes(`"${p}"`));
  };

  if (change.kind === 'slot') {
    const old: SiteImage | undefined = change.slot === 'hero' ? manifest.hero : manifest.about[change.index ?? 0];
    if (!old) throw conflict('That page picture is not on the site any more.');
    const src = change.photo ? resolve(change.photo) : old.src;
    const next = { src, alt: change.alt, v: src === old.src ? old.v : 1 };
    if (change.slot === 'hero') manifest.hero = next;
    else manifest.about[change.index ?? 0] = next;
    if (src !== old.src) dropped.push(old.src);
    return { manifest, removed: unused() };
  }

  const finalPhotos = change.mode === 'delete' ? [] : change.photos.map(resolve);
  if (change.mode === 'add') {
    (manifest.jobs[change.type] = manifest.jobs[change.type] || []).unshift({ title: change.title.trim(), photos: finalPhotos });
    return { manifest, removed: [] };
  }
  const list: SiteJob[] = manifest.jobs[change.origType] || [];
  let idx = -1;
  if (list[change.origIndex] && JSON.stringify(list[change.origIndex]) === change.origJson) idx = change.origIndex;
  else idx = list.findIndex((j) => JSON.stringify(j) === change.origJson);
  if (idx === -1) throw conflict('This job was changed somewhere else while you were editing. Go back to Photos to see the latest version.');
  const [old] = list.splice(idx, 1);
  for (const p of old.photos) if (change.mode === 'delete' || !finalPhotos.includes(p)) dropped.push(p);
  if (change.mode === 'delete') return { manifest, removed: unused() };
  const updated = { title: change.title.trim(), photos: finalPhotos };
  if (change.type === change.origType) list.splice(idx, 0, updated);
  else (manifest.jobs[change.type] = manifest.jobs[change.type] || []).unshift(updated);
  return { manifest, removed: unused() };
}
