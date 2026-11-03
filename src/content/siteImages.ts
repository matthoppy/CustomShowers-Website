/**
 * The site's pictures, as one manifest.
 *
 * Two kinds of picture live here. The page pictures have fixed slots: the hero
 * behind the headline and the two beside the About text. The gallery is a set
 * of jobs, each a finished installation with one or more photos, filed under a
 * type of work; the first photo is the cover the strip shows, and the lightbox
 * walks through the rest.
 *
 * The admin dashboard changes all of this by committing the files (under
 * public/images/site/) and this manifest to the repository, after which Pages
 * redeploys. Nothing is fetched at runtime, so the site needs no worker to
 * show its own pictures.
 *
 * `v` on a page picture is bumped when a slot is replaced at the same path and
 * appended to the URL, because the site caches images for an hour. New photos
 * always get a new file name, so they never need it.
 */

import manifest from './site-images.json';

export interface SiteImage {
  src: string;
  alt: string;
  v: number;
}

/** One finished installation in the gallery. The first photo is the cover. */
export interface SiteJob {
  title: string;
  photos: string[];
}

export type JobTypeId = 'enclosure' | 'inline' | 'walkin' | 'sliding' | 'bath' | 'other';

/** The parts of the gallery, in the order the filters show them. */
export const JOB_TYPES: { id: JobTypeId; name: string }[] = [
  { id: 'enclosure', name: 'Enclosures' },
  { id: 'inline', name: 'Inline' },
  { id: 'walkin', name: 'Walk-in screens' },
  { id: 'sliding', name: 'Sliding doors' },
  { id: 'bath', name: 'Bath screens' },
  { id: 'other', name: 'Other glass' },
];

export interface SiteImages {
  version: number;
  hero: SiteImage;
  about: SiteImage[];
  jobs: Partial<Record<JobTypeId, SiteJob[]>>;
}

export const siteImages: SiteImages = manifest as SiteImages;

/** The URL to load a page picture from, with its version for cache busting. */
export function imageUrl(image: SiteImage): string {
  return image.v > 1 ? `${image.src}?v=${image.v}` : image.src;
}

export function jobTypeName(id: string): string {
  return JOB_TYPES.find((t) => t.id === id)?.name || id;
}

export interface PlacedJob {
  type: JobTypeId;
  index: number;
  job: SiteJob;
}

/** Every job with at least one photo, type by type in filter order. */
export function allJobs(images: SiteImages = siteImages): PlacedJob[] {
  const out: PlacedJob[] = [];
  for (const t of JOB_TYPES) {
    (images.jobs[t.id] || []).forEach((job, index) => {
      if (job && Array.isArray(job.photos) && job.photos.length) out.push({ type: t.id, index, job });
    });
  }
  return out;
}
