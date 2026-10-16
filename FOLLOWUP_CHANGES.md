# Follow-up Changes - Turnstile Blocking & Mobile Button Placement

## Commit
**Commit**: `640afd6` - Block Turnstile failures and move mobile review buttons

## Changes Implemented

### 1. ✅ Turnstile Now Blocks Submission When Failed

#### Frontend Changes (`src/configurator/Configurator.tsx`)
**Before**: Allowed submission even when Turnstile failed to load
```typescript
(!tenant.turnstileSiteKey || !!turnstileToken || challengeState === 'failed')
```

**After**: Requires valid token when Turnstile is configured
```typescript
(!tenant.turnstileSiteKey || (!!turnstileToken && challengeState === 'ready'))
```

#### Error Message Updated (`src/configurator/steps/ReviewStep.tsx`)
**Before**: "You can still send your design — we will just take an extra look at it before replying"

**After**: Clear, actionable error message:
- **Title**: "Security check required"
- **Message**: "The security check must load before you can send your design. This is usually caused by an ad blocker or privacy extension."
- **Steps to fix**:
  - Allow `challenges.cloudflare.com`
  - Disable ad blockers for this site
  - Refresh the page

#### Backend Changes (`design-worker/worker.js`)
**Before**: Worker accepted submissions without token and only flagged them
```javascript
const challengeSkipped = env.TURNSTILE_SECRET_KEY && !turnstileToken;
if (challengeSkipped) {
  console.warn("Flagged: no challenge token", { ip: clientIp(request), tenantId });
}
```

**After**: Worker rejects submissions without token with 403 status
```javascript
if (env.TURNSTILE_SECRET_KEY) {
  if (!turnstileToken) {
    console.warn("Rejected: no challenge token", { ip: clientIp(request), tenantId });
    return json(
      {
        error: "Security check required. Please allow challenges.cloudflare.com, disable ad blockers, and refresh the page.",
      },
      403
    );
  }
  // Verify the token server-side...
}
```

**Security Improvement**: All submissions now require server-side Turnstile verification when configured. No tokenless submissions are accepted.

### 2. ✅ Mobile Button Placement Moved Below Details Form

#### Problem
On mobile review step, Back and "Send my design" buttons appeared at the top (in sticky bar), above:
- Panel schedule
- Run summary
- Your details form
- Turnstile widget

Users had to scroll past the buttons to fill in their details, which was unintuitive.

#### Solution
**Mobile (≤1023px)**: Buttons now render inline at the bottom of the ReviewStep content, after all form fields
- Position: Below details form, measurements disclaimer, and Turnstile widget
- User flow: Fill in details → See buttons → Submit

**Desktop (≥1024px)**: Buttons remain in sticky bottom bar (unchanged)
- Position: Sticky bar at bottom of viewport
- User flow: Unchanged from before

#### Implementation
1. Added inline mobile nav buttons in ReviewStep (`src/configurator/Configurator.tsx` line ~314)
2. Hidden on desktop with `lg:hidden`
3. Original sticky nav bar hidden on mobile for review step with `${stepId === 'review' ? 'hidden lg:flex' : 'flex'}`

## Build Results
✅ **Build Status**: Success
- Command: `npm run build`
- Exit code: 0
- Build time: 2.80s
- No errors or warnings

✅ **Cloudflare Pages Build**: Success
- Status: COMPLETED
- Conclusion: SUCCESS

## Preview URL
**Latest Preview**: https://cursor-designer-fixes-5ad3.customshowers-website-bfs.pages.dev/design-shower

## Verification Screenshots

### Mobile Button Placement
<img src="/opt/cursor/artifacts/followup-screenshots/mobile_buttons_below_form.webp" alt="Mobile buttons below form" width="390" />

**Verified**: Buttons appear at the bottom of the review step on mobile, after all form content.

### Desktop Button Placement
<img src="/opt/cursor/artifacts/followup-screenshots/desktop_buttons_sticky_bar.webp" alt="Desktop buttons in sticky bar" width="800" />

**Verified**: Desktop layout unchanged - buttons remain in sticky bottom bar.

### Turnstile Error (Blocked)
<img src="/opt/cursor/artifacts/followup-screenshots/turnstile_error_blocked.webp" alt="Turnstile error blocking submission" width="800" />

**Verified**: Clear error message with actionable steps when Turnstile fails to load.

## Testing Completed
- ✅ Mobile (390x844): Buttons positioned below form
- ✅ Desktop (1440x900): Buttons in sticky bar
- ✅ Turnstile blocking: Submission disabled when failed
- ✅ Error message: Clear instructions displayed
- ✅ Worker validation: Rejects tokenless submissions with 403

## Summary
Both follow-up requirements have been fully implemented, tested, and verified:
1. Turnstile now blocks submission when it fails to load (frontend + backend)
2. Mobile review buttons moved below details form (desktop unchanged)

PR #44 remains a draft and has not been merged.
