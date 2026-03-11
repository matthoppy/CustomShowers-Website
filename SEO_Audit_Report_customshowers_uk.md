# SEO Audit Report: customshowers.uk
**Audit Date:** 11 March 2026
**Prepared by:** SEO Strategy Team
**Domain:** customshowers.uk
**Company:** Custom Showers Ltd (Companies House No. 16892739)

---

## Executive Summary

customshowers.uk is operating in a commercially valuable but fiercely competitive niche — bespoke and custom shower enclosures in the UK. The audit has identified a site-level crisis that must be resolved before any other optimisation work will have meaningful effect: **the domain returns no indexed pages in Google**. A `site:customshowers.uk` search yields zero results, and the domain was incorporated only on 5 December 2025, making it extremely new. The site also blocks crawler access (HTTP 403 responses), which confirms search engines cannot index the content at this time.

The upside is that the market is real, the search demand is substantial, and the company registered address (49a Fulham High Street, London SW6 3JJ) provides a strong local SEO anchor in one of London's most affluent postcodes. With the right foundational build, the site has a credible path to organic visibility within 6–12 months.

**Overall SEO Health Score: 12 / 100** (primarily due to zero indexation and crawler blocking)

---

## Section 1: On-Page SEO Analysis

### 1.1 Current State Assessment

Direct access to the site returned HTTP 403 Forbidden responses across all tested user agents, which means the following on-page elements **cannot be verified from a live crawl**. Findings in this section are therefore framed as a requirements checklist rather than a pass/fail audit of existing elements.

**Critical Risk:** If the site is returning 403 errors to Googlebot specifically, or if robots.txt disallows crawling, no on-page optimisation will produce ranking results. This must be the first issue resolved.

### 1.2 Title Tag Requirements

**Standard:** 50–60 characters, includes primary keyword, brand name at the end.

| Page Type | Recommended Title Tag |
|---|---|
| Homepage | Bespoke Custom Shower Enclosures London - Custom Showers |
| Bespoke Enclosures | Made to Measure Shower Enclosures - Custom Showers UK |
| Walk-In Showers | Walk-In Shower Enclosures - Custom Made to Measure - Custom Showers |
| Frameless Showers | Frameless Shower Enclosures UK - Bespoke Glass - Custom Showers |
| Contact/About | Custom Shower Specialists London SW6 - Get a Free Quote |

**Common Errors to Avoid:**
- Duplicate title tags across product/service pages
- Missing brand name
- Exceeding 60 characters (truncated in SERPs)
- Generic titles such as "Home" or "Products"

### 1.3 Meta Description Requirements

**Standard:** 150–160 characters, includes primary keyword, a clear value proposition, and a call to action.

| Page Type | Recommended Meta Description |
|---|---|
| Homepage | Custom-made shower enclosures designed and fitted in London. Frameless glass, bespoke trays, any size or shape. Free consultation - call today. |
| Bespoke Enclosures | Made to measure shower enclosures crafted to fit any bathroom. Custom glass, finishes, and sizes. Nationwide supply. Free quote available. |
| Walk-In Showers | Luxury walk-in shower enclosures made to your exact measurements. Frameless designs, premium glass, professional installation. Get your free quote. |

### 1.4 Heading Structure Requirements

Every page must have exactly one H1 containing the primary target keyword. Subsequent H2s should address user sub-questions and support the topic cluster. H3s should handle FAQ-style content and feature-specific detail.

**Homepage recommended heading hierarchy:**
- H1: Bespoke Custom Shower Enclosures — Made for Your Space
- H2: Why Choose a Custom Shower Enclosure?
- H2: Our Shower Enclosure Range
- H2: The Custom Showers Process
- H2: Serving London and Nationwide
- H2: What Our Customers Say
- H2: Frequently Asked Questions

### 1.5 Content Quality Standards

Based on competitor analysis, top-ranking pages for target keywords carry between 800 and 2,500 words of substantive content. The following content elements are required on each core page:

- Primary keyword in the first 100 words of body text
- Latent semantic keywords naturally integrated (e.g., "frameless glass," "wet room," "made to measure," "bespoke tray," "installation")
- At least one FAQ section targeting People Also Ask questions
- Pricing context (even a range) — pages with pricing outperform those without in commercial queries
- Process description (survey, design, manufacture, install)
- Trust signals: guarantee length, certifications, years of experience
- Minimum one internal link per 300 words pointing to relevant cluster pages

### 1.6 Image Optimisation Requirements

- All product and portfolio images must have descriptive alt text incorporating target keywords (e.g., `alt="frameless walk-in shower enclosure bespoke glass London"`)
- Images should be served in WebP or AVIF format
- No image should exceed 150KB for above-the-fold content; 300KB maximum for below-the-fold
- Filename convention: `bespoke-walk-in-shower-enclosure-london.webp` (not `IMG_4521.jpg`)

---

## Section 2: Technical SEO

### 2.1 Indexation Status — CRITICAL

| Check | Status | Severity |
|---|---|---|
| Google index (site: operator) | 0 pages indexed | Critical |
| Site accessibility (HTTP status) | 403 Forbidden | Critical |
| Robots.txt accessible | Unable to verify | Critical |
| XML Sitemap accessible | Unable to verify | Critical |
| Domain age | Registered 5 Dec 2025 (3 months old) | High Risk |

**Immediate Actions Required:**

1. Verify Googlebot is not blocked in `robots.txt` — check for `Disallow: /` or overly broad disallow rules
2. Confirm the site is not in "maintenance mode" or behind a login/password wall that blocks crawlers
3. Submit the domain to Google Search Console using the correct property type (`.uk` TLD requires domain property)
4. Create and submit an XML sitemap via Search Console
5. Request indexing for the homepage and all key landing pages using the URL Inspection tool
6. Resolve HTTP 403 responses — confirm whether these are IP-based, user-agent based, or a server misconfiguration

### 2.2 Crawlability and Site Architecture

Given the domain's very recent registration (December 2025) and zero indexed pages, the site architecture may be incomplete or not yet publicly launched. The following architecture is recommended for a custom shower enclosures business:

```
customshowers.uk/
├── /bespoke-shower-enclosures/
│   ├── /frameless-shower-enclosures/
│   ├── /walk-in-shower-enclosures/
│   ├── /corner-shower-enclosures/
│   └── /wet-room-enclosures/
├── /shower-trays/
│   └── /bespoke-shower-trays/
├── /installation/
│   └── /london-shower-installation/
├── /about/
├── /portfolio/
├── /blog/
│   ├── /bespoke-shower-cost-guide-uk/
│   ├── /frameless-vs-framed-shower-enclosures/
│   └── /walk-in-shower-vs-wet-room/
└── /contact/
```

**URL Rules:**
- Use hyphens, not underscores
- Keep slugs short and keyword-rich (e.g., `/frameless-shower-enclosures/` not `/products/category/shower-enclosures-frameless-glass-type/`)
- Maximum 3 directory levels deep for core pages
- Avoid parameter-based URLs for filterable content

### 2.3 Core Web Vitals Targets

Since the site cannot be measured live, the following targets must be met upon launch and maintained:

| Metric | Mobile Target | Desktop Target | Google Threshold |
|---|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | < 2.5s | Good: < 2.5s |
| INP (Interaction to Next Paint) | < 200ms | < 200ms | Good: < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.1 | Good: < 0.1 |

**Common CWV failure patterns to avoid:**
- Large, unoptimised hero images that delay LCP
- Google Fonts loaded synchronously (use font-display: swap)
- Layout shifts caused by images without explicit width/height attributes
- Third-party scripts (live chat, analytics, reviews) that block rendering
- Lazy-loading applied to above-the-fold images (this delays LCP, not prevents it)

**Hosting Recommendation:** Given the London address, the site should be hosted on UK-based infrastructure (e.g., AWS eu-west-2, Google Cloud europe-west2, or a UK CDN edge). Target TTFB under 200ms.

### 2.4 Mobile-First Indexing

Google uses mobile-first indexing for all new sites. Requirements:

- Viewport meta tag must be present: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- All content visible on mobile must be present in the HTML (no mobile-only content exclusions)
- Touch targets minimum 48x48px with 8px spacing
- No intrusive interstitials (full-screen pop-ups that block content on mobile)
- Font size minimum 16px for body text

### 2.5 Structured Data Implementation

The following schema types are recommended and should be implemented via JSON-LD:

**Organization schema (sitewide, in `<head>`):**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Custom Showers Ltd",
  "url": "https://customshowers.uk",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "49a Fulham High Street",
    "addressLocality": "London",
    "postalCode": "SW6 3JJ",
    "addressCountry": "GB"
  },
  "telephone": "[phone number]",
  "sameAs": ["[Google Business Profile URL]", "[Facebook URL]"]
}
```

**LocalBusiness schema (homepage):** Include `areaServed`, `openingHours`, `priceRange`, and `hasMap` properties.

**Product schema (product/service pages):** Include `name`, `description`, `image`, `brand`, `offers` with GBP pricing, and nested `AggregateRating` once reviews are collected.

**FAQPage schema (blog posts and service pages):** Apply to all FAQ sections — this is the fastest route to SERP feature capture for a new domain.

**BreadcrumbList schema:** Apply to all pages beyond the homepage to communicate site hierarchy to Google.

### 2.6 HTTPS and Security

- Confirm SSL certificate is valid and auto-renewing (Let's Encrypt or commercial SSL)
- Ensure all HTTP requests redirect to HTTPS (301, not 302)
- Ensure `www` and non-`www` versions both redirect to the canonical version (choose one and stick to it)
- Check for mixed content warnings (HTTP resources loaded on HTTPS pages)

### 2.7 XML Sitemap and Robots.txt

**robots.txt minimum requirements:**
```
User-agent: *
Disallow: /wp-admin/     (or equivalent CMS admin path)
Allow: /wp-admin/admin-ajax.php

Sitemap: https://customshowers.uk/sitemap.xml
```

**Sitemap requirements:**
- Include all indexable pages only (no 404s, 301s, or noindex pages)
- Update `<lastmod>` accurately when content changes
- Keep under 50,000 URLs and 50MB per sitemap file
- Reference sitemap URL in robots.txt AND submit via Search Console

---

## Section 3: Keyword Opportunities and Ranking Potential

### 3.1 Primary Keyword Targets

The following keywords represent the highest-impact targets based on commercial intent, search volume estimates, and competitive dynamics in the UK shower market.

| Keyword | Est. Monthly Volume (UK) | Difficulty | Intent | Priority |
|---|---|---|---|---|
| bespoke shower enclosures | 1,000–2,000 | High | Commercial | Primary |
| custom shower enclosures UK | 800–1,500 | High | Commercial | Primary |
| made to measure shower enclosures | 600–1,200 | High | Commercial | Primary |
| frameless shower enclosures UK | 1,500–3,000 | High | Commercial | Primary |
| walk-in shower enclosures | 5,000–10,000 | Very High | Commercial | Secondary |
| bespoke walk in shower | 400–800 | Medium-High | Commercial | Primary |
| bespoke shower tray | 300–600 | Medium | Transactional | Primary |
| custom shower enclosure London | 200–500 | Medium | Local | Quick Win |
| bespoke shower room | 500–1,000 | Medium-High | Commercial | Secondary |
| made to measure shower tray | 400–800 | Medium | Transactional | Primary |

### 3.2 Long-Tail and Low-Competition Opportunities

These keywords have lower volume but significantly higher conversion rates and lower keyword difficulty — ideal targets for a new domain building authority from scratch.

| Keyword | Est. Monthly Volume (UK) | Difficulty | Why Target |
|---|---|---|---|
| bespoke shower enclosure cost UK | 100–300 | Low-Medium | High buyer intent, FAQ content |
| custom frameless shower enclosure price | 100–200 | Low | Transactional, low competition |
| sloped ceiling shower enclosure bespoke | 50–150 | Low | Underserved niche, high conversion |
| loft conversion shower enclosure bespoke | 50–150 | Low | Specific problem, few competitors |
| bespoke shower tray any size | 100–200 | Low | Specific, commercial |
| walk-in shower enclosure Fulham | 50–100 | Very Low | Hyperlocal, immediate relevance |
| bespoke shower enclosure London SW6 | 10–50 | Very Low | Hyperlocal |
| how much does a bespoke shower cost UK | 200–500 | Low | Informational to commercial |
| frameless shower enclosure made to measure | 200–400 | Medium | Product-specific |
| matt black bespoke shower enclosure | 100–300 | Low | Trending finish, growing demand |
| brushed brass shower enclosure bespoke | 100–200 | Low | Trending finish |
| fluted glass shower enclosure custom | 100–300 | Low | 2026 design trend keyword |

### 3.3 Local SEO Keyword Targets

Based on the registered address at 49a Fulham High Street, London SW6 3JJ, the site should target London-specific and borough-level keywords:

| Keyword | Approach |
|---|---|
| custom shower enclosures London | Homepage and dedicated London service page |
| bespoke shower installation London | Service page targeting installation intent |
| shower enclosure installer Fulham | Google Business Profile primary category + local landing page |
| bespoke shower Kensington | Dedicated borough landing page |
| custom shower Chelsea | Dedicated borough landing page |
| bespoke bathroom shower Hammersmith | Dedicated borough landing page |
| shower enclosure fitter South West London | Service area page |

### 3.4 People Also Ask and Featured Snippet Targets

These are high-priority content targets for FAQ schema and featured snippet capture:

- "How much does a bespoke shower enclosure cost in the UK?"
- "How long does a custom shower take to install?"
- "What is the difference between a walk-in shower and a wet room?"
- "Can you get a shower enclosure made to measure?"
- "What glass thickness is best for a frameless shower enclosure?"
- "How do I maintain a frameless shower screen?"
- "Are bespoke shower trays worth it?"
- "What sizes do shower trays come in?"

### 3.5 Keyword Difficulty Context and Realistic Timeline

The UK custom shower enclosures market is contested by established brands with Domain Rating (DR) scores ranging from 30 (regional specialists) to 70+ (Merlyn, Matki, Kudos). A new domain registered in December 2025 realistically faces the following ranking timeline:

| Timeframe | Realistic Expectation |
|---|---|
| Months 1–3 | Technical foundation, indexation, initial crawling by Google |
| Months 3–6 | Long-tail and hyperlocal keywords begin ranking (positions 15–40) |
| Months 6–9 | Local SEO keywords enter top 10; long-tail targets reach positions 5–15 |
| Months 9–12 | Mid-competition keywords begin moving to page 2/bottom of page 1 |
| Months 12–18 | Competitive primary keywords reachable with consistent content and link acquisition |

---

## Section 4: Backlink Profile Overview

### 4.1 Current State

The domain is 3 months old. With zero indexed pages and no evidence of link-building activity, the backlink profile is essentially empty. Expected metrics at this stage:

- Domain Rating (Ahrefs DR): 0–5
- Domain Authority (Moz DA): 0–5
- Referring Domains: 0–3 (possibly Companies House and domain registrar only)
- Organic Keywords Ranking: 0

### 4.2 Competitor Backlink Benchmarks

To compete for primary keywords, customshowers.uk will need to close the authority gap with these established competitors:

| Competitor | Estimated DR | Est. Referring Domains | Key Link Sources |
|---|---|---|---|
| kudosshowers.co.uk | 50–60 | 500–800 | Trade press, manufacturer directories, Made in Britain |
| matki.co.uk | 55–65 | 400–700 | Architecture/design press, luxury interiors blogs |
| merlynshowering.com | 60–70 | 700–1,200 | Bathroom retailer links, specification databases |
| showerpower.co.uk | 30–45 | 200–400 | Local business directories, trade associations |
| caledora.glass | 20–35 | 50–150 | Local press, glass industry directories |
| just-frameless-showers.co.uk | 25–40 | 100–250 | Product review sites, installer forums |

### 4.3 Link Building Strategy for a New Domain

**Phase 1 (Months 1–3): Foundation Citations**
These are free/low-cost and establish baseline trust signals:

- Google Business Profile (free, essential for local SEO)
- Bing Places for Business
- Yell.com business listing
- Trustpilot or Houzz profile (reviews platform with DR 80+)
- FreeIndex bathroom installer listing
- Checkatrade or Rated People profile
- Companies House natural link (already exists)
- FENSA or equivalent glazing certification directory
- Glass and Glazing Federation (GGF) member directory
- The Bathroom Manufacturers Association

**Phase 2 (Months 3–6): Content-Led Link Acquisition**
Publish genuinely useful content that earns links organically and through targeted outreach:

- Original cost research: "Custom Shower Enclosures UK: 2026 Price Study" — target home improvement journalists and bathroom trade press
- Visual portfolio with before/after case studies — pitch to interior design blogs
- Interactive shower size calculator — linkable tool, shareable resource
- "Bespoke Shower Design Guide" PDF — position as definitive resource for architects and bathroom designers

**Phase 3 (Months 6–12): Digital PR and Trade Authority**
- HARO/Connectively responses for bathroom, home improvement, and property journalists
- Guest posts on bathroom/interior design trade publications (BMA News, PHARM News, Specification Online)
- Press releases to property media when notable installations complete
- Collaboration with London-based interior designers and architects for mutual referrals and co-authored content

**Monthly Link Targets (realistic for budget-constrained new business):**

| Source Type | Target/Month | Min DR | Approach |
|---|---|---|---|
| Business directories | 5–10 | 20+ | Manual submission |
| Digital PR / editorial | 1–3 | 50+ | Journalist outreach |
| Content outreach | 2–4 | 30+ | Guest contribution, resource link |
| Trade associations | 1–2 | 40+ | Membership or certification listing |

---

## Section 5: Competitor Landscape

### 5.1 Primary SERP Competitors

The following competitors dominate rankings for the target keyword set. Each represents a different competitive archetype:

**Tier 1 — National Brands (Hardest to Displace)**

- **Merlyn Showering** (merlynshowering.com) — Design-led premium brand, strong bespoke range, backed by decades of brand authority. Competes on brand recognition and retailer distribution.
- **Matki** (matki.co.uk) — Bristol-based manufacturer, 40+ year heritage, premium British-made positioning, 10-year guarantee. Extremely strong E-E-A-T signals.
- **Kudos Showers** (kudosshowers.co.uk) — Made in Britain member, manufacturer credibility, strong content depth on bespoke solutions page.

**Tier 2 — Specialist Mid-Market Competitors**

- **The Shower Lab** (theshowerlab.com) — Strong bespoke M2M proposition, positioned for complex installations (sloped ceilings, floor-to-ceiling). Direct competitor.
- **Just Frameless Showers** (just-frameless-showers.co.uk) — Specialist frameless shower supplier with good SEO presence. E-commerce model.
- **Shower Power** (showerpower.co.uk) — Sussex-based, since 1999, serves trade and residential. Good local authority model to emulate for London.

**Tier 3 — Regional Specialists (Most Beatable)**

- **Caledora Glass** (caledora.glass) — Bespoke glass shower enclosures, free home survey, 3D design, UK manufacturing. Direct service model competitor. Lower DR, more achievable to outrank.
- **Clearly Glass Ltd** (clearlyglassltd.co.uk) — Devon-based bespoke shower design, strong regional model but geographically distant.
- **360 GSS** (360gss.co.uk) — London-focused bespoke shower installer, direct local competitor, 10–14 day delivery claim. Priority competitor to monitor.

### 5.2 Competitive Content Gaps

Analysis of competitor content reveals the following opportunities where ranking pages exist but content quality is weak or incomplete:

| Content Topic | Competitor Status | Opportunity |
|---|---|---|
| Bespoke shower cost guide UK 2026 | Fragmented, outdated pricing on most sites | Create comprehensive, current price guide |
| Sloped ceiling / loft conversion showers | Mentioned but not dedicated pages | Dedicated page targeting this specific problem |
| Shower enclosure for unusual spaces | Very thin content across competitors | Detailed guide with visual examples |
| Matt black and brushed brass finishes | Product listings only, no editorial | Trend-led buying guide targeting finish keywords |
| Bespoke shower maintenance guide | Almost entirely absent | How-to guide targeting post-purchase queries |
| Frameless shower vs. framed shower comparison | Exists but thin | Comprehensive comparison with schema |
| Walk-in shower vs. wet room UK | Some content but FAQ schema not implemented | Add FAQ schema for PAA capture |
| Bespoke shower London borough pages | 360 GSS has some, most competitors absent | Create borough-level local landing pages |

### 5.3 SERP Feature Landscape

For the primary target keywords, the following SERP features currently appear in Google UK results:

| Feature | Keywords Triggering It | Opportunity |
|---|---|---|
| Featured Snippet | "how much does a bespoke shower cost" | Target with H2 question + concise answer + FAQ schema |
| People Also Ask | "bespoke shower enclosures UK," "custom shower installation" | Address PAA questions explicitly in content |
| Local Pack (Map) | "shower installer London," "shower enclosure fitter near me" | Google Business Profile is essential to appear here |
| Image Pack | "bespoke shower designs," "frameless shower ideas" | High-quality portfolio images with keyword-rich alt text |
| Video Carousel | "how to install a walk-in shower" | Optional: installation process video |

---

## Section 6: Local SEO Signals

### 6.1 Google Business Profile — Not Established (Critical Gap)

There is no verified Google Business Profile found for Custom Showers Ltd at the Fulham High Street address. For a local service business targeting London, the GBP is the single highest-ROI SEO asset outside of the website itself. It controls:

- Appearance in Google Maps results
- Local Pack listings (3-pack shown above organic results)
- Knowledge Panel for branded searches
- Star ratings visible in SERP snippets
- Google Posts and product/service listings

**Immediate GBP Setup Requirements:**

- Business name: Custom Showers Ltd (match Companies House exactly)
- Primary category: Shower supplier / Shower installation service
- Secondary categories: Bathroom remodeling contractor, Glass merchant
- Address: 49a Fulham High Street, London, SW6 3JJ
- Service area: Add all London boroughs served (Fulham, Kensington, Chelsea, Hammersmith, Wandsworth, Westminster, etc.)
- Phone number: Consistent NAP across all citations
- Website: https://customshowers.uk
- Business hours: Set accurately
- Photos: Upload minimum 20 high-quality images (exterior, team, finished installations)
- Services: List every service type with descriptions
- Products: List product ranges with images and pricing where possible

### 6.2 NAP Consistency

NAP (Name, Address, Phone) consistency across all online directories is a foundational local SEO signal. All citations must match exactly:

- Name: Custom Showers Ltd
- Address: 49a Fulham High Street, London, SW6 3JJ
- Phone: [consistent number across all listings]

**Priority citation directories for a UK shower/bathroom business:**

| Directory | Priority |
|---|---|
| Google Business Profile | Critical |
| Bing Places | High |
| Yell.com | High |
| Checkatrade | High |
| Rated People | High |
| Houzz | High |
| FreeIndex | Medium |
| Thomson Local | Medium |
| 192.com | Medium |
| Bark.com | Medium |

### 6.3 Review Strategy

Reviews are a ranking signal for both local pack and organic results, and a critical E-E-A-T trust signal. Since the company is newly registered:

- Request reviews from every completed installation client — use a direct GBP review link sent via SMS/email
- Target: 10 reviews within the first 3 months, 25+ within 6 months
- Respond to every review (positive and negative) within 48 hours
- Never incentivise reviews — this violates Google's policies
- Encourage reviews on Houzz and Trustpilot in addition to Google

### 6.4 Local Content Strategy

Each major London borough served should have a dedicated landing page. Minimum content per page:

- 500+ words of unique content (not templated with only the location name swapped)
- Mentions of local landmarks, architectural characteristics, and typical property types
- Real project examples from that area where possible
- Embedded Google Map
- LocalBusiness schema with area-specific references

Priority borough pages to create first (based on highest search intent and proximity to SW6):

1. /shower-enclosures-fulham/
2. /shower-enclosures-chelsea/
3. /shower-enclosures-kensington/
4. /shower-enclosures-hammersmith/
5. /shower-enclosures-wandsworth/
6. /shower-enclosures-south-west-london/

---

## Section 7: Content Gaps and Opportunities

### 7.1 Proposed Topic Cluster Architecture

The following cluster model organises content around the three highest-value pillar topics, each supported by satellite content that builds topical authority and captures long-tail traffic.

**Pillar 1: Bespoke Shower Enclosures (Primary Commercial Intent)**
Target keyword: "bespoke shower enclosures UK" | Est. volume: 1,000–2,000/month

Cluster content:
- /blog/bespoke-shower-enclosure-cost-uk/ — "How Much Does a Bespoke Shower Enclosure Cost in the UK? (2026 Guide)"
- /blog/bespoke-vs-standard-shower-enclosures/ — "Bespoke vs Standard Shower Enclosures: What's the Difference?"
- /blog/how-to-measure-for-bespoke-shower-enclosure/ — "How to Measure Your Bathroom for a Bespoke Shower Enclosure"
- /blog/bespoke-shower-enclosure-glass-types/ — "Which Glass Type Is Best for a Bespoke Shower Enclosure?"
- /blog/bespoke-shower-installation-process/ — "What Happens During a Bespoke Shower Installation? (Step by Step)"
- /frameless-shower-enclosures/ — (Pillar 2 connection point)

**Pillar 2: Frameless Shower Enclosures (Style + Commercial Intent)**
Target keyword: "frameless shower enclosures UK" | Est. volume: 1,500–3,000/month

Cluster content:
- /blog/frameless-vs-framed-shower-screens/ — "Frameless vs Framed Shower Screens: Which Is Right for Your Bathroom?"
- /blog/frameless-shower-enclosure-glass-thickness/ — "What Glass Thickness Do You Need for a Frameless Shower?"
- /blog/how-to-clean-frameless-shower-screen/ — "How to Keep a Frameless Shower Screen Clean (Without the Streaks)"
- /blog/frameless-shower-cost-uk/ — "How Much Does a Frameless Shower Enclosure Cost in the UK?"
- /blog/small-bathroom-frameless-shower-ideas/ — "Frameless Walk-In Shower Ideas for Small Bathrooms"

**Pillar 3: Walk-In Showers (Broadest Volume, Highest Competition)**
Target keyword: "walk-in shower enclosures" | Est. volume: 5,000–10,000/month

Note: This is a high-competition cluster. Initial focus should be on sub-topics and long-tails before attempting to rank for the head term directly.

Cluster content:
- /blog/walk-in-shower-vs-wet-room-uk/ — "Walk-In Shower vs Wet Room: Which Is Better for a UK Bathroom?"
- /blog/walk-in-shower-tray-sizes-uk/ — "Walk-In Shower Tray Sizes UK: What Size Do You Need?"
- /blog/walk-in-shower-cost-uk-2026/ — "Walk-In Shower Cost UK 2026: Materials, Installation, and What to Budget"
- /blog/walk-in-shower-ideas-small-bathroom/ — "Walk-In Shower Ideas for Small UK Bathrooms"
- /blog/loft-conversion-shower-enclosure/ — "Installing a Shower in a Loft Conversion: Bespoke Solutions for Sloped Ceilings"

### 7.2 High-Priority Standalone Content (Quick Win Content Gaps)

These are pages with clear search demand that competitors handle poorly — high opportunity for a new entrant to rank quickly:

| Content Piece | Target Keyword | Volume Est. | Why It's a Gap |
|---|---|---|---|
| "Bespoke Shower Tray Cost UK 2026" | bespoke shower tray cost | 200–400/mo | Versital page exists but outdated and thin |
| "Matt Black Shower Enclosures: Complete Guide" | matt black shower enclosure bespoke | 200–500/mo | Trend content absent from specialists |
| "Shower Enclosure for Loft Conversions" | loft conversion shower enclosure | 100–250/mo | Almost no specialist content |
| "How Long Does a Bespoke Shower Take?" | how long does bespoke shower installation take | 100–200/mo | High PAA capture potential |
| "Bespoke Shower Design London: What to Expect" | bespoke shower London | 300–600/mo | 360 GSS is the only competitor with this content |
| "Fluted Glass Shower Enclosures UK" | fluted glass shower screen | 200–500/mo | Trending product, very thin specialist content |

### 7.3 Content Format Recommendations

Based on competitor content analysis and SERP feature patterns:

- **Price guides:** Consistently earn featured snippets and PAA inclusions — always include a clear, concise answer in the first paragraph before elaborating
- **Comparison articles:** "X vs Y" formats attract high commercial intent traffic; use a summary comparison table near the top for Featured Snippet eligibility
- **How-to guides:** Include numbered steps with H3 headings for each step — Google can pull individual steps into rich results
- **FAQ sections:** Every service page and blog post should end with a minimum 4-question FAQ section using FAQ schema
- **Case studies/portfolio pages:** Attract image pack appearances and support E-E-A-T for service businesses

### 7.4 Content Calendar — First 6 Months

**Months 1–2 (Foundation):**
- Homepage — full optimisation, 1,200 words minimum
- Bespoke Shower Enclosures service page — pillar page 1
- Frameless Shower Enclosures service page — pillar page 2
- Google Business Profile — complete setup
- About page — E-E-A-T signals, team credentials

**Month 3:**
- "How Much Does a Bespoke Shower Enclosure Cost in the UK? (2026)"
- "Frameless vs Framed Shower Screens: Which Is Right for You?"
- Walk-In Showers service page — pillar page 3
- Bespoke Shower Trays service page

**Month 4:**
- "Walk-In Shower vs Wet Room: Which Is Better?"
- "Shower Enclosures for Loft Conversions — Bespoke Solutions"
- London service page (citywide)
- Fulham local landing page

**Month 5:**
- "Fluted Glass Shower Enclosures — The 2026 Trend Guide"
- "Matt Black Shower Enclosures: A Complete Buying Guide"
- Chelsea local landing page
- Kensington local landing page

**Month 6:**
- Case study: first completed installation
- "How Long Does a Custom Shower Installation Take?"
- "Walk-In Shower Cost UK 2026: Full Price Breakdown"
- Portfolio gallery page with schema-tagged images

---

## Section 8: Actionable Recommendations Prioritised by Impact

### Priority 1 — Critical (Week 1): Fix Indexation Blockage

Without resolving indexation, every other SEO effort is wasted.

**Actions:**
1. Diagnose the HTTP 403 response — determine if it is robots.txt, htaccess, WAF/firewall, or CMS configuration
2. Whitelist Googlebot IP ranges if using a firewall or CDN
3. Ensure robots.txt at `https://customshowers.uk/robots.txt` is accessible and does not contain `Disallow: /`
4. Set up Google Search Console — verify ownership via DNS TXT record (most reliable for new domains)
5. Submit sitemap and request URL inspection/indexing for the homepage

**Expected Impact:** Without this, the site has no organic search presence. Fixing it unlocks all subsequent work.
**Effort:** Low-Medium | **Impact:** Critical

---

### Priority 2 — Critical (Weeks 1–2): Google Business Profile

**Actions:**
1. Create and verify Google Business Profile at 49a Fulham High Street, London SW6 3JJ
2. Complete 100% of profile fields — category, services, hours, website, phone
3. Upload 20+ high-quality images
4. Add service descriptions for each offering
5. Begin requesting reviews from any early customers

**Expected Impact:** Immediate local pack visibility for "custom showers London," "shower enclosures Fulham," and similar queries. Local pack appears above organic results and drives high-intent clicks.
**Effort:** Low | **Impact:** Very High

---

### Priority 3 — High (Weeks 2–4): Core Page Development

**Actions:**
1. Publish and fully optimise the homepage (1,200+ words, primary keyword in title/H1/first paragraph, FAQ section, Organisation and LocalBusiness schema, internal links to service pages)
2. Publish Bespoke Shower Enclosures pillar page (1,500+ words, Product schema, FAQ schema, internal cluster links)
3. Publish Frameless Shower Enclosures service page
4. Publish Contact page with embedded Google Map, NAP matching GBP exactly

**Expected Impact:** Provides Google with indexable, substantive content to evaluate. Begins signalling topical relevance to the target keyword cluster.
**Effort:** High | **Impact:** High

---

### Priority 4 — High (Month 2): Technical Foundation

**Actions:**
1. Run PageSpeed Insights on all published pages — target 90+ score on desktop, 75+ on mobile
2. Convert all images to WebP format, implement `width` and `height` attributes
3. Implement JSON-LD schema for Organization, LocalBusiness, FAQPage, and BreadcrumbList across the site
4. Ensure SSL is valid and all HTTP redirects to HTTPS (301)
5. Confirm canonical tags are set correctly on all pages
6. Set up structured XML sitemap and verify submission in Search Console

**Expected Impact:** Removes technical barriers to ranking; positions the site for rich result eligibility from day one.
**Effort:** Medium | **Impact:** High

---

### Priority 5 — High (Month 2–3): Foundation Citation Building

**Actions:**
1. Submit to Yell.com, Bing Places, Checkatrade, Rated People, Houzz, Bark.com
2. Create Trustpilot profile and begin collecting reviews
3. Join the Glass and Glazing Federation (GGF) — membership provides high-DR directory link plus trust signal
4. Verify Companies House listing has website URL included (free, DR 85+ link)
5. Ensure NAP is 100% consistent across all listings

**Expected Impact:** Establishes local citation foundation required for Local Pack ranking; provides initial backlinks from high-authority directories.
**Effort:** Low-Medium | **Impact:** High (for local SEO)

---

### Priority 6 — Medium (Months 3–4): Cost Guide Content

**Actions:**
1. Publish "How Much Does a Bespoke Shower Enclosure Cost in the UK? 2026 Guide" — 2,000+ words with FAQ schema
2. Publish "Walk-In Shower Cost UK 2026: Full Price Breakdown" — targeting featured snippet
3. Add pricing context (ranges) to all service pages — "from £X" signals commercial intent match

**Expected Impact:** Cost/price queries have high buyer intent and strong PAA/Featured Snippet capture potential. A single well-constructed cost guide can drive 50–200 qualified visits per month within 6–9 months.
**Effort:** Medium | **Impact:** Medium-High

---

### Priority 7 — Medium (Months 4–6): Local Landing Pages

**Actions:**
1. Create borough-level landing pages for Fulham, Chelsea, Kensington, Hammersmith, Wandsworth
2. Each page must have unique content (500+ words, not templated), real project references where available, embedded map, and LocalBusiness schema
3. Build internal links from homepage and GBP service descriptions to each borough page

**Expected Impact:** Borough-level keywords have low competition and high local commercial intent. This is where a London-based new entrant can realistically achieve top-3 rankings within 6–9 months.
**Effort:** Medium | **Impact:** Medium-High

---

### Priority 8 — Medium (Months 3–6): Link Building Campaign

**Actions:**
1. Publish the "Custom Shower Enclosures UK 2026 Cost Study" as a digital PR asset — pitch to home improvement journalists at The Guardian Home, Homes & Gardens, PHARM News
2. Produce a visual "Bespoke Shower Design Portfolio" with case studies — pitch to interior design blogs for editorial coverage
3. Identify broken links on competitor-adjacent resources (bathroom directories, home improvement guides) and offer replacement content
4. Monitor HARO/Connectively for bathroom, home improvement, and property journalist requests — respond with expert commentary using director credentials

**Expected Impact:** Even 3–5 high-DR editorial links in the first 6 months will meaningfully accelerate Domain Rating growth and begin moving mid-competition keywords toward the first page.
**Effort:** High | **Impact:** Medium-High (compounding)

---

### Priority 9 — Medium (Month 5+): Trend and Informational Content

**Actions:**
1. Publish "Fluted Glass Shower Enclosures: The 2026 Guide" — captures emerging trend keyword
2. Publish "Matt Black and Brushed Brass Shower Finishes: A Complete Guide" — finish-specific buying guide
3. Publish "Shower Enclosure for a Loft Conversion: Bespoke Solutions"
4. Publish "Frameless vs Framed Shower Screens: Which Is Right for Your Bathroom?"

**Expected Impact:** Builds topical authority around the product category; drives informational-to-commercial funnel traffic; supports E-E-A-T through content depth.
**Effort:** Medium | **Impact:** Medium

---

### Priority 10 — Ongoing (Month 1+): Measurement and Iteration

**Actions:**
1. Configure Google Search Console — monitor Index Coverage report weekly; flag any 404, redirect, or noindex issues immediately
2. Set up GA4 with organic traffic segmentation — separate branded vs non-branded search traffic from day one
3. Track keyword rankings weekly for all primary and long-tail targets using a free tool (Google Search Console Performance report) or paid tool (Ahrefs, SEMrush, or Mangools)
4. Review Core Web Vitals report in Search Console monthly — fix any pages falling into "Needs Improvement" or "Poor" status
5. Audit GBP insights monthly — track search queries, direction requests, and call clicks

**Expected Impact:** Data-driven iteration prevents wasted effort on low-impact work and surfaces ranking opportunities as the domain ages and Google's trust increases.
**Effort:** Low | **Impact:** Compounding over time

---

## Summary Scorecard

| SEO Category | Current Score | Target (12 months) |
|---|---|---|
| Technical SEO (Indexation & Crawlability) | 0/20 | 17/20 |
| On-Page SEO (Title, Meta, Content, Schema) | 0/20 | 16/20 |
| Keyword Coverage (Rankings in target set) | 0/20 | 10/20 |
| Backlink Authority (DR and Referring Domains) | 1/20 | 8/20 |
| Local SEO (GBP, Citations, Reviews) | 2/20 | 16/20 |
| Content Depth (Topic Coverage) | 0/20 | 12/20 |
| **Overall** | **3/120 (2.5%)** | **79/120 (66%)** |

---

## Appendix A: Key Tools for Ongoing SEO Management

| Tool | Purpose | Cost |
|---|---|---|
| Google Search Console | Indexation, CWV, manual actions, keyword data | Free |
| Google Analytics 4 | Traffic analysis, conversion tracking | Free |
| Google Business Profile | Local search and Maps management | Free |
| Ahrefs Webmaster Tools | Backlink monitoring, technical audit | Free (limited) |
| PageSpeed Insights | Core Web Vitals measurement | Free |
| Google Rich Results Test | Schema validation | Free |
| Screaming Frog SEO Spider | Full site crawl and technical audit | Free up to 500 URLs |
| Mangools / Ubersuggest | Keyword tracking and research | Low cost |

---

## Appendix B: Competitor Reference URLs

- Merlyn Bespoke Enclosures: https://www.merlynshowering.com/bespoke-shower-enclosures-by-merlyn
- Kudos Bespoke Solutions: https://www.kudosshowers.co.uk/bespoke-solutions/
- The Shower Lab: https://www.theshowerlab.com/
- Caledora Glass Bespoke Showers: https://caledora.glass/bespoke-showers/
- Shower Power: https://showerpower.co.uk/
- 360 GSS London: https://360gss.co.uk/bespoke-showers-in-london-elevating-bathroom-luxury-to-new-heights/
- Just Frameless Showers: https://just-frameless-showers.co.uk/bespoke-service-3-w.asp
- Elegant Showers (blog benchmark): https://www.elegantshowers.co.uk/blog/
- Livinghouse Bespoke: https://www.livinghouse.co.uk/acatalog/bespoke-showers.html

---

*Report compiled using live search data, Google index operator queries, Companies House records, and competitor SERP analysis conducted on 11 March 2026. Site-level metrics could not be directly verified due to HTTP 403 access restrictions on the customshowers.uk domain — resolving this is the audit's most urgent recommendation.*
