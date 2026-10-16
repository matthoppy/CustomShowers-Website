# Turnstile Configuration Fix for Preview Domains

## Issue
The Review step shows a Turnstile "security check could not load" error on Cloudflare Pages preview domains (e.g., `*.customshowers-website-bfs.pages.dev`).

## Root Cause
The Turnstile widget site key `0x4AAAAAACmVMi3ZDLDzTYwv` is configured in the Cloudflare dashboard with allowed hostnames. Preview domains are not included in the allowed list, causing the widget to fail to load.

## Current Configuration
- **Site Key**: `0x4AAAAAACmVMi3ZDLDzTYwv` (hardcoded in `src/configurator/tenant.ts`)
- **Can be overridden** via `VITE_TURNSTILE_SITE_KEY` environment variable in Cloudflare Pages settings
- **Secret Key**: Set as `TURNSTILE_SECRET_KEY` in Workers & Pages dashboard for the `customshowers-design` worker

## Required Dashboard Changes

### Step 1: Update Turnstile Widget Hostnames
1. Go to **Cloudflare Dashboard** → **Turnstile**
2. Find the widget with site key `0x4AAAAAACmVMi3ZDLDzTYwv`
3. Edit the widget settings
4. In the "Domains" section, add the following patterns:
   - `customshowers.uk` (production)
   - `*.customshowers.uk` (production subdomains)
   - `*.customshowers-website-bfs.pages.dev` (preview deployments)
   - `localhost` (local development, if not already present)
5. Save the changes

### Step 2: Verify Worker Environment Variables
Ensure the `customshowers-design` Worker has the correct secret key:
1. Go to **Workers & Pages** → **customshowers-design** → **Settings** → **Variables and Secrets**
2. Verify `TURNSTILE_SECRET_KEY` is set and matches the secret key for site key `0x4AAAAAACmVMi3ZDLDzTYwv`
3. If missing or incorrect, add/update it

### Step 3: Test
1. After updating the Turnstile widget domains, deploy a preview or visit an existing preview URL
2. Navigate to the Review step in `/design-shower`
3. Verify the Turnstile widget loads without errors
4. The security check should either:
   - Complete silently (most common, as the widget uses `interaction-only` mode)
   - Show a checkbox challenge if Cloudflare determines the visitor needs verification

## Notes
- The application already handles the "widget failed to load" case gracefully: customers can still submit their design, and the email is flagged for manual review
- Production domain `customshowers.uk` should continue to work without changes
- Adding wildcard preview domains does not weaken security - Turnstile still verifies the token server-side with the secret key
- The widget is in `interaction-only` mode, so most users never see a visible challenge

## Alternative: Per-Environment Site Keys
For better isolation, you could create separate Turnstile widgets for:
- Production: `customshowers.uk`
- Preview: `*.customshowers-website-bfs.pages.dev`

Then set different site keys via the `VITE_TURNSTILE_SITE_KEY` environment variable in Cloudflare Pages:
- Production environment: use production site key
- Preview environment: use preview site key

Each would need its own secret key set in the corresponding Worker environment.
