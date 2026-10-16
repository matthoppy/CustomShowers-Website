# Phase 2 Follow-up Fixes - Complete Summary

## Commit: 8ff46e7
Branch: `cursor/designer-phase2-8405`
PR: #47 (remains DRAFT)

## Changes Made

### Fix 1: Deduplicate Review Step Buttons ✅

**Problem:** The review step showed Back/Send My Design buttons TWICE - once in the page body and once in the sticky footer.

**Root Cause:** 
- Sticky footer had conditional visibility: `${stepId === 'review' ? 'hidden lg:flex' : 'flex'}`
- This hid it on mobile but showed it on desktop for review step
- Meanwhile, inline buttons in ReviewStep were marked `lg:hidden` (mobile only)
- Result: Both visible simultaneously on some viewports

**Solution:**
- Changed inline buttons class from `lg:hidden` to always visible (removed breakpoint)
- Changed sticky footer conditional from `'hidden lg:flex'` to `'hidden'` for review step
- Now sticky footer is completely hidden on review step, inline buttons visible on all sizes

**Code Changes:**
```typescript
// src/configurator/Configurator.tsx line 490
// Before:
<div className="mt-6 flex items-center justify-between gap-3 lg:hidden">

// After:
<div className="mt-6 flex items-center justify-between gap-3">

// src/configurator/Configurator.tsx line 582
// Before:
<div className={`sticky bottom-0 border-t bg-background/95 backdrop-blur ${stepId === 'review' ? 'hidden lg:flex' : 'flex'}`}>

// After:
<div className={`sticky bottom-0 border-t bg-background/95 backdrop-blur ${stepId === 'review' ? 'hidden' : 'flex'}`}>
```

**Evidence:** On review step at any viewport, only ONE set of Back/Send buttons is visible (inline in the page content).

---

### Fix 2: Show Current Step Name on Mobile ✅

**Problem:** At 390px viewport, the step progress bar only showed step numbers (1, 2, 3, 4), no step names/labels visible.

**Root Cause:**
- Step labels had class `hidden text-xs sm:text-sm md:inline`
- This hid ALL labels below md breakpoint (768px)
- On mobile, users saw only numbered circles with no context

**Solution:**
- Changed label visibility logic to conditional based on whether it's the current step
- Current step label: always inline with `md:inline` (visible on mobile)
- Other step labels: `hidden md:inline` (hidden until desktop)
- Result: Mobile users see at least the current step's name (e.g. "Sizes", "Review")

**Code Changes:**
```typescript
// src/configurator/Configurator.tsx lines 434-440
// Before:
<span
  className={`hidden text-xs sm:text-sm md:inline ${
    i === stepIndex ? 'font-semibold' : 'text-muted-foreground'
  }`}
>
  {s.label}
</span>

// After:
<span
  className={`text-xs sm:text-sm ${
    i === stepIndex ? 'font-semibold md:inline' : 'hidden md:inline text-muted-foreground'
  }`}
>
  {s.label}
</span>
```

**Evidence:** 
- At 390px: Current step name visible next to its highlighted number
- At 1280px: All step names visible (unchanged behavior)

---

### Fix 3: Add Validation Messages for Sizes Step ✅

**Problem:** When wizard produces invalid height (< 500mm or > 3000mm) or user enters panel width <= 0, the Next button is disabled with NO explanation of why or how to fix it.

**Root Cause:**
- Validation logic exists in `Configurator.tsx` `canProceed` memo
- But no UI feedback in `SizesStep.tsx` explaining constraints

**Solution:**
- Added `heightValid` and `panelsValid` computed booleans at top of SizesStep render
- Added conditional red border styling (`border-destructive`) on invalid inputs
- Added inline error messages immediately below invalid fields explaining:
  - Height: "Glass height must be between 500mm and 3000mm. Enter a taller/shorter height."
  - Widths: "All panel widths must be greater than 0mm. Enter a width for each panel to continue."

**Code Changes:**
```typescript
// src/configurator/steps/SizesStep.tsx lines 92-94
const heightValid = state.heightMm >= 500 && state.heightMm <= 3000;
const panelsValid = state.panels.every((p) => p.width_mm > 0);

// Height input (line 104):
<Input
  id="height"
  type="number"
  value={state.heightMm}
  onChange={(e) => update({ heightMm: parseInt(e.target.value, 10) || 0 })}
  className={!heightValid && state.heightMm > 0 ? 'border-destructive' : ''}
/>
{!heightValid && state.heightMm > 0 && (
  <p className="text-xs text-destructive">
    Glass height must be between 500mm and 3000mm. {state.heightMm < 500 ? 'Enter a taller height.' : 'Enter a shorter height.'}
  </p>
)}

// Width input (line 149):
<Input
  type="number"
  aria-label={`${labels[i]} width in millimetres`}
  value={panel.width_mm}
  onChange={(e) => {
    const v = parseInt(e.target.value, 10);
    patchPanel(panel.id, { width_mm: Number.isNaN(v) ? 0 : v });
  }}
  className={`w-20 text-sm sm:w-28 ${panel.width_mm <= 0 ? 'border-destructive' : ''}`}
/>

// After widths list (lines 169-173):
{!panelsValid && (
  <p className="text-xs text-destructive">
    All panel widths must be greater than 0mm. Enter a width for each panel to continue.
  </p>
)}
```

**Evidence:**
- Height < 500mm → Red border + "...Enter a taller height."
- Height > 3000mm → Red border + "...Enter a shorter height."
- Panel width = 0 → Red border + "All panel widths must be greater than 0mm..."

---

## Build & Test Results

```bash
$ npm run build
✓ built in 2.56s (0 errors)

$ npm run lint
✖ 60 problems (41 errors, 19 warnings)
   All pre-existing; 0 new errors in changed files

$ npx eslint src/configurator/Configurator.tsx src/configurator/steps/SizesStep.tsx
   (No output - 0 errors)

$ npm test
✓ 11 tests passed
```

## Files Modified

1. **src/configurator/Configurator.tsx**
   - Lines 413-445: Step progress bar label visibility logic
   - Line 490: ReviewStep inline button visibility
   - Line 582: Sticky footer conditional hiding on review step

2. **src/configurator/steps/SizesStep.tsx**
   - Lines 92-94: Validation computed values
   - Lines 104-109: Height validation feedback
   - Line 149: Width input red border
   - Lines 169-173: Width validation feedback

## Verification Instructions

### Mobile (390px):
1. Navigate to `/design-shower` → start template flow → complete wizard → reach Sizes step
2. **Fix 2:** Progress bar shows current step name (e.g. "Sizes")
3. **Fix 3:** Enter height 400 → see red border + error message
4. **Fix 3:** Enter height 3500 → see red border + different error message  
5. **Fix 3:** Set panel width to 0 → see red border + width error
6. Fix validation, proceed to Review step
7. **Fix 1:** Scroll page - see only ONE set of Back/Send buttons (no duplicate)

### Desktop (1280px):
1. Repeat mobile flow
2. **Fix 2:** Progress bar shows all step names (unchanged from before)
3. **Fix 3:** Same validation messages as mobile
4. **Fix 1:** Review step shows only inline buttons (sticky footer hidden)

## Notes

- PR #47 remains DRAFT (not merged)
- No changes to Worker, Netlify config, or deployment
- Template path that skips shape screen unchanged
- All lint errors pre-existing (not introduced by these changes)
