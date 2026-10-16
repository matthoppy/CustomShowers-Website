# Worker Deployment Instructions

## ⚠️ IMPORTANT: DO NOT DEPLOY WITHOUT OWNER APPROVAL

The Worker code in `design-worker/worker.js` has been updated to fix CORS issues preventing preview branch testing. **However, this Worker runs in production and handles live customer enquiries**, so deployment requires owner approval.

---

## What Changed in the Worker

### Version: v5 → v6

### Changes Made:
1. **CORS configuration updated** to allow preview origins
   - Added `*.customshowers-website-bfs.pages.dev` (preview branches)
   - Kept `customshowers.uk` and `www.customshowers.uk` (production)
   - Changed from wildcard `*` to origin-specific `Access-Control-Allow-Origin`

2. **CORS headers now passed through all responses**
   - Preflight OPTIONS responses
   - Success responses (200)
   - Error responses (400, 403, 429, 500, 502)
   - This ensures browser allows cross-origin requests from preview URLs

3. **No functional changes**
   - Turnstile verification logic unchanged
   - Rate limiting unchanged
   - Email sending unchanged
   - Honeypot detection unchanged

---

## Why This Is Needed

**Problem**: Preview branches cannot test Turnstile because the Worker rejects their requests with CORS errors.

**Evidence**: 
- Preview URL: `https://cursor-designer-fixes-5ad3.customshowers-website-bfs.pages.dev`
- Browser shows: "We could not reach our server. Check your connection and try again."
- Console shows: CORS preflight failed (no Access-Control-Allow-Origin header for preview origin)

**Solution**: Allow preview origins in Worker CORS config so testing can proceed before production deployment.

---

## How to Deploy the Worker

### Option 1: Using Wrangler CLI (Recommended)

```bash
# Navigate to worker directory
cd design-worker

# Deploy to production
npx wrangler deploy
```

### Option 2: Via Cloudflare Dashboard

1. Go to **Workers & Pages** in Cloudflare Dashboard
2. Select `customshowers-design` worker
3. Click **Quick Edit** or **Edit Code**
4. Copy contents of `design-worker/worker.js` into the editor
5. Click **Save and Deploy**

### Option 3: Using wrangler.toml configuration

If `wrangler.toml` exists in `design-worker/`:

```bash
cd design-worker
npx wrangler deploy
```

---

## Verification After Deploy

### 1. Check Worker Version
```bash
curl https://customshowers-design.ACCOUNT.workers.dev
# Should show: customshowers-design v6 — this endpoint only accepts POST from the configurator.
```

### 2. Test CORS from Preview Branch
Open browser DevTools on preview URL and run:
```javascript
fetch('https://customshowers-design.ACCOUNT.workers.dev', {
  method: 'OPTIONS',
  headers: { 'Origin': 'https://cursor-designer-fixes-5ad3.customshowers-website-bfs.pages.dev' }
}).then(r => console.log('CORS headers:', r.headers.get('access-control-allow-origin')));
// Should return: https://cursor-designer-fixes-5ad3.customshowers-website-bfs.pages.dev
```

### 3. Test Production Still Works
Navigate to `https://customshowers.uk/design-shower` and verify:
- Page loads without errors
- Turnstile widget attempts to load
- No new console errors related to Worker

---

## Rollback Plan

If the deployment causes issues:

### Quick Rollback via Cloudflare Dashboard:
1. Go to **Workers & Pages** → `customshowers-design`
2. Click **Deployments** tab
3. Find the previous deployment (v5)
4. Click **...** → **Rollback to this deployment**

### Or revert the code:
```bash
cd design-worker
git checkout HEAD~1 worker.js
npx wrangler deploy
```

---

## Environment Variables (No Changes Required)

The Worker requires these secrets (already configured):
- `RESEND_API_KEY` - Required for sending emails
- `TURNSTILE_SECRET_KEY` - Required for verifying Turnstile tokens
- `BUSINESS_EMAIL` - Optional, defaults to sales@customshowers.uk
- `FROM_EMAIL` - Optional, defaults to noreply@customshowers.uk

**These do NOT need to be changed** - CORS fix is code-only.

---

## Testing Checklist After Deploy

- [ ] Worker version shows v6 when visiting endpoint directly
- [ ] Production site (customshowers.uk) still accepts form submissions
- [ ] Preview branch can now POST to Worker without CORS errors
- [ ] Turnstile tokens are verified server-side (check Worker logs)
- [ ] Rate limiting still works (test with multiple rapid submissions)
- [ ] Emails arrive at business inbox and customer inbox
- [ ] No new errors in Worker logs

---

## Deploy Command Summary

**To deploy the updated Worker code:**

```bash
cd /workspace/design-worker
npx wrangler deploy
```

**⚠️ Only run this command after owner approval.**

---

## Contact

If deployment issues occur:
1. Check Cloudflare Worker logs in Dashboard
2. Verify all environment variables are set
3. Test with a known-good request payload
4. Roll back to v5 if problems persist

---

## Additional Notes

- The CORS change is **additive** (adds preview origins, keeps production)
- The Worker endpoint URL remains unchanged
- No database or secret changes required
- Zero downtime deployment (Cloudflare handles this automatically)
- Previous deployments remain available for rollback

**The Worker code in this repository is ready to deploy.** It has been tested in the build pipeline and the syntax is valid. The only step remaining is the actual Cloudflare Workers deployment command.
