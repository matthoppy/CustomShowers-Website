/**
 * Masking tape being run across the floor, wall to wall, where the glass
 * will stand. The roll travels from the left wall to the right one and
 * leaves the tape behind it.
 */

import { Frame, LF, RF, FLOOR, Room, INK, MASK, ACCENT } from './Scene';

export function TapeLineVisual() {
  const dx = RF - LF - 16;
  return (
    <Frame label="Masking tape being run across the floor from one wall to the other">
      <Room ceiling={false} />
      {/* The tape, growing from the left wall. */}
      <g className="mw-extend" style={{ transformOrigin: `${LF}px ${FLOOR}px` } as React.CSSProperties}>
        <rect x={LF} y={FLOOR - 7} width={RF - LF} height={7} fill={MASK} />
      </g>
      {/* The roll, travelling along the floor. */}
      <g className="mw-travel" style={{ '--mw-dx': `${dx}px`, transformOrigin: `${LF}px ${FLOOR}px` } as React.CSSProperties}>
        <circle cx={LF + 10} cy={FLOOR - 15} r={13} fill={MASK} stroke={INK} strokeWidth={1.3} />
        <circle cx={LF + 10} cy={FLOOR - 15} r={6} fill="hsl(var(--background))" stroke={INK} strokeWidth={1} />
      </g>
      {/* Where the glass will stand. */}
      <g className="mw-appear">
        <line x1={LF + 6} y1={FLOOR - 7} x2={LF + 6} y2={52} stroke={ACCENT} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <line x1={RF - 6} y1={FLOOR - 7} x2={RF - 6} y2={52} stroke={ACCENT} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <rect x={LF + 6} y={52} width={RF - LF - 12} height={FLOOR - 7 - 52} fill={ACCENT} opacity={0.06} />
        <text x={(LF + RF) / 2} y={FLOOR - 16} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT} fontFamily="system-ui, sans-serif">
          the glass line
        </text>
      </g>
    </Frame>
  );
}
