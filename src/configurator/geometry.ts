/**
 * Chain geometry.
 *
 * Walks the panel run in plan (top-down) and produces a segment per panel in
 * millimetre space, plus the bounding box. Views scale that into pixels; the
 * spec uses it to work out which panels are returns.
 *
 * Extracted from the Square v1 plan view, with two changes:
 *   - it no longer requires a door to be present (fixed-panel-only runs are
 *     a real product, and the old code returned early before its hooks ran)
 *   - it is pure, so both the plan view and the spec builder share one source
 *     of truth for where a panel actually sits.
 */

import type { ConfiguratorJunction, ConfiguratorPanel } from './types';

export interface Segment {
  id: string;
  /** Index into the panels array. */
  index: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Unit direction of travel along the panel. */
  dx: number;
  dy: number;
}

export interface ChainTrace {
  segments: Segment[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /** Index the walk was anchored on — the door where there is one. */
  anchorIndex: number;
}

/** Rotate a heading 90° anticlockwise. */
function turnLeft(dx: number, dy: number): [number, number] {
  return [-dy, dx];
}

/** Rotate a heading 90° clockwise. */
function turnRight(dx: number, dy: number): [number, number] {
  return [dy, -dx];
}

/**
 * Trace the run in plan space, anchoring on the door so the door always sits
 * on the x-axis facing the viewer. With no door we anchor on the first panel.
 */
export function traceChain(
  panels: ConfiguratorPanel[],
  junctions: ConfiguratorJunction[]
): ChainTrace {
  const segments: Segment[] = [];

  if (panels.length === 0) {
    return { segments, minX: 0, maxX: 0, minY: 0, maxY: 0, anchorIndex: 0 };
  }

  const doorIndex = panels.findIndex((p) => p.kind === 'door');
  const anchorIndex = doorIndex === -1 ? 0 : doorIndex;
  const anchor = panels[anchorIndex];

  segments[anchorIndex] = {
    id: anchor.id,
    index: anchorIndex,
    x1: 0,
    y1: 0,
    x2: anchor.width_mm,
    y2: 0,
    dx: 1,
    dy: 0,
  };

  // Walk left from the anchor's left edge, travelling in -x to begin with.
  let curX = 0;
  let curY = 0;
  let dx = -1;
  let dy = 0;
  for (let i = anchorIndex - 1; i >= 0; i--) {
    // junctions[i] joins panel i to panel i + 1.
    if (junctions[i]?.angle_deg === 90) {
      [dx, dy] = turnLeft(dx, dy);
    }
    const p = panels[i];
    const nextX = curX + dx * p.width_mm;
    const nextY = curY + dy * p.width_mm;
    segments[i] = { id: p.id, index: i, x1: curX, y1: curY, x2: nextX, y2: nextY, dx, dy };
    curX = nextX;
    curY = nextY;
  }

  // Walk right from the anchor's right edge, travelling in +x to begin with.
  curX = anchor.width_mm;
  curY = 0;
  dx = 1;
  dy = 0;
  for (let i = anchorIndex + 1; i < panels.length; i++) {
    if (junctions[i - 1]?.angle_deg === 90) {
      [dx, dy] = turnRight(dx, dy);
    }
    const p = panels[i];
    const nextX = curX + dx * p.width_mm;
    const nextY = curY + dy * p.width_mm;
    segments[i] = { id: p.id, index: i, x1: curX, y1: curY, x2: nextX, y2: nextY, dx, dy };
    curX = nextX;
    curY = nextY;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const s of segments) {
    minX = Math.min(minX, s.x1, s.x2);
    maxX = Math.max(maxX, s.x1, s.x2);
    minY = Math.min(minY, s.y1, s.y2);
    maxY = Math.max(maxY, s.y1, s.y2);
  }

  return { segments, minX, maxX, minY, maxY, anchorIndex };
}

export type Plane = 'front' | 'return_left' | 'return_right' | 'back';

/**
 * Classify each panel by the plane it sits in.
 *
 * Square v1 hardcoded every panel to 'front', which quietly disabled the
 * support-bar rule (it only fires on wide *return* panels) and the corner
 * long/short deduction. Deriving it from the trace fixes both.
 */
export function derivePlanes(
  panels: ConfiguratorPanel[],
  junctions: ConfiguratorJunction[]
): Plane[] {
  const { segments, anchorIndex } = traceChain(panels, junctions);

  return panels.map((_, i) => {
    const seg = segments[i];
    if (!seg) return 'front';

    // Travelling along y means the panel turns away from the anchor's face.
    if (Math.abs(seg.dy) > Math.abs(seg.dx)) {
      return i < anchorIndex ? 'return_left' : 'return_right';
    }

    // Travelling along x. Reversed direction means the run has wrapped round
    // and is now facing back at the anchor.
    const goingAway = i < anchorIndex ? seg.dx < 0 : seg.dx > 0;
    return goingAway ? 'front' : 'back';
  });
}

/** Straight-line width of the run, ignoring corners. */
export function totalRunWidthMm(panels: ConfiguratorPanel[]): number {
  return panels.reduce((sum, p) => sum + p.width_mm, 0);
}

export interface Point {
  x: number;
  y: number;
}

export interface RunEnd extends Point {
  /** Unit vector pointing away from the run, out towards the wall. */
  dx: number;
  dy: number;
}

/**
 * Where junction `i` — the joint between panel i and panel i + 1 — actually is.
 *
 * The walk runs outward from the anchor in both directions, so a left-side
 * panel's x1/y1 is its edge *nearest* the anchor while a right-side panel's
 * x2/y2 is. Getting this backwards puts corner markers on the far end of the
 * wrong panel.
 */
export function junctionPoint(trace: ChainTrace, i: number): Point | null {
  const seg = trace.segments[i];
  if (!seg) return null;
  return i < trace.anchorIndex ? { x: seg.x1, y: seg.y1 } : { x: seg.x2, y: seg.y2 };
}

/** The two open ends of the run, where it meets a wall. */
export function runEnds(trace: ChainTrace, panelCount: number): {
  left: RunEnd | null;
  right: RunEnd | null;
} {
  const first = trace.segments[0];
  const last = trace.segments[panelCount - 1];

  // Panel 0 is only traced outward-from-anchor when it sits left of it. When
  // panel 0 *is* the anchor, its left edge is x1 and "outward" is backwards
  // along the panel.
  const left: RunEnd | null = !first
    ? null
    : trace.anchorIndex > 0
      ? { x: first.x2, y: first.y2, dx: first.dx, dy: first.dy }
      : { x: first.x1, y: first.y1, dx: -first.dx, dy: -first.dy };

  const right: RunEnd | null = !last
    ? null
    : { x: last.x2, y: last.y2, dx: last.dx, dy: last.dy };

  return { left, right };
}
