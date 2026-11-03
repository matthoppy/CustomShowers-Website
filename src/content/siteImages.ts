/**
 * The site's pictures, as one manifest.
 *
 * Every picture a customer sees on the home page has a slot here: the hero,
 * the two on the About section, and the gallery strip in order. The files
 * live under public/images so the admin dashboard can replace one by
 * committing the file and this manifest to the repository, after which Pages
 * redeploys. Nothing is fetched at runtime, so the site needs no worker to
 * show its own pictures.
 *
 * `v` is bumped on every replacement and appended to the URL, because the
 * site caches images for an hour and a replaced file at the same path would
 * otherwise show the old picture until that passed.
 */

import manifest from './site-images.json';

export interface SiteImage {
  src: string;
  alt: string;
  v: number;
}

export interface SiteImages {
  version: number;
  hero: SiteImage;
  about: SiteImage[];
  gallery: SiteImage[];
}

export const siteImages: SiteImages = manifest as SiteImages;

/** The URL to load a slot's picture from, with its version for cache busting. */
export function imageUrl(image: SiteImage): string {
  return image.v > 1 ? `${image.src}?v=${image.v}` : image.src;
}
