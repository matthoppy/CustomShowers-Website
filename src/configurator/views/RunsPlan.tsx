/**
 * The customer's own shower, seen from above, with every floor measurement on
 * it at once.
 *
 * A corner shower is measured twice along the floor — the front and the
 * return — and the commonest mistake is measuring the right distance on the
 * wrong side. Putting both on one top-down drawing, numbered to match the
 * boxes underneath, lets someone see which wall each number belongs to before
 * they walk over to it.
 *
 * Also used for the door opening question, where the same drawing highlights
 * the door instead and swings it open.
 */

import { useMemo } from 'react';
import { runPanelIndices, traceChain } from '../geometry';
import type { ConfiguratorJunction, ConfiguratorPanel } from '../types';

const W = 320;
const H = 220;
/** Room around the drawing for dimensions and labels. */
const PAD_X = 52;
const PAD_Y = 32;
/** How far a dimension line sits off the glass, in screen pixels. */
const DIM_OFFSET = 26;

const WALL = 'hsl(var(--muted-foreground) / 0.3)';
const GLASS = 'hsl(var(--muted-foreground))';
const INK = 'hsl(var(--muted-foreground))';
const ACCENT = 'hsl(var(--primary))';
const BLADE = 'hsl(45 90% 60%)';

interface Pt {
  x: number;
  y: number;
}

export interface RunsPlanProps {
  panels: ConfiguratorPanel[];
  junctions: ConfiguratorJunction[];
  leftWall: boolean;
  rightWall: boolean;
  /** Labels for each straight run, as numbered in the inputs. */
  labels: string[];
  /** Values to print on each run's dimension, if measured. */
  values?: (number | null)[];
  /** Which run's tape to animate. Null animates none. */
  activeRun?: number | null;
  /** Highlight the door and its opening instead of the runs. */
  door?: boolean;
  className?: string;
}

export function RunsPlan({
  panels,
  junctions,
  leftWall,
  rightWall,
  labels,
  values,
  activeRun = null,
  door = false,
  className,
}: RunsPlanProps) {
  const trace = useMemo(() => traceChain(panels, junctions), [panels, junctions]);
  const runs = useMemo(() => runPanelIndices(panels, junctions), [panels, junctions]);

  if (panels.length === 0) return null;

  const contentW = trace.maxX - trace.minX || 1000;
  // When the door is drawn swinging, its arc has to fit too. The door sits on
  // y = 0 and opens towards +y, so the swing adds its own width below it.
  const swingPanel = door ? panels.find((p) => p.kind === 'door') : undefined;
  const boundsMaxY = Math.max(trace.maxY, swingPanel ? swingPanel.width_mm : trace.maxY);
  // And room above it for the "door opening" dimension.
  // A shower with returns already has depth above the door to put it in.
  const boundsMinY = Math.min(trace.minY, swingPanel ? -swingPanel.width_mm * 0.45 : trace.minY);
  const contentH = boundsMaxY - boundsMinY;
  // A straight run has no depth; give it a nominal one so it is not squashed
  // against the top edge, and leave room for the wall stubs.
  const effH = Math.max(contentH, contentW * 0.25);
  // Run dimensions sit outside the glass and need the margin; the door's sits
  // inside, so the door drawing can use more of the height.
  const padY = door ? PAD_Y : PAD_Y + 16;
  const scale = Math.min((W - PAD_X * 2) / contentW, (H - padY * 2) / effH);
  const ox = W / 2 - (trace.minX + contentW / 2) * scale;
  const oy = H / 2 - (boundsMinY + contentH / 2) * scale + (contentH === 0 ? 10 : 0);
  const tx = (x: number) => x * scale + ox;
  const ty = (y: number) => y * scale + oy;

  // The middle of the enclosure — dimensions go on the side away from it.
  const centre: Pt = {
    x: tx(trace.minX + contentW / 2),
    y: trace.maxY === trace.minY ? -Infinity : ty((trace.minY + trace.maxY) / 2),
  };

  /** A run's two ends: the furthest-apart pair of its segment end points. */
  const runEnds = (indices: number[]): [Pt, Pt] => {
    const pts: Pt[] = [];
    for (const i of indices) {
      const s = trace.segments[i];
      if (!s) continue;
      pts.push({ x: tx(s.x1), y: ty(s.y1) }, { x: tx(s.x2), y: ty(s.y2) });
    }
    let best: [Pt, Pt] = [pts[0], pts[1] ?? pts[0]];
    let bestD = -1;
    for (const a of pts) {
      for (const b of pts) {
        const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (d > bestD) {
          bestD = d;
          best = [a, b];
        }
      }
    }
    return best;
  };

  /** Unit normal pointing away from the middle of the enclosure. */
  const outward = (a: Pt, b: Pt): Pt => {
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const toMid = { x: mid.x - centre.x, y: mid.y - centre.y };
    const dot = n.x * toMid.x + n.y * (Number.isFinite(toMid.y) ? toMid.y : 1);
    return dot >= 0 ? n : { x: -n.x, y: -n.y };
  };

  // Wall stubs at the two ends of the chain, square to the glass there.
  const first = trace.segments[0];
  const last = trace.segments[panels.length - 1];
  // traceChain walks outwards from the door, so a segment left of the door
  // has its far end in (x2, y2) — the chain's start is the door's own x1 only
  // when the door is the first panel. The chain's end is always an x2.
  const chainStart = first ? (trace.anchorIndex === 0 ? { x: first.x1, y: first.y1 } : { x: first.x2, y: first.y2 }) : null;
  const chainEnd = last ? { x: last.x2, y: last.y2 } : null;
  const firstDir = first ? { x: -first.dx, y: -first.dy } : { x: -1, y: 0 };
  const lastDir = last ? { x: last.dx, y: last.dy } : { x: 1, y: 0 };

  const wallStub = (p: { x: number; y: number }, dir: { x: number; y: number }, key: string) => {
    const c = { x: tx(p.x), y: ty(p.y) };
    // The wall runs square to the glass, and sits just beyond its end.
    const along = { x: dir.x, y: dir.y };
    const across = { x: -dir.y, y: dir.x };
    const half = 34;
    const depth = 10;
    const pts = [
      { x: c.x - across.x * half, y: c.y - across.y * half },
      { x: c.x + across.x * half, y: c.y + across.y * half },
      { x: c.x + across.x * half + along.x * depth, y: c.y + across.y * half + along.y * depth },
      { x: c.x - across.x * half + along.x * depth, y: c.y - across.y * half + along.y * depth },
    ];
    return <polygon key={key} points={pts.map((q) => `${q.x},${q.y}`).join(' ')} fill={WALL} />;
  };

  // Which direction is "beyond the end" depends on which way the segment was
  // walked from the door, so work it out from the chain ends rather than dx.
  const startStubDir = (() => {
    if (!first || !chainStart) return firstDir;
    const other = trace.anchorIndex === 0 ? { x: first.x2, y: first.y2 } : { x: first.x1, y: first.y1 };
    const len = Math.hypot(chainStart.x - other.x, chainStart.y - other.y) || 1;
    return { x: (chainStart.x - other.x) / len, y: (chainStart.y - other.y) / len };
  })();
  const endStubDir = (() => {
    if (!last || !chainEnd) return lastDir;
    const len = Math.hypot(last.x2 - last.x1, last.y2 - last.y1) || 1;
    return { x: (last.x2 - last.x1) / len, y: (last.y2 - last.y1) / len };
  })();

  const doorIndex = panels.findIndex((p) => p.kind === 'door');
  const doorSeg = doorIndex >= 0 ? trace.segments[doorIndex] : null;
  const doorPanel = doorIndex >= 0 ? panels[doorIndex] : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={['md-anim', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={
        door
          ? 'Your shower from above, with the door opening marked'
          : `Your shower from above, with ${runs.length === 1 ? 'the floor measurement' : `all ${runs.length} floor measurements`} marked`
      }
    >
      <text x={W / 2} y={14} textAnchor="middle" fontSize={10} fill={INK}>
        seen from above
      </text>

      {leftWall && chainStart && wallStub(chainStart, startStubDir, 'start')}
      {rightWall && chainEnd && wallStub(chainEnd, endStubDir, 'end')}

      {/* The glass. */}
      {trace.segments.map((s, i) => {
        if (!s) return null;
        const isDoor = panels[i].kind === 'door';
        const lit = door && isDoor;
        return (
          <line
            key={panels[i].id}
            x1={tx(s.x1)}
            y1={ty(s.y1)}
            x2={tx(s.x2)}
            y2={ty(s.y2)}
            stroke={lit ? ACCENT : GLASS}
            strokeOpacity={door && !isDoor ? 0.45 : 1}
            strokeWidth={isDoor ? 4 : 5}
            strokeLinecap="round"
          />
        );
      })}

      {/* Door: swing it open so "opening" means something. */}
      {door && doorSeg && doorPanel && (() => {
        const hingeLeft = doorPanel.door?.hinge_side === 'left';
        const hinge = hingeLeft ? { x: doorSeg.x1, y: doorSeg.y1 } : { x: doorSeg.x2, y: doorSeg.y2 };
        const free = hingeLeft ? { x: doorSeg.x2, y: doorSeg.y2 } : { x: doorSeg.x1, y: doorSeg.y1 };
        const h = { x: tx(hinge.x), y: ty(hinge.y) };
        const f = { x: tx(free.x), y: ty(free.y) };
        const r = Math.hypot(f.x - h.x, f.y - h.y);
        // Opening outwards is towards +y in the trace (into the bathroom).
        const sweep = hingeLeft ? 1 : 0;
        const a = { x: f.x, y: f.y };
        // Fully open: square to the glass, out into the bathroom.
        const b = { x: h.x, y: h.y + r };
        // The door always lies along y = 0 and opens towards +y, so its
        // dimension goes on the shower side, clear of the swing.
        const off = { x: 0, y: -DIM_OFFSET };
        return (
          <g>
            <path
              d={`M ${h.x} ${h.y} L ${a.x} ${a.y} A ${r} ${r} 0 0 ${sweep} ${b.x} ${b.y} Z`}
              fill={ACCENT}
              fillOpacity={0.08}
              stroke={ACCENT}
              strokeOpacity={0.35}
              strokeDasharray="3 3"
            />
            <line
              className="md-swing"
              style={{
                transformOrigin: `${h.x}px ${h.y}px`,
                ['--md-swing-to' as string]: hingeLeft ? '75deg' : '-75deg',
              }}
              x1={h.x}
              y1={h.y}
              x2={f.x}
              y2={f.y}
              stroke={ACCENT}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <circle cx={h.x} cy={h.y} r={3.5} fill={ACCENT} />
            <g className="md-result">
              <PlanDim a={{ x: h.x + off.x, y: h.y + off.y }} b={{ x: f.x + off.x, y: f.y + off.y }} />
              <text
                x={(h.x + f.x) / 2 + off.x}
                y={(h.y + f.y) / 2 + off.y - 8}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill={ACCENT}
              >
                door opening
              </text>
            </g>
            <text
              x={(h.x + f.x) / 2}
              y={Math.min(h.y + r * 0.55, H - 4)}
              textAnchor="middle"
              fontSize={10}
              fill={INK}
            >
              opens out
            </text>
          </g>
        );
      })()}

      {/* One dimension per straight run, numbered to match the inputs. */}
      {!door &&
        runs.map((indices, r) => {
          const [a, b] = runEnds(indices);
          if (!a || !b) return null;
          const n = outward(a, b);
          const off = { x: n.x * DIM_OFFSET, y: n.y * DIM_OFFSET };
          const pa = { x: a.x + off.x, y: a.y + off.y };
          const pb = { x: b.x + off.x, y: b.y + off.y };
          const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
          const active = activeRun === null || activeRun === r;
          const value = values?.[r];
          // The tape runs from one end of the run to the other along the
          // glass line, a little inside the dimension.
          const ta = { x: a.x + n.x * 10, y: a.y + n.y * 10 };
          const tb = { x: b.x + n.x * 10, y: b.y + n.y * 10 };
          const len = Math.hypot(tb.x - ta.x, tb.y - ta.y);
          const angle = (Math.atan2(tb.y - ta.y, tb.x - ta.x) * 180) / Math.PI;
          return (
            <g key={r} opacity={active ? 1 : 0.4}>
              {activeRun === r && (
                <g transform={`translate(${ta.x} ${ta.y}) rotate(${angle})`}>
                  <rect className="md-extend-x" x={0} y={-3} width={len} height={6} fill={BLADE} />
                </g>
              )}
              <PlanDim a={pa} b={pb} />
              <circle cx={mid.x + n.x * 14} cy={mid.y + n.y * 14} r={10} fill={ACCENT} />
              <text
                x={mid.x + n.x * 14}
                y={mid.y + n.y * 14}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight={700}
                fill="hsl(var(--primary-foreground))"
              >
                {r + 1}
              </text>
              {value ? (
                <text
                  x={mid.x + n.x * 14 + (Math.abs(n.y) > 0.5 ? 16 : 0)}
                  y={mid.y + n.y * 14 + (Math.abs(n.x) > 0.5 ? 20 : 0)}
                  textAnchor={Math.abs(n.y) > 0.5 ? 'start' : 'middle'}
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight={700}
                  fill={ACCENT}
                >
                  {value}
                </text>
              ) : null}
              <title>{labels[r]}</title>
            </g>
          );
        })}
    </svg>
  );
}

/** A dimension line between two points, with a tick across each end. */
function PlanDim({ a, b }: { a: Pt; b: Pt }) {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const n = { x: (-(b.y - a.y) / len) * 5, y: ((b.x - a.x) / len) * 5 };
  return (
    <g stroke={ACCENT} strokeWidth={1.75}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      <line x1={a.x - n.x} y1={a.y - n.y} x2={a.x + n.x} y2={a.y + n.y} />
      <line x1={b.x - n.x} y1={b.y - n.y} x2={b.x + n.x} y2={b.y + n.y} />
    </g>
  );
}
