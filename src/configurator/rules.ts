/**
 * Fabrication rules, as confirmed against CRL's Smart Glazier.
 *
 * Every number in this file came from one of three places, and the comment on
 * each says which:
 *
 *   [CONFIRMED]    read back from a live Smart Glazier server recalculation
 *   [MANUFACTURER] CRL's published catalogue or installation manual
 *   [OURS]         Custom Showers' own installer practice
 *
 * The distinction matters when something disagrees on site. A CONFIRMED number
 * is what a trade designer with the same hardware produces; a MANUFACTURER
 * number is what the part is rated for; an OURS number is a decision we made
 * and can change.
 *
 * Keeping them in one table rather than scattered through the calculation code
 * is deliberate — Smart Glazier holds its rules as server-side data for the
 * same reason, so a fitter can tune them without touching the engine.
 *
 * Full write-up: Notion → Custom Showers UK → Shower Technical Reference.
 */

import type { GlassThickness } from '@/types/square';

/** Job-wide defaults. */
export const RULES = {
  /** [OURS] 10mm for every job; 8 and 12 are explicit per-job overrides. */
  glassThicknessMm: 10 as GlassThickness,
  /** [OURS] Glass-to-glass silicone at a butt joint. Smart Glazier uses 1. */
  siliconeJointMm: 2,
  /** [CONFIRMED] Glass-to-wall silicone. */
  wallSiliconeMm: 2,
  /**
   * [OURS] Which leg of a 90° corner runs through to the outside corner.
   * 'front' is the run carrying the door, which is usually the longer piece.
   */
  cornerRunThrough: 'front' as 'front' | 'return',
  /** [OURS] Butt joint, not a mitre, at 90°. */
  cornerJoint: 'butt' as 'butt' | 'mitre',
  /** [CONFIRMED] Toughened glass density. 10mm → 25 kg/m². */
  glassDensityKgPerM2PerMm: 2.5,
} as const;

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------

/**
 * Glass weight from the *bounding box*, not the cut shape.
 *
 * [CONFIRMED] A raked panel weighs in as the full rectangle. That looks wrong
 * until you remember what the number is for: the toughener prices by the
 * rectangle it has to start from, and the fitter has to carry whatever arrives.
 * Using the true polygon area would under-report both.
 */
export function glassWeightKg(widthMm: number, heightMm: number, thicknessMm: number): number {
  const areaM2 = (widthMm / 1000) * (heightMm / 1000);
  return Math.round(areaM2 * thicknessMm * RULES.glassDensityKgPerM2PerMm * 100) / 100;
}

// ---------------------------------------------------------------------------
// Corners
// ---------------------------------------------------------------------------

/**
 * Width lost by the panel that butts in behind at a corner.
 *
 * [OURS, matches CONFIRMED geometry] At 90° the butting panel sits behind the
 * full thickness of the running panel plus the silicone joint — 12mm for 10mm
 * glass. Smart Glazier's own default is t + 1 because it uses a 1mm joint.
 *
 * For angles off 90° the glass is cut across a longer diagonal, so the loss
 * grows as t / sin θ. [CONFIRMED live at 60° → 12mm and at 90° → 11mm with
 * Smart Glazier's own 1mm joint.]
 *
 * The panel that runs through loses nothing — it reaches the outside corner.
 */
export function cornerButtDeductionMm(
  thicknessMm: number = RULES.glassThicknessMm,
  angleDeg = 90,
  jointMm: number = RULES.siliconeJointMm
): number {
  const theta = (angleDeg * Math.PI) / 180;
  return Math.round(thicknessMm / Math.sin(theta)) + jointMm;
}

// ---------------------------------------------------------------------------
// Hinges
// ---------------------------------------------------------------------------

export interface HingeRating {
  /** How many hinges this rating assumes. */
  count: number;
  maxDoorWidthMm: number;
  maxDoorWeightKg: number;
}

export interface HingeKit {
  id: string;
  name: string;
  /** Glass thicknesses the hinge accepts. */
  glassMm: number[];
  ratings: HingeRating[];
  /** [MANUFACTURER] CRL's published ceiling, where there is one. */
  maxDoorHeightMm: number | null;
}

/**
 * [CONFIRMED live — these are the only size limits Smart Glazier enforced on
 * the Custom Showers account. Everything else it accepted without complaint,
 * including a 3990mm door.]
 */
export const HINGE_KITS: HingeKit[] = [
  {
    id: 'geneva',
    name: 'Geneva',
    glassMm: [8, 10, 12],
    ratings: [
      { count: 2, maxDoorWidthMm: 711, maxDoorWeightKg: 36 },
      { count: 3, maxDoorWidthMm: 813, maxDoorWeightKg: 54 },
    ],
    maxDoorHeightMm: null,
  },
  {
    id: 'bellagio',
    name: 'Bellagio',
    glassMm: [8, 10],
    ratings: [{ count: 2, maxDoorWidthMm: 1000, maxDoorWeightKg: 50 }],
    maxDoorHeightMm: 2500,
  },
];

/** [CONFIRMED] Geneva's glass minimum. Thinner glass cannot carry the fitting. */
export const MIN_GLASS_FOR_HINGE_MM = 8;

export interface HingeSelection {
  kitId: string;
  kitName: string;
  hingeCount: number;
  weightKg: number;
  reason: string;
  warnings: string[];
}

/**
 * Pick the lightest hardware that will actually hold the door.
 *
 * Both width and weight are checked, and they are checked independently —
 * [CONFIRMED] the server suppresses the weight warning when the width warning
 * fires, which can leave a door looking like it has one problem when it has
 * two. We report both, because the fix differs: too wide needs a narrower
 * door, too heavy needs thinner glass or another hinge.
 */
export function selectHinge(
  doorWidthMm: number,
  doorHeightMm: number,
  thicknessMm: number = RULES.glassThicknessMm
): HingeSelection {
  const weightKg = glassWeightKg(doorWidthMm, doorHeightMm, thicknessMm);
  const warnings: string[] = [];

  if (thicknessMm < MIN_GLASS_FOR_HINGE_MM) {
    warnings.push(
      `${thicknessMm}mm glass is too thin for a shower hinge — ${MIN_GLASS_FOR_HINGE_MM}mm is the minimum.`
    );
  }

  const candidates = HINGE_KITS.filter((k) => k.glassMm.includes(thicknessMm));

  // Fewest hinges first, then kit order. A third hinge raises the rating, but
  // it is also another notch in the door, another in the panel beside it, and
  // another thing to line up on site — so two of a stronger hinge beats three
  // of a weaker one whenever both will carry the leaf.
  const ratings = candidates
    .flatMap((kit) => kit.ratings.map((rating) => ({ kit, rating })))
    .sort((a, b) => a.rating.count - b.rating.count);

  for (const { kit, rating } of ratings) {
    if (doorWidthMm <= rating.maxDoorWidthMm && weightKg <= rating.maxDoorWeightKg) {
      const heightWarnings = [...warnings];
      if (kit.maxDoorHeightMm && doorHeightMm > kit.maxDoorHeightMm) {
        heightWarnings.push(
          `Door is ${doorHeightMm}mm tall; ${kit.name} is rated to ${kit.maxDoorHeightMm}mm.`
        );
      }
      return {
        kitId: kit.id,
        kitName: kit.name,
        hingeCount: rating.count,
        weightKg,
        reason: `${rating.count} × ${kit.name} carries ${doorWidthMm}mm / ${weightKg}kg (rated ${rating.maxDoorWidthMm}mm / ${rating.maxDoorWeightKg}kg).`,
        warnings: heightWarnings,
      };
    }
  }

  // Nothing fits. Name the best available rating and say which limit it broke,
  // so the review screen can tell the customer what to change.
  const best = candidates
    .flatMap((k) => k.ratings.map((r) => ({ kit: k, rating: r })))
    .sort((a, b) => b.rating.maxDoorWeightKg - a.rating.maxDoorWeightKg)[0];

  if (!best) {
    warnings.push(`No hinge in our range takes ${thicknessMm}mm glass.`);
    return {
      kitId: 'none',
      kitName: 'None',
      hingeCount: 0,
      weightKg,
      reason: 'No suitable hinge.',
      warnings,
    };
  }

  if (doorWidthMm > best.rating.maxDoorWidthMm) {
    warnings.push(
      `Door is ${doorWidthMm}mm wide; the widest we hang is ${best.rating.maxDoorWidthMm}mm (${best.rating.count} × ${best.kit.name}).`
    );
  }
  if (weightKg > best.rating.maxDoorWeightKg) {
    // The width this door *could* be at its current height and thickness —
    // the number a customer can act on.
    const maxWidth = Math.floor(
      (best.rating.maxDoorWeightKg /
        ((doorHeightMm / 1000) * thicknessMm * RULES.glassDensityKgPerM2PerMm)) *
        1000
    );
    warnings.push(
      `Door weighs ${weightKg}kg; the limit is ${best.rating.maxDoorWeightKg}kg. At ${doorHeightMm}mm tall in ${thicknessMm}mm glass the widest it can be is ${maxWidth}mm.`
    );
  }

  return {
    kitId: best.kit.id,
    kitName: best.kit.name,
    hingeCount: best.rating.count,
    weightKg,
    reason: `Beyond the range of ${best.rating.count} × ${best.kit.name} — needs a different design.`,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Hinge and handle placement
// ---------------------------------------------------------------------------

/** [CONFIRMED] Hinges sit 250mm from the top and bottom of the *door glass*. */
export const HINGE_OFFSET_MM = 250;

/**
 * Hinge centre heights, measured up from the bottom of the door glass.
 *
 * [CONFIRMED] Top and bottom at 250mm from their own end; a third hinge is
 * centred on the leaf rather than spaced evenly between the other two.
 */
export function hingeHeightsMm(doorHeightMm: number, count = 2): number[] {
  if (count < 2) return [doorHeightMm / 2];
  const heights = [HINGE_OFFSET_MM, doorHeightMm - HINGE_OFFSET_MM];
  if (count >= 3) heights.splice(1, 0, Math.round(doorHeightMm / 2));
  return heights.sort((a, b) => a - b);
}

/**
 * Where the mating notch goes in the fixed panel beside the door.
 *
 * [CONFIRMED] This is the rule that catches people out. The notch is set at
 * the door hinge's *absolute height above the floor*, not at 250mm from the
 * fixed panel's own edge — the two panels sit on different gaps, so matching
 * the numbers would misalign the hinge leaves.
 *
 * Smart Glazier's worked example: door bottom 10mm off the floor, side panel
 * in a 7mm channel → the side's notch reads 253mm, against the door's 250mm.
 */
export function mateNotchHeightMm(
  hingeHeightOnDoorMm: number,
  doorBottomAboveFloorMm: number,
  panelBottomAboveFloorMm: number
): number {
  return Math.round(hingeHeightOnDoorMm + doorBottomAboveFloorMm - panelBottomAboveFloorMm);
}

/** [CONFIRMED] Handle holes are 203mm apart — an 8 inch pull. */
export const HANDLE_HOLE_SPACING_MM = 203;
/** [CONFIRMED] Hole centres sit 76mm in from the handle-side edge. */
export const HANDLE_HOLE_INSET_MM = 76;
/** [CONFIRMED] Ø12 through the glass. */
export const HANDLE_HOLE_DIAMETER_MM = 12;
/** [CONFIRMED] A hole centre nearer than this to an edge fails fabrication. */
export const MIN_HOLE_EDGE_DISTANCE_MM = 25;

/**
 * [TRADE] A hole's clearances scale with the hole, not with a flat number.
 *
 * SW Glass publishes both as 2x the diameter — so a 16mm clamp hole wants
 * 32mm to the edge rather than the flat 25mm CRL's server enforces. The flat
 * figure is right for the 12mm handle holes we drill most often and wrong for
 * anything larger, which is the direction that breaks glass.
 */
export const HOLE_EDGE_DISTANCE_MULTIPLIER = 2;
export const HOLE_SPACING_MULTIPLIER = 2;

/** The larger of the flat minimum and the diameter-scaled one. */
export function minHoleEdgeDistanceMm(holeDiameterMm: number): number {
  return Math.max(
    MIN_HOLE_EDGE_DISTANCE_MM,
    Math.round(holeDiameterMm * HOLE_EDGE_DISTANCE_MULTIPLIER)
  );
}

/** Minimum centre-to-centre spacing between two holes of a given diameter. */
export function minHoleSpacingMm(holeDiameterMm: number): number {
  return Math.round(holeDiameterMm * HOLE_SPACING_MULTIPLIER);
}

/**
 * Handle hole heights, measured up from the bottom of the door glass.
 *
 * [CONFIRMED] The handle is centred vertically on the leaf. Smart Glazier can
 * also lock it to a fixed height from an end; we centre it, which is what a
 * 1990mm door's 893.5 / 1096.5 pair comes from.
 */
export function handleHoleHeightsMm(doorHeightMm: number): {
  centreMm: number;
  lowerMm: number;
  upperMm: number;
} {
  const centreMm = Math.round((doorHeightMm / 2) * 10) / 10;
  return {
    centreMm,
    lowerMm: Math.round((centreMm - HANDLE_HOLE_SPACING_MM / 2) * 10) / 10,
    upperMm: Math.round((centreMm + HANDLE_HOLE_SPACING_MM / 2) * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Cutout geometry
// ---------------------------------------------------------------------------

/**
 * [CONFIRMED] Cutout sizes for the hardware we fit.
 *
 * Internal corners are radiused and holes are set in from the edge because
 * toughened glass fails at sharp internal corners and at edge-proximate holes.
 * The toughener rejects the shape outright, so these are not preferences.
 */
export const CUTOUTS = {
  /** Edge notch in the door leaf for a glass hinge. */
  doorHingeNotch: { widthMm: 58, heightMm: 47, radiusMm: 8 },
  /** Edge notch in the fixed panel that mates with it. */
  fixedHingeNotch: { widthMm: 52, heightMm: 33, radiusMm: 8 },
  /**
   * Through-hole for a wall clamp.
   *
   * [CONFIRMED] CRL specify 25mm to the centre for this clamp. Note that the
   * general trade rule of twice the diameter would want 32mm, so this sits
   * inside it — a manufacturer's figure for a tested fitting beats a rule of
   * thumb, but it is worth knowing which way the difference runs if a
   * toughener ever queries it.
   */
  clampHole: { diameterMm: 16, insetMm: 25 },
  /** Through-hole pair for a pull handle. */
  handleHole: {
    diameterMm: HANDLE_HOLE_DIAMETER_MM,
    insetMm: HANDLE_HOLE_INSET_MM,
    spacingMm: HANDLE_HOLE_SPACING_MM,
  },
} as const;

// ---------------------------------------------------------------------------
// Fabrication limits
// ---------------------------------------------------------------------------

/**
 * Our own limits.
 *
 * [CONFIRMED] Smart Glazier enforces *none* of these on the Custom Showers
 * account — no minimum door width, no maximum door height, no panel size
 * limits. It accepted a 100mm door and a 3990mm one. Nothing upstream will
 * catch a nonsense size, so these have to be ours.
 *
 * The two marked CONFIRMED are real fabrication limits the server does check.
 */
export const LIMITS = {
  /** [OURS] Below this it is not usable as a door. */
  minDoorWidthMm: 450,
  /** [OURS] Matches the widest hinge rating we stock. */
  maxDoorWidthMm: 1000,
  /** [MANUFACTURER] Bellagio's published ceiling. */
  maxDoorHeightMm: 2500,
  /** [OURS] */
  minDoorHeightMm: 1400,
  /** [OURS] */
  minPanelWidthMm: 150,
  /** [TRADE] Below this a piece is offcut rather than panel. */
  minPanelHeightMm: 150,
  /**
   * [TRADE] SW Glass will not cut a piece narrower than this at all. That is
   * their commercial floor rather than a law of glass, and two of our own
   * templates sit on 300mm, so it asks rather than blocks — but a toughener
   * who shares the policy would reject the job, which is worth knowing before
   * the order goes in than after.
   */
  narrowPanelAdviceMm: 300,
  /** [CONFIRMED] A panel carrying any cutout must be at least this wide. */
  minPanelWidthWithCutoutsMm: 120,
  /** [CONFIRMED] Hole centre to the far edge, before the diameter scaling. */
  minHoleEdgeDistanceMm: MIN_HOLE_EDGE_DISTANCE_MM,
  /**
   * [TRADE] Toughening limit. A pane longer than ten times its width warps or
   * shatters in the furnace, so the toughener refuses it outright — and a
   * narrow return beside a door is exactly where a shower run hits this.
   */
  maxAspectRatio: 10,
  /** [OURS] A two-person lift, and the hinge limit. */
  maxPanelWeightKg: 50,
} as const;

export interface LimitCheck {
  code: string;
  severity: 'warning' | 'blocking';
  message: string;
}

/** Size checks for one door leaf. */
export function checkDoorLimits(widthMm: number, heightMm: number): LimitCheck[] {
  const out: LimitCheck[] = [];
  if (widthMm < LIMITS.minDoorWidthMm) {
    out.push({
      code: 'door-too-narrow',
      severity: 'blocking',
      message: `Door is ${widthMm}mm wide. Below ${LIMITS.minDoorWidthMm}mm it is not comfortable to use — widen the door or change the layout.`,
    });
  }
  if (widthMm > LIMITS.maxDoorWidthMm) {
    out.push({
      code: 'door-too-wide',
      severity: 'blocking',
      message: `Door is ${widthMm}mm wide. ${LIMITS.maxDoorWidthMm}mm is the widest single hinged door we hang — consider a double door.`,
    });
  }
  if (heightMm > LIMITS.maxDoorHeightMm) {
    out.push({
      code: 'door-too-tall',
      severity: 'blocking',
      message: `Door is ${heightMm}mm tall. ${LIMITS.maxDoorHeightMm}mm is the published maximum for our hinges.`,
    });
  }
  if (heightMm < LIMITS.minDoorHeightMm) {
    out.push({
      code: 'door-too-short',
      severity: 'warning',
      message: `Door is only ${heightMm}mm tall — check this is what you meant.`,
    });
  }
  return out;
}

/** Size checks for any panel. */
export function checkPanelLimits(
  widthMm: number,
  heightMm: number,
  thicknessMm: number,
  hasCutouts: boolean
): LimitCheck[] {
  const out: LimitCheck[] = [];

  const floor = hasCutouts ? LIMITS.minPanelWidthWithCutoutsMm : LIMITS.minPanelWidthMm;
  if (widthMm < floor) {
    out.push({
      code: 'panel-too-narrow',
      severity: 'blocking',
      message: hasCutouts
        ? `Panel is ${widthMm}mm wide. A panel with a hinge or clamp cutout must be at least ${LIMITS.minPanelWidthWithCutoutsMm}mm — there is not enough glass around the cutout otherwise.`
        : `Panel is ${widthMm}mm wide, below our ${LIMITS.minPanelWidthMm}mm minimum.`,
    });
  } else if (widthMm < LIMITS.narrowPanelAdviceMm) {
    out.push({
      code: 'panel-narrow',
      severity: 'warning',
      message: `Panel is ${widthMm}mm wide. Some toughening shops will not cut below ${LIMITS.narrowPanelAdviceMm}mm — worth confirming with ours before the order goes in.`,
    });
  }

  if (heightMm > 0 && heightMm < LIMITS.minPanelHeightMm) {
    out.push({
      code: 'panel-too-short',
      severity: 'blocking',
      message: `Panel is ${heightMm}mm high, below the ${LIMITS.minPanelHeightMm}mm minimum we can cut.`,
    });
  }

  // Toughening, not handling: this one is refused at the furnace rather than
  // flagged on site, so there is no point sending it and finding out.
  const longest = Math.max(widthMm, heightMm);
  const shortest = Math.min(widthMm, heightMm);
  if (shortest > 0 && longest / shortest > LIMITS.maxAspectRatio) {
    const ratio = Math.round((longest / shortest) * 10) / 10;
    const minShort = Math.ceil(longest / LIMITS.maxAspectRatio);
    out.push({
      code: 'panel-too-slender',
      severity: 'blocking',
      message: `Panel is ${widthMm} × ${heightMm}mm, a ratio of ${ratio}:1. Toughened glass cannot be more than ${LIMITS.maxAspectRatio}:1 — it distorts in the furnace — so at ${longest}mm long the narrow side has to be at least ${minShort}mm.`,
    });
  }

  const weight = glassWeightKg(widthMm, heightMm, thicknessMm);
  if (weight > LIMITS.maxPanelWeightKg) {
    out.push({
      code: 'panel-too-heavy',
      severity: 'warning',
      message: `Panel weighs ${weight}kg — over our ${LIMITS.maxPanelWeightKg}kg handling limit. It will need extra fixing and more than two people to fit.`,
    });
  }

  return out;
}

/**
 * Seals and gaskets are thickness-specific.
 *
 * [CONFIRMED] Changing a job from 10mm to 12mm silently dropped the PCR10 and
 * P990WS seals from the parts list and moved the door base gap from 10mm back
 * to 7mm — flagged only as a low-severity note, easy to click past. Worth
 * saying loudly whenever the glass is not our standard.
 */
export function checkGlassSpec(thicknessMm: number): LimitCheck[] {
  if (thicknessMm === RULES.glassThicknessMm) return [];
  return [
    {
      code: 'non-standard-glass',
      severity: 'warning',
      message: `${thicknessMm}mm glass is a special — our standard is ${RULES.glassThicknessMm}mm. Seals, gaskets and channel are all thickness-specific, so the whole hardware list changes with it.`,
    },
  ];
}
