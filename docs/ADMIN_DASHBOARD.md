# Admin dashboard

The dashboard lives at **customshowers.uk/admin**, behind a GitHub sign-in.
It shows the jobs sent from the shower designer (with the drawings, every
measurement the customer took, the cut sizes and a printable fitting sheet),
the quote-form enquiries, lets you change the site's pictures, and shows
Cloudflare traffic and deployments and the Google Business Profile.

Written 3 November 2026. Everything below is what has to exist for each part
to work; the dashboard says plainly which parts are not connected yet.

## How it fits together

| Piece | Where | Deployed how |
|---|---|---|
| The dashboard pages | `src/admin/` in the website build, route `/admin` | With the site, by Cloudflare Pages on every push to `main` |
| Its server | `admin-worker/worker.js` → worker `customshowers-admin` | Pasted into the Cloudflare dashboard (new worker, same account) |
| Jobs from the designer | `design-worker/worker.js` v15 → worker `customshowers-design` | Paste `design-worker/worker.paste.js` over the live worker, add the bindings |
| Quote-form enquiries | `contact-worker/worker.js` v2 → worker `customshowers-contact` | Paste over the live worker, add the bindings, keep its secrets |
| The database | Cloudflare D1 `customshowers` (id `2e9260d0-63a5-4e3b-9ed6-5adb7c3d6785`), created 3 Nov 2026 with its tables | Already exists |
| Drawings and photos | KV namespace `customshowers-files` (id `59246ea5bf0b4f92814dd018b22c755d`) | Already exists; swap for R2 when R2 is enabled (below) |
| Site pictures | `src/content/site-images.json` and `public/images/site/` | Committed to the repo by the dashboard as you; Pages redeploys |

The live `customshowers-contact` worker was not deployed from this repository.
The version in `contact-worker/` keeps everything it did (Turnstile, the
Supabase copy for the CRM portal, the Google Ads conversion, the emails), and
adds the dashboard copy and the customer's photo. It no longer tells the
customer "something went wrong" when only the Supabase copy fails.

## Set-up, in order

### 1. Deploy the admin worker

1. Cloudflare dashboard → Workers & Pages → Create → Worker. Name it exactly
   `customshowers-admin`. Deploy the placeholder.
2. Edit code → select all → paste `admin-worker/worker.js` → Deploy.
3. Settings → Bindings → add:
   - D1 database, variable name `JOBS`, database `customshowers`
   - KV namespace, variable name `FILES_KV`, namespace `customshowers-files`
4. Note the worker's URL. It should be
   `https://customshowers-admin.vcwvk4sm9m.workers.dev`; if it is different,
   set `VITE_ADMIN_API_URL` to it in the Pages project's build variables and
   redeploy the site.

Opening the URL in a browser should show `customshowers-admin v1 — the
dashboard's API`.

### 2. Create the GitHub OAuth app

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Application name `Custom Showers admin`, homepage
   `https://customshowers.uk/admin`, authorization callback URL
   **`https://customshowers-admin.vcwvk4sm9m.workers.dev/auth/github/callback`**
   (your worker's URL plus `/auth/github/callback`).
3. Generate a client secret.
4. On the admin worker, Settings → Variables and Secrets:

| Name | Value |
|---|---|
| `GITHUB_CLIENT_ID` | from the OAuth app |
| `GITHUB_CLIENT_SECRET` | from the OAuth app (secret) |
| `ALLOWED_LOGINS` | GitHub logins allowed in, comma-separated. Defaults to `matthoppy`. |
| `ADMIN_ORIGIN` | optional, defaults to `https://customshowers.uk` |
| `GITHUB_REPO` | optional, defaults to `matthoppy/CustomShowers-Website` |
| `GITHUB_BRANCH` | optional, defaults to `main` |

Signing in asks GitHub for `read:user` and `repo`. The `repo` scope is what
lets the Pictures page commit to the repository as you; the token is kept in
the dashboard's own D1 sessions table, never in the browser. Sessions last 30
days; Sign out deletes one.

Then open customshowers.uk/admin and sign in. An account not on the list is
told so and refused.

### 3. Deploy the design worker v15 (jobs)

1. Workers & Pages → `customshowers-design` → Edit code → select all → paste
   `design-worker/worker.paste.js` → Deploy. The browser check should now say
   **v15**.
2. Settings → Bindings → add the same two bindings as above: `JOBS` →
   `customshowers`, `FILES_KV` → `customshowers-files`.
3. Do not touch the existing secrets.

From then on every design sent from the designer is kept with its drawings
and photos and appears under Jobs within seconds. The email still goes as it
always has; if the database is ever unavailable the email is unaffected.

### 4. Deploy the contact worker v2 (quote forms)

1. Workers & Pages → `customshowers-contact` → Edit code → select all → paste
   `contact-worker/worker.js` → Deploy. A browser visit should say
   `customshowers-contact v2`.
2. Settings → Bindings → add `JOBS` → `customshowers` and `FILES_KV` →
   `customshowers-files`.
3. Leave the existing secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ALLOWED_ORIGIN`) as they are. The
   Supabase copy keeps feeding the CRM portal when it is set and is optional.

Then send one test enquiry from the home page form. It should appear under
Quote forms with its photo, and in the email.

### 5. Cloudflare data (Site page)

1. Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom.
   Permissions: **Account · Workers Scripts · Read**, **Account · Cloudflare
   Pages · Read**, **Zone · Analytics · Read** (zone customshowers.uk). Account
   Analytics Read is also needed for the workers' request counts.
2. On the admin worker set:

| Name | Value |
|---|---|
| `CF_API_TOKEN` | the token (secret) |
| `CF_ACCOUNT_ID` | Workers & Pages → overview, right-hand side |
| `CF_ZONE_ID` | the customshowers.uk zone overview, right-hand side |
| `CF_PAGES_PROJECT` | optional, defaults to `customshowers-website` |

### 6. Google Business Profile

This one is the slowest, because Google gates the API.

1. Google Cloud console → a project → APIs & Services → enable **My Business
   Account Management API**, **My Business Business Information API**,
   **Business Profile Performance API** and **Google My Business API**.
2. Google requires a one-off access request for the Business Profile APIs
   (the form linked from the API's overview page); until approved, the
   project's quota is zero and the Google page shows the error Google returns.
3. APIs & Services → Credentials → Create OAuth client ID → Web application.
   Authorised redirect URI:
   `https://customshowers-admin.vcwvk4sm9m.workers.dev/auth/google/callback`.
   Configure the consent screen with the Google account that manages the
   listing as a test user if the app stays in testing.
4. On the admin worker set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
5. In the dashboard, Google profile → Connect Google, and sign in with the
   account that manages the listing. The refresh token is kept in the
   dashboard's settings table; Disconnect removes it.

The page shows listing views, website clicks, calls and direction requests
for the period (Google lags about two days), and the latest ten reviews with
the average. The first account and location on the Google login are used.

### 7. Pictures

Nothing to set up beyond the GitHub sign-in. Pictures → replace, describe,
reorder → Publish. The dashboard downscales uploads to at most 2000px JPEG,
commits them under `public/images/site/` with the manifest
`src/content/site-images.json` in one commit, and the site rebuilds. A
replaced picture under `public/images/site/` that nothing uses any more is
removed in the same commit. The commit appears in the repository history as
you, with the message you typed.

## Switching the file store to R2

R2 is not enabled on the account yet, so the drawings and photos go into the
KV namespace. KV is fine for this (values up to 25MB, the biggest enquiry is
under 8MB). When R2 is enabled:

1. R2 → Create bucket `customshowers-files`.
2. On the admin, design and contact workers, add a binding R2 bucket
   `FILES` → `customshowers-files`. The workers prefer `FILES` when both are
   bound. Old jobs stay readable from KV until you remove that binding.

## Working on the dashboard without a server

Open `/admin?mock=1` on a local `npm run dev` (or the deployed site). The
dashboard then runs against sample data built with the real configurator
engine: three jobs, three enquiries, traffic, deployments and a connected
Google profile. The badge "Sample data" shows while it is on; `?mock=0` turns
it off. The browser tests use this mode.

## What is kept, and where

- `jobs`: one row per design, with the customer, status, notes, the summary,
  the whole enquiry payload (including the design, so the drawings can be
  redrawn) and the list of files.
- `job_events`: who changed what and when.
- `quotes`: one row per quote-form enquiry, with the message, address,
  attribution (UTM, gclid), status and notes.
- `sessions`: dashboard sign-ins, with the GitHub token for commits.
- `settings`: the Google refresh token and the chosen location.
- Files in the store under `jobs/<id>/<filename>` and `quotes/<id>/<name>`.

## Checking it works

- Admin worker URL in a browser → version string.
- `/admin` → sign in with GitHub → Overview.
- Send a design from the designer → it appears under Jobs with drawings and
  photos; open it; change its status; open the fitting sheet and print it.
- Send a quote-form enquiry → it appears under Quote forms.
- Pictures → replace the hero → Publish → the commit appears on GitHub and,
  a minute later, the Site page lists the deployment as success and the
  home page shows the new picture.
