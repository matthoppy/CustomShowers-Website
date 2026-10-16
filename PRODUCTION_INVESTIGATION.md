# Production Site Investigation Results

## Investigation Date
Friday, October 16, 2026, 4:53 AM UTC

## Sites Checked (READ-ONLY)
- ✅ https://customshowers.uk/design-shower
- ✅ https://customshowers.uk (homepage with contact form)
- ✅ https://www.customshowers.uk (subdomain redirect test)

**No forms were submitted during this investigation.**

---

## Key Findings

### 1. Turnstile IS Deployed on Production

#### Designer (/design-shower) - Review Step
✅ **Turnstile is implemented** but shows error message:
- Message: "The security check could not load"
- Fallback text: "Usually an ad blocker or a privacy extension. You can still send your design — we will just take an extra look at it before replying."
- Instructions provided: Allow `challenges.cloudflare.com` and refresh

<img src="/opt/cursor/artifacts/production-investigation/designer_turnstile_error.webp" alt="Designer showing Turnstile error" width="800" />

#### Contact/Quote Form (Homepage Modal)
✅ **Turnstile is implemented** and appears to load successfully:
- Widget visible with "Verify you are human" checkbox
- Cloudflare logo present
- No error message shown to user

<img src="/opt/cursor/artifacts/production-investigation/contact_form_working.webp" alt="Contact form with working Turnstile" width="800" />

---

### 2. Critical CSP (Content Security Policy) Errors

**Production site has severe CSP violations blocking Turnstile:**

<img src="/opt/cursor/artifacts/production-investigation/designer_csp_errors.webp" alt="Console showing CSP errors" width="800" />

#### Console Errors on Designer Page:
```
Refused to connect to 'https://hcaptcha.challenges.cloudflare.com/...' 
because it violates the following Content Security Policy directive: 
"connect-src 'self'"
```

Multiple blocked domains:
- `https://hcaptcha.challenges.cloudflare.com`
- `https://turnstile.challenges.cloudflare.com`
- `https://invalid.sl3.ul3.untest.challenges.cloudflare.com`
- `https://dual-valid.eldiv64.uniset.challenges.cloudflare.com`
- And many more challenge-platform variants

#### Error Counts:
- **Designer page**: 11 errors initially (CSP violations)
- **Homepage**: 42 issues (10 errors, 17 warnings, 5 hidden)
- **Contact form**: 95+ issues accumulating

**Root Cause**: CSP header or meta tag with `connect-src 'self'` is blocking Cloudflare's challenge domains.

---

### 3. Production vs Preview Branch Differences

#### UI/Styling:
- **Production**: Dark blue/navy header
- **Preview**: White header with different styling

#### Designer Features:
- **Production (OLD version)**:
  - Step 3 shows only: Fixing Method (U-channel/Glass clamps) and Finish options
  - Missing: Glass type, thickness, and coating selections
  
- **Preview (NEW version)**:
  - Step 3 shows all new options: Glass type, thickness, coating, fixing, finish
  - This is the feature being tested in PR #44

#### Turnstile Behavior:
- **Both environments**: Show "security check could not load" on designer
- **Both environments**: Experience CSP blocking
- **Contact form**: More stable on both (widget loads without visible error)

---

### 4. www Subdomain Test

✅ **Properly configured**: `https://www.customshowers.uk` redirects to `https://customshowers.uk`
- 301/302 redirect to apex domain
- Browser URL bar shows `customshowers.uk` after navigation

---

## Root Cause Analysis

### Why Turnstile Fails on Production Designer

The Turnstile widget attempts to load but is **blocked by Content Security Policy (CSP)** headers that restrict `connect-src` to `'self'` only.

**The CSP is preventing**:
1. Turnstile script from making fetch requests to challenge domains
2. Widget iframe from loading challenge endpoints
3. Token verification from completing

**Why Contact Form Works Better**:
The contact form widget appears more stable, possibly because:
- Different CSP directives for that page
- Different widget configuration
- Or the error happens silently without user-visible message

---

## Required Fix for Production

To make Turnstile work on production, the CSP must be updated to allow Cloudflare challenge domains:

### Current (Blocking):
```
Content-Security-Policy: connect-src 'self'
```

### Required (Permissive for Turnstile):
```
Content-Security-Policy: connect-src 'self' https://*.challenges.cloudflare.com
```

**Where to check**:
1. Cloudflare Pages settings → Headers
2. `public/_headers` file in repository
3. `<meta>` tags in HTML files
4. Cloudflare Transform Rules or Workers adding CSP

---

## Production Site Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Turnstile on Designer | 🔴 Deployed but blocked | CSP violations prevent loading |
| Turnstile on Contact Form | 🟡 Deployed, partially working | Widget visible but may have hidden errors |
| CSP Configuration | 🔴 Blocking required domains | `connect-src 'self'` too restrictive |
| www Redirect | ✅ Working | Properly redirects to apex |
| Designer Features | 📦 Old version | New glass options not yet deployed |

---

## Recommendations

1. **Immediate**: Update CSP to allow `https://*.challenges.cloudflare.com`
2. **Test**: Verify Turnstile works after CSP fix on production
3. **Monitor**: Check console for any remaining CSP errors
4. **Deploy**: Roll out new designer features from PR #44 after CSP fix

---

## Investigation Methodology

- Used Chrome DevTools (Console + Network tabs)
- No forms submitted (read-only investigation)
- Observed widget behavior and error messages
- Captured screenshots of errors and working states
- Compared production against preview branch
