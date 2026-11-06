/**
 * Applies a page's metadata in the browser: the title, description,
 * canonical link, sharing tags and structured data. The built HTML already
 * carries the same for the page it was made for, so on first load this
 * confirms it; on a client-side navigation it changes it.
 */

import { useEffect } from 'react';
import { SITE_NAME, SITE_URL, type PageMeta } from './meta';

export function pageUrl(meta: PageMeta): string {
  return meta.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${meta.path}`;
}

export function applyPageMeta(meta: PageMeta) {
  if (typeof document === 'undefined') return;
  const head = document.head;
  const upsert = (selector: string, make: () => Element, set: (el: Element) => void) => {
    let el = head.querySelector(selector);
    if (!el) {
      el = make();
      head.appendChild(el);
    }
    set(el);
  };
  const named = (name: string, content: string) =>
    upsert(
      `meta[name="${name}"]`,
      () => {
        const m = document.createElement('meta');
        m.setAttribute('name', name);
        return m;
      },
      (el) => el.setAttribute('content', content)
    );
  const property = (prop: string, content: string) =>
    upsert(
      `meta[property="${prop}"]`,
      () => {
        const m = document.createElement('meta');
        m.setAttribute('property', prop);
        return m;
      },
      (el) => el.setAttribute('content', content)
    );

  const url = pageUrl(meta);
  document.title = meta.title;
  named('description', meta.description);
  named('robots', meta.noindex ? 'noindex, nofollow' : 'index, follow');
  upsert(
    'link[rel="canonical"]',
    () => {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      return l;
    },
    (el) => el.setAttribute('href', url)
  );
  property('og:title', meta.title);
  property('og:description', meta.description);
  property('og:url', url);
  property('og:type', meta.type);
  property('og:image', meta.image);
  property('og:site_name', SITE_NAME);
  named('twitter:card', 'summary_large_image');
  named('twitter:title', meta.title);
  named('twitter:description', meta.description);
  named('twitter:image', meta.image);

  head.querySelectorAll('script[data-page-ld]').forEach((s) => s.remove());
  for (const ld of meta.jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-page-ld', '');
    s.textContent = JSON.stringify(ld);
    head.appendChild(s);
  }
}

/** Give the page its metadata; pass a stable object (the constants in meta.ts). */
export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    applyPageMeta(meta);
  }, [meta]);
}
