# Measuring journey: audit and UX proposal

Written 3 November 2026, before any code was changed. This is the Phase 1
deliverable: what the designer does today, what is good, what gets in the
customer's way, and the journey proposed to replace the Measure step. Phase 2
builds it; Phase 3 tests it.

Sources: the configurator source (`src/configurator/`), the fabrication rules
(`src/lib/showerCalculations.ts`), the three Notion pages the code cites
(Measuring Calculator Latest Decisions, Customer measuring flow, Measuring &
out-of-true walls), and the last six pull requests.

---

## 1. What exists today

### 1.1 Shape of the application

| Layer | Where | What it does |
|---|---|---|
| Flow shell | `Configurator.tsx` | Five steps: Shape, Measure, Layout, Hardware, Review. Owns state, Back/Next, the sticky Plan and Elevation drawings, submission. |
| Model | `types.ts`, `templates.ts`, `geometry.ts` | A chain of panels joined by 90° or 180° junctions. Eight preset templates. Geometry traces the chain in plan, derives planes (front, return, back) and splits the chain into straight runs. |
| Measuring engine | `measure.ts` (855 lines, pure, unit tested) | The customer's survey: widths per run, two readings per wall, floor fall, the eight-point cross for a single door, derived top width, plausibility and consistency checks, plain-English descriptions for the email. |
| Rules | `rules.ts` | Hinge kits and ratings, size limits, review thresholds (2000 mm glass, 2200 mm door), ceiling rules (30 mm single-door gap, transoms). Every number tagged CONFIRMED, MANUFACTURER or OURS. |
| Fabrication | `spec.ts` + `lib/showerCalculations.ts` | Cut sizes after channel, clamp, corner and door-swing deductions; hinge selection by width and weight; hinge and handle positions; notches; mating notch heights; support panel and bar rules; warnings and blocking issues. |
| Measure UI | `steps/MeasureStep.tsx` (1400 lines) | Desktop: every measurement on one long page. Phone: one card per screen driven by the shell's Back/Next. |
| Diagrams | `views/MeasureDiagram.tsx` | Ten static how-to figures (320×220 SVG) and `OpeningPreview`, which draws the measured opening back with leans exaggerated. |
| Photos and AI | `photos.ts`, `PhotoCapture.tsx`, `PhotoUpload.tsx`, `Gemini*.tsx` | A photo per measurement, loose room photos, optional Gemini reading suggestions (advisory, never auto-applied). |
| Sending | `submit.ts`, `design-worker/worker.js` | Rasterises the drawings, posts spec + summary + photos to a Cloudflare Worker that emails the workshop and the customer. |

Tests: `measure.cross`, `measure.halves`, `measure.setup` (21 cases), plus
worker and mapping tests. All green. Build and configurator lint are clean.

### 1.2 Measurement calculations already implemented

These are kept exactly as they are. The journey below only changes how the
customer reaches them.

- **Wall lean from two readings.** Gap at the bottom and gap at the top against
  a vertical reference. `signed = bottom − top`; positive leans into the
  opening. Direction is never asked, it falls out of the arithmetic. An
  optional middle reading detects a bow (over 5 mm off a straight line).
- **Derived top width.** `floor width − Σ signed lean of the bounding walls`.
  A run between two glass corners has no walls, so top = bottom.
- **Optional top-width cross-check.** If the customer measured the top anyway,
  it must agree with the derived figure within 3 mm, otherwise a blocking
  check names the contradiction.
- **Two-halves width.** Both halves to a laser line or taped mark; the sum
  becomes the floor width. Zero is a valid half.
- **Eight-point cross for a single door.** Readings 1–4 across to the vertical
  line, 5–6 down to the level line, 7–8 up to it (ceiling only). Opposite
  readings sum to widths and ceiling heights. With a laser, 1 vs 2 and 3 vs 4
  give the wall rakes and 5 vs 6 the floor rake. With tape, only the sums are
  used and the rakes come from a level and packers. The numbering and pairing
  match the Notion decision of 2 Nov 2026.
- **Laser reference.** 50 mm default, editable. A bottom reading more than
  10 mm off it is queried, not blocked.
- **Floor fall.** Amount plus which end is lower, per run.
- **Walk-in gap.** Whole tray width minus glass length; under 650 mm is a hint
  only.
- **Unit slips.** 90 or 0.9 for 900 are caught and the corrected figure is
  offered as a one-tap fix.
- **Ceiling.** Single door to the ceiling: door = lowest ceiling − 30 mm gap.
  Door inside an enclosure to the ceiling: open or glass transom, door height
  chosen by the customer.
- **Review flags.** Glass over 2000 mm and doors over 2200 mm are checked by
  hand. Height alone never approves a hinge.
- **Cut sizes.** Rectangular bounding boxes after deductions; rakes travel to
  the workshop as notes (`spec.rakeNotes`) rather than as geometry, which is
  how the Notion reference says tapered glass is priced and reported.

### 1.3 What is collected from the customer

Shape (template or hand-built chain), glass height, floor-to-ceiling flag and
its gap or transom choice, floor width per run (whole or halves, or the cross),
how the walls were checked, bottom/middle/top gap per end wall, floor fall and
low end per run, whole tray width for a walk-in, a confirmation that the drawn
opening looks right, optional photos per measurement, panel widths and door
hinge side and swing, bottom notches, mounting, finish, handle, glass type and
coating, contact details and the measurement acknowledgement.

### 1.4 What works well

- The engine's two principles are right and should be the spine of anything
  new: **never ask the customer to judge** (two readings beat "which way does
  it lean?"), and **derive whatever can be derived** (the top width is worked
  out, not fetched from a ladder).
- Checks are written to the customer, say what to do, and offer fixes.
- The confirm-the-drawing gate catches the mistakes arithmetic cannot (a lean
  recorded on the wrong wall).
- Photos are tied to the measurement they back up and travel in the right
  order. Gemini is advisory only.
- Everything the workshop needs reaches the email, including how the walls were
  checked and where the laser was set.
- The drawings stay mounted across steps so the Review step can rasterise them
  for the email.

### 1.5 What gets in the customer's way

1. **Desktop is a form.** Every measurement is on one long page. The phone
   layout already shows one thing at a time; desktop should too. The two
   layouts also behave differently (checks are filtered per card on the phone
   only), and the card-index arithmetic that does the filtering is hand-coded
   and was the cause of the last crash.
2. **The method question is asked twice, in different words.** "Do you have a
   laser level?" on the Shape step, then "How did you check?" with four options
   on the walls card. A first-time customer does not know these are the same
   decision.
3. **No layout overview before measuring.** A corner shower is two or three
   runs with names like "Front" and "Right return", but the customer is never
   shown which wall is which on their own drawing before being asked for the
   "front" width.
4. **The eight-point cross is one card with six to eight boxes.** The diagram
   is static. The customer has to match numbers on a picture to boxes in a
   grid while holding a tape.
5. **Diagrams do not follow the configuration.** Every figure is the same
   two-wall alcove, even for a walk-in with a return or a three-sided
   enclosure.
6. **The height card carries five decisions.** Height, presets, to the
   ceiling, air gap, transom type and door height, review notes, photo.
7. **The floor asks for a judgement.** "mm of fall" and "which end is lower"
   is exactly the question the wall readings were designed to avoid. Two
   readings would give fall and direction for free, as the cross already does.
8. **Both walls on one card**, with the method choice above them.
9. **The tape route is thinner than the laser route.** Width at the top is
   buried in a collapsed "measured the top as well?" disclosure. There is no
   width at mid height, no ceiling reading except on the single-door cross.
10. **Sloping ceilings are not captured** for anything but a single door. An
    enclosure to the ceiling takes one typed height; a ceiling that drops along
    the run is invisible until the glass arrives.
11. **No save or resume.** A refresh in the bathroom loses ten minutes of work.
12. **No summary before continuing.** The last card shows the drawing but not
    the numbers, and there is no way to jump back to one measurement.
13. **Trade words leak through**: plumb, rake, return, transom, run.
14. **Panel widths can drift from the measured run.** The Layout step lets a
    customer type panel widths that no longer add up to the width they
    measured; the cut sizes then disagree with the opening notes in the email.
15. **Hinge and weight limits only appear on Review**, four screens after the
    numbers that cause them.

### 1.6 What is missing for a complete measuring experience

- A method screen with visuals, tools and time, chosen once.
- A "your shower" screen that shows the runs and walls to be measured.
- One task per screen on every device, with the diagram highlighting the line
  being measured, numbered points and a mistakes-to-avoid note.
- Floor and ceiling as two readings each, with raked edges derived as one
  straight cut between the measured ends.
- Ceiling readings for every shape that goes to the ceiling, and a check that
  a sloping ceiling clears glass that does not.
- Width at two or three heights for tape users.
- A summary screen with edit links, soft hinge and door notes, and the drawing.
- Progress saved locally and restored.
- A plan drawing that stays in step with what is being measured.

---

## 2. Proposed journey

### 2.1 Principles

1. **One task per screen, everywhere.** Phone and desktop walk the same
   sequence. Desktop adds a side rail of all the screens, with ticks, for
   jumping back, and a larger drawing. Nothing is a long form.
2. **Every screen answers four things**: what you are measuring, where, why,
   and what comes next. Title, highlighted drawing, one line of why, the
   input, one "easy to get wrong" note.
3. **Readings, not judgements.** Floor and ceiling join the walls in being
   measured as two end readings. Size and direction are computed. Raked edges
   are one straight cut between the two readings, never stepped or curved.
4. **Derive, then let them check.** Top width is derived; a tape user who
   measures it gets it checked. Nothing optional is hidden in a disclosure the
   customer will not open.
5. **Flag, do not forbid.** Blocking is reserved for numbers that cannot be
   right (units, missing halves, contradictions). Everything else is a
   question or a note for the workshop. 650 mm walk-in stays a hint. No new
   technical limits.
6. **Customer words.** "Is the left wall straight up?", "Is the tray level
   along the front?", "the side panel", "the gap above the door".
7. **The engine does not change.** New screens write into the existing
   `OpeningMeasurements` fields or into additive optional fields. Checks,
   descriptions, spec and the email keep working for designs saved before.

### 2.2 The screens

The sequence is generated from the configuration and the method, so a walk-in
screen gets six screens and a three-sided enclosure to a sloping ceiling gets
fourteen. Screens the method makes unnecessary are not shown (a laser user's
single-door walls and floor come from the cross).

| # | Screen | Shown when | Writes |
|---|---|---|---|
| 1 | **How will you measure?** Laser or tape, each with a picture, a tools list and the one rule (millimetres, measure to the tiles). Pre-selected if answered on the Shape step. Includes the "mark where the glass will stand" tip. | always | `opening.method` |
| 2 | **Your shower.** Plan and front drawings of their configuration with runs numbered and walls marked. "You will measure: 2 widths, 2 walls, 2 floor checks, then check the drawing." | always | nothing |
| 3 | **How tall should the glass be?** Presets, or "all the way to the ceiling". | always | `heightMm`, `isFloorToCeiling` |
| 3a | **Up to the ceiling.** Floor-to-ceiling at each end of each run. Single door also gets the air gap (30 mm default). Detects a sloping ceiling. | to ceiling, not single door (single door takes it from readings 7–8) | per-run `ceilingStartMm`, `ceilingEndMm`; `heightMm` (tallest), `topGapMm` |
| 3b | **What goes above the door?** Open or glass, door height. | door inside an enclosure to the ceiling | `aboveDoor`, `doorHeightMm` |
| 4 | **Set up the cross** (single door only). How to set the laser or draw the tape cross. No input. | single door | nothing |
| 4a–d | **Left wall 1 & 2, Right wall 3 & 4, Floor 5 & 6, Ceiling 7 & 8.** Two numbered readings per screen; the drawing highlights the pair and the focused one pulses; running totals shown. | single door | `crossReadings` → engine |
| 5 | **Width along the floor: [run name].** In two halves (default where there is a door) or whole. Plan highlights the run. Walk-in also asks the whole tray width here. | each run, not single door | `runs[i].halfA/halfB/widthAtFloorMm`, `walkInOpeningMm` |
| 5a | **Width at the top: [run name].** Same width at the height the glass reaches. "If it differs from the floor, a wall leans, and the next screens find which." Optional mid height. | tape users, runs with a wall at either end | `runs[i].widthAtTopCheckMm`, `widthAtMiddleCheckMm` |
| 6 | **Is the [left] wall straight up?** One wall per screen. Laser: 50 mm off the wall, bottom and top readings. Tape: level and packers, bottom and top. Optional middle for a bow. Shows the lean it works out. | each wall the glass meets; skipped for laser single door | `startWall` / `endWall`, `laserOffsetMm` |
| 7 | **Is the tray level along [run]?** Two readings at the ends (down from the laser line, or the gap under a level). Fall and low end computed. | each run; skipped for laser single door | `runs[i].floorStartMm/floorEndMm` → `floorFallMm`, `floorLowEnd` |
| 8 | **Anything in the way at the bottom?** Upstand, bath rim or step at a wall end, with width and height. Optional. | always | end panel notches |
| 9 | **Check your numbers.** Every measurement listed with Change links, the drawn opening(s) with leans exaggerated, soft notes (door weight and hinge range at this size, review flags), then "Yes, that is my bathroom". | always | `shapeConfirmed` |

Photos keep their place on the screens where the tape is in the customer's
hand (height, widths, walls, floor). Gemini suggestions stay on the summary.

### 2.3 Screen layouts

Phone (one column):

```
┌──────────────────────────────┐
│ Measure            4 of 9    │  progress bar
│ ████████░░░░░░░░░░░░░░░░░░   │
│                              │
│ Is the left wall straight up?│  title
│ Two readings tell us if it   │  why, one line
│ leans and which way.         │
│                              │
│ ┌──────────────────────────┐ │
│ │  [drawing: left wall     │ │  configuration-aware,
│ │   highlighted, laser line│ │  active line pulses
│ │   50 mm off, "bottom"    │ │
│ │   reading lit]           │ │
│ └──────────────────────────┘ │
│ Gap at the bottom   [ 50 ]mm │  focused input lights
│ Gap at the top      [ 53 ]mm │  its line
│ ▸ Add a reading at mid height│
│                              │
│ ✓ 3 mm out, leaning away     │  live result
│   from the shower at the top │
│                              │
│ Easy to get wrong: measure   │
│ to the tiles, not the        │
│ plaster. Keep the tape level.│
│ [📷 Take a photo (optional)] │
├──────────────────────────────┤
│ ‹ Back                Next › │  shell nav, unchanged
└──────────────────────────────┘
```

Desktop (rail, task, drawings):

```
┌──────────┬──────────────────────────────┬───────────────────────┐
│ ✓ Method │ Width along the floor: Front │  PLAN                 │
│ ✓ Your   │ From the corner to the right │  ┌──────────────┐     │
│   shower │ wall, in two halves.         │  │ run ① lit    │     │
│ ✓ Height │ ┌──────────────────────────┐ │  │ wall B lit   │     │
│ ● Width: │ │ drawing with A and B     │ │  └──────────────┘     │
│   Side   │ │ halves, laser line       │ │  ELEVATION            │
│ ○ Width: │ └──────────────────────────┘ │  ┌──────────────┐     │
│   Front  │ A: corner to line  [ 612 ]   │  │ front panels │     │
│ ○ Left   │ B: line to wall    [ 598 ]   │  │ highlighted  │     │
│   wall   │ Width: 612 + 598 = 1210 mm   │  └──────────────┘     │
│ ○ ...    │ Measured it in one go? …     │                       │
│ ○ Check  │ Easy to get wrong: …         │  Overview ▢ Step ▣    │
└──────────┴──────────────────────────────┴───────────────────────┘
```

"Overview" shows every measurement on the drawing with its value and a
Change link, so a customer can check the whole picture at any point.

### 2.4 Diagrams

A new scene component draws **their** shower rather than a generic alcove:

- **Front-on**: the run being measured, with walls where the glass meets them,
  the cross or the laser line, numbered points for 1–8, tape halves, height
  line, ceiling line when relevant. Leans and falls drawn exaggerated once
  readings exist.
- **Plan**: the existing Plan view gains a highlighted run and wall, so the
  right-hand drawing follows the customer around the bathroom.
- **Active line** pulses softly; focusing an input lights its line.
- Colours stay on CSS variables so dark mode and the embed both work.

### 2.5 Validation

Kept: every existing check and level. Added, all additive:

| Check | Level | Why |
|---|---|---|
| Top width differs from floor width (tape) | hint | Tells the customer a wall leans before the wall screens, and becomes the existing cross-check once they are measured. |
| Middle width off the straight line between top and bottom | confirm | A bowed opening cannot be followed by a straight cut. |
| Floor readings missing one end | blocking | Half a floor check is not a floor check. |
| Ceiling readings missing one end | blocking | Same. |
| Ceiling slopes more than 20 mm along a run | confirm | Real but unusual; the top edge will be cut to follow it. |
| Glass height taller than the lowest ceiling point (not to ceiling) | confirm | The glass would hit the ceiling at one end. |
| Door weight and hinge range at the measured size | note on summary | Uses the existing hinge selection. Never blocks; the Layout step is where the door width changes. |
| Panel widths no longer add up to the measured run | Layout keeps them in step | Changing one panel rebalances the others in that run, so cut sizes and the opening never disagree. |

### 2.6 Why this journey

- It is the shape of the physical job. A customer stands at one wall, takes two
  readings, moves on. The screens follow their feet.
- It removes every judgement call: direction of lean, fall and ceiling slope
  all come from pairs of readings.
- It keeps the engine, the rules, the email and the tests exactly as they are,
  which is where the confirmed fabrication knowledge lives.
- It makes the laser route and the tape route equal citizens that produce the
  same data, as the Notion decisions require.
- It fixes the two correctness gaps found in the audit (sloping ceilings on
  enclosures, panel widths drifting from the measured run) without adding any
  new restriction.
- Desktop and phone share one sequence and one source of truth for which check
  belongs to which screen, which is what caused the last crash.

### 2.7 Ideas considered and not built

- **Photo-to-measurement recognition** already exists (Gemini) and stays
  advisory. Extending it to place measurement points on a photo is not
  reliable enough to put in front of a first-time customer, and a wrong
  suggestion here costs a panel.
- **Interactive drag-to-measure on the drawing**: the drawing is not to scale
  with their bathroom, so dragging would imply precision that does not exist.
  Highlighting is used instead.
- **Quadrant (curved) enclosures**: not in the templates, and the fabrication
  rules are for straight cuts in flat toughened glass. Treated as a product
  decision for the owner, not a measuring-journey change. "Square" enclosures
  are the corner and three-sided templates.

---

## 3. Technical notes and dependencies

- **Email**: `rakeNotes`, `warnings`, `openingCondition` and `openingWidths`
  render generically in the worker, so new measurements reach the workshop
  without a worker deploy. New `summary` keys would render with their raw key
  as the label, so none are added.
- **Saved designs**: all new fields are optional; `createOpeningMeasurements`
  and `syncRuns` fill defaults.
- **Persistence**: design state, step and customer details saved to
  `localStorage` per tenant, restored on load with a "start again" link.
  Photos are not persisted (object URLs and size).
- **Shell**: the Measure step's screen index is owned by the shell on both
  layouts; `measureCardCount` becomes a journey-derived count.
- **Tests**: new cases for floor and ceiling readings, tape top/middle widths,
  journey generation per template and method, and the Layout rebalance.
- **Open for the owner**: finishes per hinge range, transom fixings, Vienna
  limits (all already listed as open in Notion); whether a quadrant product
  should exist.

---

## 4. What was built (Phase 2)

Everything in section 2 was built, on the branch `feat/guided-measuring-journey`.
The engine, rules, fabrication library, email worker and existing tests were
not changed in meaning; additions are additive and optional fields.

| Area | File | What changed |
|---|---|---|
| Model | `src/configurator/measure.ts` | Floor as two end readings (`floorStartMm`/`floorEndMm`, fall and low end derived). Ceiling as two end heights per run (`ceilingStartMm`/`ceilingEndMm`, slope derived). Mid-height width for tape users. `aboveGlass` for glass that stops short. The laser cross now writes its floor readings and ceiling heights into the same fields. New checks: floor/ceiling half missing, ceiling missing when glass goes to the ceiling, ceiling units and plausibility, large ceiling slope, ceiling below the glass, top width as a hint before walls are checked, middle-width bow. `hydrateOpening` for saved designs, `toolFor` for laser vs tape. |
| Rules | `src/configurator/rules.ts` | Unchanged. |
| Shape | `src/configurator/geometry.ts` | `isSingleDoor` and `hasTransom` moved here (alias-free) and re-exported from `spec.ts`. |
| Spec | `src/configurator/spec.ts` | Ceiling heights per run in `rakeNotes`; review warnings for a sloping ceiling and for a ceiling below the glass. |
| Journey | `src/configurator/journey.ts` (new) | Screen sequence per shape and tool, customer names for runs and walls, check-to-screen routing, summary rows, screen gating. |
| Layout | `src/configurator/layout.ts` (new) | Panel scaling and rebalancing so a run's panels always add up to its measured width. |
| Measure UI | `src/configurator/steps/MeasureStep.tsx` | Rewritten: one screen at a time on every device, rail on desktop, progress on phone, drawing lit per input, results said back, easy-to-get-wrong notes, photos where the tape is in hand, summary with Change links, door/hinge note, unresolved list with Go-to-it. |
| Drawings | `src/configurator/views/MeasureScene.tsx` (new) | Configuration-aware figures: tool, overview plan with numbered runs, height, width (whole/halves/walk-in tray), width at top, cross (6/8 points), wall (laser or level+packers, left or right), floor, ceiling, upstand. Active line breathes; readings tilt the room. Dark mode via `--measure-accent`. |
| Drawings | `views/PlanView.tsx`, `views/ElevationView.tsx` | `highlightPanelIds` / `highlightWall`: the main drawings follow the current screen. |
| Diagram | `views/MeasureDiagram.tsx` | Now only `OpeningPreview`; the static figures were replaced by the scene. |
| Shell | `src/configurator/Configurator.tsx` | Screen index on all devices; Next gated on the method and on leaving the step; progress saved to localStorage (debounced, flushed on page hide) and restored with a "Start again" banner; cleared on send. |
| Layout step | `src/configurator/steps/SizesStep.tsx` | Panels grouped by measured run; changing one panel rebalances the others; single-panel runs are read-only (the measurement is the width); adding or removing a panel refits the run. |
| Styles | `src/index.css` | `measure-pulse` keyframes (reduced-motion safe) and the measuring accent token. |

Decisions made while building, for the owner to confirm:

- Glass to the ceiling on an enclosure uses the **tallest** ceiling reading as
  the cut height (bounding box) and reports the slope as a straight raked top
  edge, flagged for a hand check. A single door keeps the existing rule:
  lowest point less the 30 mm gap.
- Tape users measure the **top width only on a one-run alcove** (both ends are
  walls). At a corner there is nothing to measure the top to.
- With tape, cross readings 5 and 6 are still asked, as in the confirmed
  eight-point method, even though only the laser uses them for the floor.
- "I cannot check" on a wall keeps the existing `assumed-square` method and its
  warning; a differing top width then becomes a query rather than a block.
- Quadrant (curved) enclosures were not added: not a template and not a
  straight-cut product under the current rules.

## 5. Test record (Phase 3)

Unit tests (`npm test`): 135 pass across the worker, mapping, review gate,
halves, set-up, cross, readings (19 new), journey (15 new) and layout (6 new)
suites. Configurator lint: 0 errors. Build: clean.

Browser run-through (Playwright, Chromium, against the built site), 104 checks,
all passing:

| Journey | Device | Covers |
|---|---|---|
| A. Door only, laser, to the ceiling | 1440×900 | Method, overview, 8 cross readings in pairs, lean and fall from the readings, door = lowest ceiling − 30, rail jump and return, Next held until confirmed, measured 798 flowing to Layout (read-only) and Review (798 × 2370, cross readings in the notes). |
| B. Panel and door, tape | 390×844 | Halves, top width hint, level-and-packers lean, reload mid-journey restores the screen and readings, floor from two readings, ceiling coming down over the glass (40 mm slope queried, not blocked), upstand notch, summary, door 650 rebalances the fixed panel to 560, Review carries lean, floor readings, slope, method and notch. |
| C. Walk-in, laser | 1440×900 | Glass length, tray width → 600 mm gap suggested not blocked, laser lean out, level floor, Review carries gap and laser distance. |
| D. Corner, door and side, laser, to the ceiling | 1440×900 | Transom screen, runs named "left side"/"front", walls named "back wall"/"right wall, beside the door", floors per run, ceilings per run with a 20 mm slope on the front → Review flags the raked top edge and the open transom. |
| E. Three sided, tape (level and tape) | 390×844 | Three widths, back wall at each end, leans in opposite directions, floor fall on the front, derived top widths per return in the Review. |
| F. Mistakes | 1280×900 | 120 → "looks like centimetres" with one-tap 1200; top width 1180 against plumb walls → contradiction raised on the wall screen, listed on the summary, Next refused, Go-to-it lands on the owning screen. |
| G. Embed, dark | 390×844 | The cross screen in dark mode, no errors. |

No page errors in any journey. Screenshots were taken at each screen and
reviewed at phone and desktop widths.
