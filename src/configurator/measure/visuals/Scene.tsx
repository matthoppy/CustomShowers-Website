/**
 * The pieces the card pictures are built from: a plain room seen from the
 * front, masking tape on the floor, a laser and its lines, and a tape measure
 * that extends to show where a number is taken. One style for every card:
 * a grey room, red laser lines, a yellow tape, blue masking tape, and the
 * brand's accent for the thing being asked for.
 */

import type { ReactNode } from 'react';

export const VB = { w: 320, h: 240 };
/** Left wall face, right wall face, floor, ceiling and the laser cross. */
export const LF = 40;
export const RF = 280;
export const FLOOR = 200;
export const CEIL = 24;
export const CX = 160;
export const LEVEL = 112;

export const WALL = 'hsl(var(--muted-foreground) / 0.16)';
export const WALL_EDGE = 'hsl(var(--muted-foreground) / 0.55)';
export const INK = 'hsl(var(--foreground) / 0.75)';
export const ACCENT = 'hsl(var(--measure-accent))';
export const BG = 'hsl(var(--background))';
export const LASER = '#e11d48';
export const TAPE = '#f5b301';
export const TAPE_DARK = '#8a6400';
export const MASK = '#8ec5ff';

export function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/** The room from the front: two walls, the floor, and the ceiling when it matters. */
export function Room({ ceiling = true }: { ceiling?: boolean }) {
  return (
    <g>
      <rect x={0} y={0} width={LF} height={VB.h} fill={WALL} />
      <rect x={RF} y={0} width={VB.w - RF} height={VB.h} fill={WALL} />
      <rect x={0} y={FLOOR} width={VB.w} height={VB.h - FLOOR} fill={WALL} />
      {ceiling && <rect x={0} y={0} width={VB.w} height={CEIL} fill={WALL} />}
      <line x1={LF} y1={ceiling ? CEIL : 0} x2={LF} y2={FLOOR} stroke={WALL_EDGE} strokeWidth={1.5} />
      <line x1={RF} y1={ceiling ? CEIL : 0} x2={RF} y2={FLOOR} stroke={WALL_EDGE} strokeWidth={1.5} />
      <line x1={LF} y1={FLOOR} x2={RF} y2={FLOOR} stroke={WALL_EDGE} strokeWidth={1.5} />
      {ceiling && <line x1={LF} y1={CEIL} x2={RF} y2={CEIL} stroke={WALL_EDGE} strokeWidth={1.5} />}
    </g>
  );
}

/** Masking tape along the floor between the walls. */
export function MaskingTape({ x1 = LF, x2 = RF }: { x1?: number; x2?: number }) {
  return <rect x={x1} y={FLOOR - 7} width={Math.max(0, x2 - x1)} height={7} fill={MASK} opacity={0.9} />;
}

export function LaserBox({ x = CX, y = FLOOR, on = true }: { x?: number; y?: number; on?: boolean }) {
  return (
    <g>
      <rect x={x - 11} y={y - 24} width={22} height={24} rx={3} fill={BG} stroke={INK} strokeWidth={1.5} />
      <circle cx={x} cy={y - 14} r={4} fill={on ? LASER : 'none'} stroke={INK} strokeWidth={1} className={on ? 'mw-glow' : undefined} />
    </g>
  );
}

/** A laser line, drawn on when `draw` is set. */
export function LaserLine({ x1, y1, x2, y2, draw = false, dim = false }: { x1: number; y1: number; x2: number; y2: number; draw?: boolean; dim?: boolean }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <g opacity={dim ? 0.45 : 1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LASER} strokeWidth={5} opacity={0.18} className={draw ? 'mw-draw' : undefined} style={draw ? ({ '--mw-len': len } as React.CSSProperties) : undefined} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LASER} strokeWidth={1.5} className={draw ? 'mw-draw' : undefined} style={draw ? ({ '--mw-len': len } as React.CSSProperties) : undefined} />
    </g>
  );
}

/**
 * A tape measure extending from a start point to an end point, with the
 * number shown once it is out. Horizontal tapes keep the body at the start;
 * vertical ones hang the body at the start too (the line, for the floor and
 * ceiling readings).
 */
export function TapeMeasure({
  x1,
  y1,
  x2,
  y2,
  value,
  animate = true,
  labelOffset = 0,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: string;
  animate?: boolean;
  labelOffset?: number;
}) {
  const horizontal = y1 === y2;
  const dir = horizontal ? Math.sign(x2 - x1) : Math.sign(y2 - y1);
  const len = horizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
  const cls = animate ? (horizontal ? 'mw-extend' : 'mw-extend-y') : undefined;
  const origin = { transformOrigin: `${x1}px ${y1}px` } as React.CSSProperties;
  const mid = horizontal ? { x: (x1 + x2) / 2, y: y1 } : { x: x1, y: (y1 + y2) / 2 };
  return (
    <g>
      {/* The blade, growing out of the body. */}
      <g className={cls} style={origin}>
        {horizontal ? (
          <rect x={Math.min(x1, x2)} y={y1 - 4} width={len} height={8} fill={TAPE} stroke={TAPE_DARK} strokeWidth={0.8} />
        ) : (
          <rect x={x1 - 4} y={Math.min(y1, y2)} width={8} height={len} fill={TAPE} stroke={TAPE_DARK} strokeWidth={0.8} />
        )}
        {/* Tick marks along the blade. */}
        {Array.from({ length: Math.floor(len / 10) }, (_, i) => {
          const t = (i + 1) * 10;
          return horizontal ? (
            <line key={i} x1={x1 + dir * t} y1={y1 - 4} x2={x1 + dir * t} y2={y1 - (i % 5 === 4 ? 0 : 2)} stroke={TAPE_DARK} strokeWidth={0.6} />
          ) : (
            <line key={i} x1={x1 - 4} y1={y1 + dir * t} x2={x1 - (i % 5 === 4 ? 0 : 2)} y2={y1 + dir * t} stroke={TAPE_DARK} strokeWidth={0.6} />
          );
        })}
        {/* The hook at the far end. */}
        {horizontal ? (
          <rect x={x2 - (dir > 0 ? 2 : 1)} y={y1 - 6} width={3} height={12} fill={INK} />
        ) : (
          <rect x={x1 - 6} y={y2 - (dir > 0 ? 2 : 1)} width={12} height={3} fill={INK} />
        )}
      </g>
      {/* The body, at the start. */}
      <g>
        {horizontal ? (
          <rect x={x1 - (dir > 0 ? 18 : 2)} y={y1 - 11} width={20} height={22} rx={4} fill={BG} stroke={INK} strokeWidth={1.5} />
        ) : (
          <rect x={x1 - 11} y={y1 - (dir > 0 ? 18 : 2)} width={22} height={20} rx={4} fill={BG} stroke={INK} strokeWidth={1.5} />
        )}
      </g>
      {/* The number. */}
      <g className={animate ? 'mw-appear' : undefined}>
        {horizontal ? (
          <>
            <rect x={mid.x - 26} y={mid.y - 24 + labelOffset} width={52} height={18} rx={3} fill={ACCENT} />
            <text x={mid.x} y={mid.y - 11 + labelOffset} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">
              {value}
            </text>
          </>
        ) : (
          <>
            <rect x={mid.x + 10 + labelOffset} y={mid.y - 9} width={52} height={18} rx={3} fill={ACCENT} />
            <text x={mid.x + 36 + labelOffset} y={mid.y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">
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
      <circle cx={x} cy={y} r={8} fill={lit ? ACCENT : BG} stroke={lit ? ACCENT : INK} strokeWidth={1.2} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={lit ? '#fff' : INK} fontFamily="system-ui, sans-serif">
        {n}
      </text>
    </g>
  );
}
