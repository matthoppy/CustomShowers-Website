/**
 * The pieces the card pictures are built from.
 *
 * One scene for every card: the shower alcove drawn in cabinet projection,
 * seen from the front and a little above, so the floor, the back wall and
 * both side walls are all there, and the bathroom floor runs out towards the
 * viewer for the laser to stand on. Depth goes up and to the right at half
 * scale. Everything that is measured happens on the front edge of the
 * alcove, the glass line, which is a flat plane facing the viewer, so the
 * tapes read true.
 *
 * One style: a grey room, red laser, yellow tape, blue masking tape with a
 * black marker line, and the brand's accent for the thing being asked for.
 */

import type { CSSProperties, ReactNode } from 'react';

export const VB = { w: 320, h: 240 };
/** Opening width, alcove depth and where the front-left floor corner sits on the page. */
export const W = 196;
export const D = 80;
export const OX = 46;
export const OY = 206;
/** Height of the level laser line above the floor. */
export const LEVEL = 84;
const KX = 0.433;
const KY = 0.25;

/** Picture coordinates of a point in the alcove: x across, y up, z into the shower. */
export function p(x: number, y: number, z: number): { x: number; y: number } {
  return { x: OX + x + KX * z, y: OY - y - KY * z };
}
export const pt = (x: number, y: number, z: number): string => {
  const q = p(x, y, z);
  return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
};

export const WALL = 'hsl(var(--muted-foreground) / 0.14)';
export const WALL_DEEP = 'hsl(var(--muted-foreground) / 0.26)';
export const FLOOR = 'hsl(var(--muted-foreground) / 0.08)';
export const EDGE = 'hsl(var(--muted-foreground) / 0.6)';
export const INK = 'hsl(var(--foreground) / 0.78)';
export const ACCENT = 'hsl(var(--measure-accent))';
export const BG = 'hsl(var(--background))';
export const LASER = '#e11d48';
export const TAPE = '#f5b301';
export const TAPE_DARK = '#8a6400';
export const MASK = '#9ccbff';
export const MARK = '#1b1f24';
export const FONT = 'system-ui, sans-serif';

export function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/** The alcove: bathroom floor in front, then the floor, back wall and side walls, and the ceiling when it matters. */
export function Room({ height, ceiling }: { height: number; ceiling: boolean }) {
  const H = height;
  return (
    <g>
      {/* The bathroom floor, in front of the glass line. */}
      <polygon points={`${pt(-30, 0, -64)} ${pt(W + 30, 0, -64)} ${pt(W + 30, 0, 0)} ${pt(-30, 0, 0)}`} fill={FLOOR} />
      {/* The alcove floor. */}
      <polygon points={`${pt(0, 0, 0)} ${pt(W, 0, 0)} ${pt(W, 0, D)} ${pt(0, 0, D)}`} fill={WALL} stroke={EDGE} strokeWidth={0.8} />
      {/* The back wall. */}
      <polygon points={`${pt(0, 0, D)} ${pt(W, 0, D)} ${pt(W, H, D)} ${pt(0, H, D)}`} fill={WALL} stroke={EDGE} strokeWidth={0.8} />
      {/* The two side walls, inside faces. */}
      <polygon points={`${pt(0, 0, 0)} ${pt(0, 0, D)} ${pt(0, H, D)} ${pt(0, H, 0)}`} fill={WALL_DEEP} stroke={EDGE} strokeWidth={0.8} />
      <polygon points={`${pt(W, 0, 0)} ${pt(W, 0, D)} ${pt(W, H, D)} ${pt(W, H, 0)}`} fill={WALL_DEEP} stroke={EDGE} strokeWidth={0.8} />
      {/* The ceiling, as a thin slab. */}
      {ceiling && <polygon points={`${pt(0, H, 0)} ${pt(W, H, 0)} ${pt(W, H, D)} ${pt(0, H, D)}`} fill={WALL} stroke={EDGE} strokeWidth={0.8} />}
      {/* The front edges of the walls, where the glass line is. */}
      <line x1={p(0, 0, 0).x} y1={p(0, 0, 0).y} x2={p(0, H, 0).x} y2={p(0, H, 0).y} stroke={EDGE} strokeWidth={1.2} />
      <line x1={p(W, 0, 0).x} y1={p(W, 0, 0).y} x2={p(W, H, 0).x} y2={p(W, H, 0).y} stroke={EDGE} strokeWidth={1.2} />
    </g>
  );
}

/** A short piece of masking tape on the floor against a wall, with the marker line across it. */
export function FloorMark({ side, drawn = true, animate = false }: { side: 'left' | 'right'; drawn?: boolean; animate?: boolean }) {
  const x0 = side === 'left' ? 0 : W - 28;
  const x1 = x0 + 28;
  const a = p(x0, 0, -6);
  const b = p(x1, 0, -6);
  const c = p(x1, 0, 8);
  const d = p(x0, 0, 8);
  const m1 = p(x0 + 1, 0, 0);
  const m2 = p(x1 - 1, 0, 0);
  return (
    <g>
      <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={MASK} stroke="#5aa0e6" strokeWidth={0.6} className={animate ? 'mw-appear-early' : undefined} />
      {drawn && (
        <line x1={m1.x} y1={m1.y} x2={m2.x} y2={m2.y} stroke={MARK} strokeWidth={1.8} strokeLinecap="round" className={animate ? 'mw-draw' : undefined} style={animate ? ({ '--mw-len': Math.hypot(m2.x - m1.x, m2.y - m1.y) } as CSSProperties) : undefined} />
      )}
    </g>
  );
}

/** The glass line itself: the marks joined, along the front edge of the floor. */
export function GlassLine({ lit = false }: { lit?: boolean }) {
  const a = p(0, 0, 0);
  const b = p(W, 0, 0);
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ACCENT} strokeWidth={lit ? 1.6 : 1} strokeDasharray="4 3" opacity={lit ? 1 : 0.6} />;
}

/** A piece of masking tape on the wall at the glass height, with the marker line. */
export function WallMark({ side, y }: { side: 'left' | 'right'; y: number }) {
  const x = side === 'left' ? 0 : W;
  const a = p(x, y - 6, 1);
  const b = p(x, y - 6, 20);
  const c = p(x, y + 6, 20);
  const d = p(x, y + 6, 1);
  const m1 = p(x, y, 2);
  const m2 = p(x, y, 19);
  return (
    <g>
      <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={MASK} stroke="#5aa0e6" strokeWidth={0.6} />
      <line x1={m1.x} y1={m1.y} x2={m2.x} y2={m2.y} stroke={MARK} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

/** The laser on the bathroom floor, in front of the opening, pointing in. */
export function Laser({ z = -40, on = true }: { z?: number; on?: boolean }) {
  const q = p(W / 2, 0, z);
  return (
    <g>
      <rect x={q.x - 8} y={q.y - 20} width={16} height={20} rx={2.5} fill={BG} stroke={INK} strokeWidth={1.3} />
      <circle cx={q.x} cy={q.y - 13} r={3} fill={on ? LASER : 'none'} stroke={INK} strokeWidth={0.9} className={on ? 'mw-glow' : undefined} />
    </g>
  );
}

/**
 * The laser's up-and-down plane: a sheet from the laser through the middle
 * of the opening to the back wall, with the bright line where it meets the
 * floor, the back wall and the ceiling.
 */
export function LaserPlane({ height, ceiling, z = -40, draw = false, dim = false }: { height: number; ceiling: boolean; z?: number; draw?: boolean; dim?: boolean }) {
  const cx = W / 2;
  const H = height;
  const floorA = p(cx, 0, z);
  const floorB = p(cx, 0, D);
  const wallT = p(cx, H, D);
  const ceilF = p(cx, H, 0);
  const len = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y);
  const drawStyle = (a: { x: number; y: number }, b: { x: number; y: number }) => (draw ? ({ '--mw-len': len(a, b) } as CSSProperties) : undefined);
  const cls = draw ? 'mw-draw' : undefined;
  return (
    <g opacity={dim ? 0.4 : 1}>
      <g className={draw ? 'mw-appear' : undefined}>
        <polygon points={`${pt(cx, 0, z)} ${pt(cx, H, z)} ${pt(cx, H, D)} ${pt(cx, 0, D)}`} fill={LASER} opacity={0.08} />
      </g>
      <line x1={floorA.x} y1={floorA.y} x2={floorB.x} y2={floorB.y} stroke={LASER} strokeWidth={1.6} className={cls} style={drawStyle(floorA, floorB)} />
      <line x1={floorB.x} y1={floorB.y} x2={wallT.x} y2={wallT.y} stroke={LASER} strokeWidth={1.6} className={cls} style={drawStyle(floorB, wallT)} />
      {ceiling && <line x1={wallT.x} y1={wallT.y} x2={ceilF.x} y2={ceilF.y} stroke={LASER} strokeWidth={1.6} className={cls} style={drawStyle(wallT, ceilF)} />}
    </g>
  );
}

/** The level line: round the left wall, the back wall and the right wall. */
export function LevelLine({ draw = false, dim = false }: { draw?: boolean; dim?: boolean }) {
  const pts = [p(0, LEVEL, 0), p(0, LEVEL, D), p(W, LEVEL, D), p(W, LEVEL, 0)];
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return (
    <polyline
      points={pts.map((q) => `${q.x},${q.y}`).join(' ')}
      fill="none"
      stroke={LASER}
      strokeWidth={1.6}
      opacity={dim ? 0.4 : 1}
      className={draw ? 'mw-draw' : undefined}
      style={draw ? ({ '--mw-len': len } as CSSProperties) : undefined}
    />
  );
}

/**
 * A tape measure from its body at (x1, y1) to its hook at (x2, y2), in
 * picture coordinates; every tape lies in the glass-line plane, so it runs
 * straight across or straight up the picture. The number appears once the
 * blade is out.
 */
export function TapeMeasure({ x1, y1, x2, y2, value, lit, animate = true, labelSide = 'before' }: { x1: number; y1: number; x2: number; y2: number; value: string; lit?: { x: number; y: number }; animate?: boolean; labelSide?: 'before' | 'after' }) {
  const horizontal = Math.abs(y2 - y1) < 0.5;
  const dir = horizontal ? Math.sign(x2 - x1) : Math.sign(y2 - y1);
  const len = horizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
  const cls = animate ? (horizontal ? 'mw-extend' : 'mw-extend-y') : undefined;
  const origin = { transformOrigin: `${x1}px ${y1}px` } as CSSProperties;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const sideSign = labelSide === 'before' ? -1 : 1;
  return (
    <g>
      <g className={cls} style={origin}>
        {horizontal ? (
          <rect x={Math.min(x1, x2)} y={y1 - 4} width={len} height={8} fill={TAPE} stroke={TAPE_DARK} strokeWidth={0.7} />
        ) : (
          <rect x={x1 - 4} y={Math.min(y1, y2)} width={8} height={len} fill={TAPE} stroke={TAPE_DARK} strokeWidth={0.7} />
        )}
        {Array.from({ length: Math.floor(len / 8) }, (_, i) => {
          const t = (i + 1) * 8;
          const major = i % 5 === 4;
          return horizontal ? (
            <line key={i} x1={x1 + dir * t} y1={y1 - 4} x2={x1 + dir * t} y2={y1 - (major ? 0 : 2)} stroke={TAPE_DARK} strokeWidth={0.6} />
          ) : (
            <line key={i} x1={x1 - 4} y1={y1 + dir * t} x2={x1 - (major ? 0 : 2)} y2={y1 + dir * t} stroke={TAPE_DARK} strokeWidth={0.6} />
          );
        })}
        {horizontal ? <rect x={x2 - (dir > 0 ? 2 : 1)} y={y1 - 6.5} width={3} height={13} fill={INK} /> : <rect x={x1 - 6.5} y={y2 - (dir > 0 ? 2 : 1)} width={13} height={3} fill={INK} />}
      </g>
      {/* The body. */}
      {horizontal ? (
        <rect x={x1 - (dir > 0 ? 17 : 1)} y={y1 - 10} width={18} height={20} rx={3.5} fill={BG} stroke={INK} strokeWidth={1.3} />
      ) : (
        <rect x={x1 - 10} y={y1 - (dir > 0 ? 17 : 1)} width={20} height={18} rx={3.5} fill={BG} stroke={INK} strokeWidth={1.3} />
      )}
      {/* Where the laser lights the blade. */}
      {lit && (
        <g className={animate ? 'mw-appear' : undefined}>
          <circle cx={lit.x} cy={lit.y} r={6} fill={LASER} opacity={0.25} />
          <line x1={lit.x} y1={lit.y - 7} x2={lit.x} y2={lit.y + 7} stroke={LASER} strokeWidth={1.8} />
        </g>
      )}
      <g className={animate ? 'mw-appear' : undefined}>
        {horizontal ? (
          <>
            <rect x={midX - 25} y={midY + sideSign * 24 - 9} width={50} height={18} rx={3} fill={ACCENT} />
            <text x={midX} y={midY + sideSign * 24 + 4} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#fff" fontFamily={FONT}>
              {value}
            </text>
          </>
        ) : (
          <>
            <rect x={midX + sideSign * 34 - 25} y={midY - 9} width={50} height={18} rx={3} fill={ACCENT} />
            <text x={midX + sideSign * 34} y={midY + 4} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#fff" fontFamily={FONT}>
              {value}
            </text>
          </>
        )}
      </g>
    </g>
  );
}

/** A small circled number, as on the drawing. */
export function PointMark({ x, y, n, lit = false }: { x: number; y: number; n: number; lit?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={7.5} fill={lit ? ACCENT : BG} stroke={lit ? ACCENT : INK} strokeWidth={1.1} />
      <text x={x} y={y + 3.3} textAnchor="middle" fontSize={9} fontWeight={700} fill={lit ? '#fff' : INK} fontFamily={FONT}>
        {n}
      </text>
    </g>
  );
}

/** A caption on the picture, in the accent. */
export function Caption({ x, y, children, anchor = 'start' }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={10.5} fontWeight={700} fill={ACCENT} fontFamily={FONT}>
      {children}
    </text>
  );
}
