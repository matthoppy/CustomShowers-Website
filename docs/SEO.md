# Search engines and the site

Written 6 November 2026, when the site was made to serve a real page for
every address instead of one shell for all of them.

## What a crawler gets

The site is a React app, but every public page is also written out as its
own HTML file at build time, with its content and its own head: title,
description, canonical link, sharing tags and structured data. A crawler (or
a visitor on a slow connection) gets the page before any JavaScript runs;
React then takes over the same markup.

| Address | File in `dist/` | Content in the HTML |
|---|---|---|
| `/` | `index.html` | yes |
| `/supply-only`, `/blog`, `/terms-of-trade`, `/privacy-policy` | `name.html` | yes |
| `/blog/<slug>` | `blog/<slug>.html` | yes |
| `/design-shower` | `design-shower.html` | head only (it resumes a saved design from the browser) |
| anything else | `404.html`, status 404 | the not-found page, noindex |
| `/admin/*` | `app.html` (rewrite) | empty shell, noindex |

Cloudflare Pages serves `name.html` at `/name` and redirects `/name/` to it,
so canonical URLs have no trailing slash (the home page is `/`).

## Where things are

- `src/seo/meta.ts`: one entry per page (title, description, structured
  data, sitemap details). Add a page here when you add a route.
- `src/seo/usePageMeta.ts`: the pages call `usePageMeta(...)` so the head
  follows client-side navigation too.
- `src/content/business.ts`: the LocalBusiness markup on every page. Fill in
  `telephone`, `address` and `sameAs` (Google Business Profile and other
  listings) exactly as they appear on the profile.
- `src/data/faq.ts`: the home page questions; they also become FAQPage markup.
- `src/entry-server.tsx` and `scripts/prerender.mjs`: the build-time render.
  `npm run build` runs the client build, the server build and the prerender.
  `npm run build:spa` is the old single-shell build, for comparison only.
- `public/_redirects`, `public/_headers`, `public/robots.txt`: routing, cache
  lifetimes (hashed assets a year, pictures a day, pages an hour) and the
  admin kept out of the index. The sitemap is generated into `dist/`.

## Pictures

`npm run images` shrinks everything under `public/images` in place: at most
1600px on the longest side (2000px for the hero), JPEG at quality 80, right
way up, camera metadata removed. Run it after copying new photos in by hand;
the dashboard's Photos page shrinks what it uploads itself. On 6 November
2026 this took the folder from 61MB to 4.6MB.

## What was wrong before, for the record

- Every address served the home page's title, description and canonical, so
  Google was told the blog and the supply-only page *were* the home page.
- The blog had no link from the site and was not in the sitemap.
- Unknown addresses answered 200 with the home page.
- Mobile Lighthouse: performance 59, largest contentful paint 12.7s, 5.5MB
  page; photos were 2 to 3.4MB each.
- The quote form posted to `customshowers-contact.workers.dev`, a hostname
  that does not exist (the account's workers live under
  `vcwvk4sm9m.workers.dev`), so nothing sent through the form arrived.

## Still to do, in order of value

1. Fill in `src/content/business.ts`.
2. Service pages, one per type of work in the gallery, each with its own
   entry in `meta.ts` and the gallery filtered to that type.
3. Area pages with real jobs from each area.
4. Longer articles; 300 words does not compete.
5. Cloudflare's managed robots.txt blocks AI crawlers (Security → Bots);
   decide whether that is wanted.
