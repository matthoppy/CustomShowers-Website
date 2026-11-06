/**
 * The measuring cards.
 *
 * The measuring step is a deck of cards, one task each: a short instruction
 * to read, or one number to type. The deck is dealt from the shape of the
 * shower and the tool in the customer's hand, so a single door measured with
 * a laser gets the eight readings to the cross and nothing else, and a
 * walk-in screen measured with a tape gets its own, shorter sequence.
 *
 * Nothing here touches the engine. A reading card names the field it writes
 * through readField/writeField, which call the same functions measure.ts has
 * always used, so every rule and cross-check stays where it was.
 */

import { isSingleDoor, runPanelIndices } from '../geometry';
import { scaleRunPanels } from '../layout';
import {
  applyCrossReadings,
  createCrossReadings,
  CROSS_POINTS,
  toolFor,
  type CrossKey,
} from '../measure';
import { CEILING } from '../rules';
import type { ConfiguratorState } from '../types';

/** What the picture on a card shows. Each kind has a component in ./visuals. */
export type CardVisual =
  | { kind: 'tape-line' }
  | { kind: 'laser-setup'; toCeiling: boolean }
  | { kind: 'cross-reading'; point: number; toCeiling: boolean }
  | { kind: 'height' };

/** Where a reading card's number goes. */
export type CardField = { kind: 'cross'; key: CrossKey } | { kind: 'height' };

export interface MeasureCardDef {
  id: string;
  kind: 'instruction' | 'reading' | 'review';
  /** What they are measuring, as the heading. */
  title: string;
  /** Where to take it, in one or two short sentences. */
  instruction: string;
  visual: CardVisual | null;
  field?: CardField;
  /** The words beside the box, for example "Left wall to the line, at the floor". */
  inputLabel?: string;
  /** 1-based position among the reading cards, for "Reading 3 of 8". */
  readingIndex?: number;
  minMm?: number;
  maxMm?: number;
}

export function buildCards(state: ConfiguratorState): MeasureCardDef[] {
  const tool = toolFor(state.opening.method);
  if (isSingleDoor(state) && tool === 'laser') return singleDoorLaser(state);
  // The other shapes and the tape sequences follow once this structure is
  // agreed; until then every shape gets the single-door deck.
  return singleDoorLaser(state);
}

export function readingCards(cards: MeasureCardDef[]): MeasureCardDef[] {
  return cards.filter((c) => c.kind === 'reading');
}

// ---------------------------------------------------------------------------
// Single door between two walls, measured with a laser
// ---------------------------------------------------------------------------

function singleDoorLaser(state: ConfiguratorState): MeasureCardDef[] {
  const toCeiling = state.isFloorToCeiling;
  const top = toCeiling ? 'just below the ceiling' : 'level with the top of the glass';
  const cards: MeasureCardDef[] = [
    {
      id: 'tape-line',
      kind: 'instruction',
      title: 'Mark the glass line',
      instruction:
        'Run masking tape across the floor where the glass will stand, wall to wall. Every number you take is along this line.',
      visual: { kind: 'tape-line' },
    },
    {
      id: 'laser-setup',
      kind: 'instruction',
      title: 'Set up the laser',
      instruction:
        'Stand the laser on the tape in the middle of the opening and switch on both lines. You measure to the lines, never to the laser itself.',
      visual: { kind: 'laser-setup', toCeiling },
    },
  ];

  if (!toCeiling) {
    cards.push({
      id: 'height',
      kind: 'reading',
      title: 'How tall is the glass?',
      instruction: 'From the floor to where you want the top of the glass. Most doors are 2000mm.',
      visual: { kind: 'height' },
      field: { kind: 'height' },
      inputLabel: 'Glass height',
      minMm: 500,
      maxMm: 3000,
    });
  }

  const words: Record<number, { title: string; instruction: string; label: string }> = {
    1: {
      title: 'Left wall, at the bottom',
      instruction: 'Measure from the left wall to the up-and-down line, along the tape.',
      label: 'Left wall to the line, at the floor',
    },
    2: {
      title: 'Left wall, at the top',
      instruction: `Measure from the left wall to the up-and-down line, ${top}.`,
      label: 'Left wall to the line, at the top',
    },
    3: {
      title: 'Right wall, at the bottom',
      instruction: 'Measure from the right wall to the up-and-down line, along the tape.',
      label: 'Right wall to the line, at the floor',
    },
    4: {
      title: 'Right wall, at the top',
      instruction: `Measure from the right wall to the up-and-down line, ${top}.`,
      label: 'Right wall to the line, at the top',
    },
    5: {
      title: 'Floor, on the left',
      instruction: 'Measure down from the level line to the floor, next to the left wall.',
      label: 'Line down to the floor, left',
    },
    6: {
      title: 'Floor, on the right',
      instruction: 'Measure down from the level line to the floor, next to the right wall.',
      label: 'Line down to the floor, right',
    },
    7: {
      title: 'Ceiling, on the left',
      instruction: 'Measure up from the level line to the ceiling, next to the left wall.',
      label: 'Line up to the ceiling, left',
    },
    8: {
      title: 'Ceiling, on the right',
      instruction: 'Measure up from the level line to the ceiling, next to the right wall.',
      label: 'Line up to the ceiling, right',
    },
  };

  for (const p of CROSS_POINTS.filter((x) => x.n <= 6 || toCeiling)) {
    const w = words[p.n];
    cards.push({
      id: `cross-${p.n}`,
      kind: 'reading',
      title: w.title,
      instruction: w.instruction,
      visual: { kind: 'cross-reading', point: p.n, toCeiling },
      field: { kind: 'cross', key: p.key },
      inputLabel: w.label,
      minMm: 50,
      maxMm: 3500,
    });
  }

  cards.push({ id: 'review', kind: 'review', title: 'Your measurements', instruction: '', visual: null });

  // Number the reading cards.
  let n = 0;
  for (const c of cards) if (c.kind === 'reading') c.readingIndex = ++n;
  return cards;
}

// ---------------------------------------------------------------------------
// Reading and writing a card's number
// ---------------------------------------------------------------------------

export function readField(state: ConfiguratorState, field: CardField): number | null {
  if (field.kind === 'height') return state.heightMm;
  return state.opening.crossReadings?.[field.key] ?? null;
}

/**
 * The design with one reading changed. A cross reading goes through
 * applyCrossReadings so the width, the walls, the floor and the ceiling
 * height all follow, exactly as the previous screens did.
 */
export function writeField(state: ConfiguratorState, field: CardField, value: number | null): ConfiguratorState {
  if (field.kind === 'height') {
    return value === null ? state : { ...state, heightMm: value };
  }
  const m = state.opening;
  const cross = m.crossReadings ?? createCrossReadings();
  const next = applyCrossReadings(m, { ...cross, [field.key]: value });
  const width = next.runs[0].widthAtFloorMm;
  const runIndices = runPanelIndices(state.panels, state.junctions);
  const topGap = state.topGapMm ?? CEILING.singleDoorTopGapMm;
  return {
    ...state,
    opening: next,
    panels: width !== m.runs[0].widthAtFloorMm ? scaleRunPanels(state.panels, runIndices[0] ?? [], width) : state.panels,
    // Door height follows the ceiling, less the air gap.
    ...(state.isFloorToCeiling && next.ceilingHeightMm ? { heightMm: next.ceilingHeightMm - topGap } : {}),
  };
}
