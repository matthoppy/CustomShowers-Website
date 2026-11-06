/**
 * What every page tells search engines: title, description, canonical URL,
 * sharing image and structured data. The pages apply it in the browser with
 * usePageMeta, and scripts/prerender.mjs writes the same into each page's
 * HTML at build time, so crawlers that do not run JavaScript see it too.
 * The sitemap is built from allPages().
 */

import { blogArticles, type BlogArticle } from '@/data/blogArticles';
import { faqs } from '@/data/faq';
import { business } from '@/content/business';
import { siteImages } from '@/content/siteImages';

export const SITE_URL = 'https://customshowers.uk';
export const SITE_NAME = 'Custom Showers';
const DEFAULT_IMAGE = `${SITE_URL}${siteImages.hero.src}`;

export interface PageMeta {
  /** The canonical path, "/" for the home page. */
  path: string;
  title: string;
  description: string;
  type: 'website' | 'article';
  /** Absolute URL of the picture shown when the page is shared. */
  image: string;
  noindex?: boolean;
  jsonLd: Record<string, unknown>[];
  /** Pictures the browser should fetch before it reaches them in the page. */
  preload?: string[];
  /** Whether to render the page's content into its HTML at build time. */
  prerender?: boolean;
  /** YYYY-MM-DD, for the sitemap. */
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
}

const abs = (path: string) => `${SITE_URL}${path}`;

function isoDate(text: string): string | undefined {
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

// ── Structured data ──────────────────────────────────────────────────────────

export function organisationLd(): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    '@id': `${SITE_URL}/#business`,
    name: business.name,
    legalName: business.legalName,
    url: SITE_URL,
    logo: business.logo,
    image: DEFAULT_IMAGE,
    email: business.email,
    description: business.description,
    priceRange: business.priceRange,
    areaServed: business.areaServed,
    openingHoursSpecification: business.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
  };
  if (business.telephone) ld.telephone = business.telephone;
  if (business.address) ld.address = { '@type': 'PostalAddress', ...business.address };
  if (business.sameAs.length) ld.sameAs = business.sameAs;
  return ld;
}

export function websiteLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#business` },
  };
}

export function faqLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function articleLd(a: BlogArticle): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.excerpt,
    datePublished: isoDate(a.date),
    dateModified: isoDate(a.date),
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@id': `${SITE_URL}/#business` },
    mainEntityOfPage: abs(`/blog/${a.slug}`),
    image: DEFAULT_IMAGE,
    articleSection: a.category,
    wordCount: a.content.split(/\s+/).filter(Boolean).length,
  };
}

function serviceLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Supply-only frameless shower enclosures',
    serviceType: 'Bespoke shower enclosure supply',
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    description:
      'Made-to-measure frameless shower glass and hardware delivered anywhere in the UK, with installation instructions for your own fitter.',
  };
}

// ── The pages ────────────────────────────────────────────────────────────────

type MetaInput = Omit<PageMeta, 'type' | 'image' | 'jsonLd'> & Partial<Pick<PageMeta, 'type' | 'image' | 'jsonLd'>>;
const page = (m: MetaInput): PageMeta => ({ type: 'website', image: DEFAULT_IMAGE, jsonLd: [], ...m });

/** Site-wide markup, on every indexable page. */
const siteLd = () => [organisationLd(), websiteLd()];

export const HOME: PageMeta = page({
  path: '/',
  title: 'Bespoke Frameless Shower Enclosures | Custom Showers London',
  description:
    'Bespoke frameless shower enclosures in 10mm toughened glass, made to your measurements. Supply only across the UK with installation guides; survey and design in London.',
  jsonLd: [...siteLd(), faqLd()],
  preload: [siteImages.hero.src],
  lastmod: '2026-11-06',
  changefreq: 'weekly',
  priority: 1,
});

export const SUPPLY_ONLY: PageMeta = page({
  path: '/supply-only',
  title: 'Supply-Only Frameless Shower Enclosures, UK Delivery | Custom Showers',
  description:
    'Order a made-to-measure frameless shower enclosure for your own fitter to install. Send your measurements, get an itemised quote, and have it delivered anywhere in the UK in 2 to 4 weeks.',
  jsonLd: [...siteLd(), serviceLd(), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Supply only', path: '/supply-only' }])],
  lastmod: '2026-11-06',
  changefreq: 'monthly',
  priority: 0.8,
});

export const BLOG: PageMeta = page({
  path: '/blog',
  title: 'Shower Enclosure Guides and Advice | Custom Showers Blog',
  description:
    'Practical guides on frameless shower enclosures: frameless or framed, how to measure, supply only with your own installer, and keeping the glass clean.',
  jsonLd: [...siteLd(), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }])],
  lastmod: '2026-11-06',
  changefreq: 'monthly',
  priority: 0.6,
});

export const DESIGN: PageMeta = page({
  path: '/design-shower',
  title: 'Design Your Frameless Shower Online | Custom Showers',
  description:
    'Design a frameless shower enclosure online: choose the shape, measure your space with the step-by-step guide, pick the hardware and send it to us for a quote.',
  jsonLd: [...siteLd(), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Design your shower', path: '/design-shower' }])],
  // The designer resumes a saved design from the browser, so its content is
  // rendered in the browser only; the page still gets its own head.
  prerender: false,
  lastmod: '2026-11-06',
  changefreq: 'monthly',
  priority: 0.8,
});

export const TERMS: PageMeta = page({
  path: '/terms-of-trade',
  title: 'Terms of Trade | Custom Showers',
  description: 'The terms that apply to quotes, orders, delivery and warranty for Custom Showers bespoke shower enclosures.',
  jsonLd: siteLd(),
  lastmod: '2026-03-01',
  changefreq: 'yearly',
  priority: 0.3,
});

export const PRIVACY: PageMeta = page({
  path: '/privacy-policy',
  title: 'Privacy Policy | Custom Showers',
  description: 'How Custom Showers handles the personal data you give us when you ask for a quote or design a shower online.',
  jsonLd: siteLd(),
  lastmod: '2026-03-01',
  changefreq: 'yearly',
  priority: 0.3,
});

export const NOT_FOUND: PageMeta = page({
  path: '/404',
  title: 'Page not found | Custom Showers',
  description: 'That page is not here. The home page, the designer and the guides are.',
  noindex: true,
});

const articleMetas = new Map<string, PageMeta>();

export function articleMeta(a: BlogArticle): PageMeta {
  let m = articleMetas.get(a.slug);
  if (!m) {
    m = page({
      path: `/blog/${a.slug}`,
      title: `${a.title} | Custom Showers`,
      description: a.excerpt,
      type: 'article',
      jsonLd: [...siteLd(), articleLd(a), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: a.title, path: `/blog/${a.slug}` }])],
      lastmod: isoDate(a.date),
      changefreq: 'yearly',
      priority: 0.5,
    });
    articleMetas.set(a.slug, m);
  }
  return m;
}

/** Every page with its own HTML, in sitemap order. */
export function allPages(): PageMeta[] {
  return [HOME, DESIGN, SUPPLY_ONLY, BLOG, ...blogArticles.map(articleMeta), TERMS, PRIVACY];
}
