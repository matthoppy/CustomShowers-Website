/**
 * One of the eight readings to the laser cross: the tape measure extends
 * from the wall, the floor or the ceiling to the laser line, and the number
 * appears. The readings already taken sit on the picture as small circled
 * numbers, so the customer can see where they are in the set.
 */

import { CEIL, CX, FLOOR, Frame, LEVEL, LF, RF, LaserBox, LaserLine, MaskingTape, PointMark, Room, ACCENT } from './Scene';
import { TapeMeasure } from './Scene';

/** Where each reading runs, in picture coordinates. */
export function readingLine(point: number, toCeiling: boolean): { x1: number; y1: number; x2: number; y2: number } {
  const topY = toCeiling ? CEIL + 14 : 52;
  const bottomY = FLOOR - 12;
  switch (point) {
    case 1:
      return { x1: LF, y1: bottomY, x2: CX, y2: bottomY };
    case 2:
      return { x1: LF, y1: topY, x2: CX, y2: topY };
    case 3:
      return { x1: RF, y1: bottomY, x2: CX, y2: bottomY };
    case 4:
      return { x1: RF, y1: topY, x2: CX, y2: topY };
    case 5:
      return { x1: LF + 22, y1: LEVEL, x2: LF + 22, y2: FLOOR };
    case 6:
      return { x1: RF - 22, y1: LEVEL, x2: RF - 22, y2: FLOOR };
    case 7:
      return { x1: LF + 22, y1: LEVEL, x2: LF + 22, y2: CEIL };
    default:
      return { x1: RF - 22, y1: LEVEL, x2: RF - 22, y2: CEIL };
  }
}

/** Where the circled number for a reading sits. */
function markAt(point: number, toCeiling: boolean): { x: number; y: number } {
  const l = readingLine(point, toCeiling);
  if (point <= 4) return { x: (l.x1 + l.x2) / 2, y: l.y1 };
  return { x: l.x1, y: (l.y1 + l.y2) / 2 };
}

const NAMES: Record<number, string> = {
  1: 'left wall to the vertical laser line at the floor',
  2: 'left wall to the vertical laser line at the top',
  3: 'right wall to the vertical laser line at the floor',
  4: 'right wall to the vertical laser line at the top',
  5: 'level laser line down to the floor on the left',
  6: 'level laser line down to the floor on the right',
  7: 'level laser line up to the ceiling on the left',
  8: 'level laser line up to the ceiling on the right',
};

export function CrossReadingVisual({ point, toCeiling, value, done = [] }: { point: number; toCeiling: boolean; value: number | null; done?: number[] }) {
  const line = readingLine(point, toCeiling);
  const vertical = line.x1 === line.x2;
  // A tape is hooked on the wall and read at the laser line, so the body sits
  // at the line and the blade grows back to the wall. The floor and ceiling
  // readings are read at the level line the same way.
  const from = vertical ? { x: line.x1, y: line.y1 } : { x: line.x2, y: line.y2 };
  const to = vertical ? { x: line.x2, y: line.y2 } : { x: line.x1, y: line.y1 };
  return (
    <Frame label={`Measuring from the ${NAMES[point]}`}>
      <Room ceiling={toCeiling} />
      <MaskingTape />
      <LaserLine x1={CX} y1={FLOOR - 24} x2={CX} y2={toCeiling ? CEIL : 8} dim={vertical} />
      <LaserLine x1={LF} y1={LEVEL} x2={RF} y2={LEVEL} dim={!vertical} />
      <LaserBox x={CX} y={FLOOR} />
      {done
        .filter((n) => n !== point)
        .map((n) => {
          const m = markAt(n, toCeiling);
          return <PointMark key={n} x={m.x} y={m.y} n={n} />;
        })}
      <TapeMeasure x1={from.x} y1={from.y} x2={to.x} y2={to.y} value={value === null ? '?' : `${value}mm`} labelOffset={vertical ? (point % 2 === 1 ? 0 : -74) : 0} />
      {/* The circled number for this reading, by the line. */}
      <g className="mw-appear">
        <PointMark x={vertical ? line.x1 + (point % 2 === 1 ? -14 : 14) : (line.x1 + line.x2) / 2} y={vertical ? (line.y1 + line.y2) / 2 + 24 : line.y1 + 16} n={point} lit />
        {!vertical && (
          <text x={(line.x1 + line.x2) / 2 + 14} y={line.y1 + 20} fontSize={10} fontWeight={600} fill={ACCENT} fontFamily="system-ui, sans-serif">
            to the line
          </text>
        )}
      </g>
    </Frame>
  );
}
