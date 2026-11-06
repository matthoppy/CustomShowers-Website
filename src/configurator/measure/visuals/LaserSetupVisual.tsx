/**
 * The laser standing on the tape in the middle of the opening, its two
 * lines coming on: one straight up, one dead level across the walls.
 */

import { CEIL, CX, FLOOR, Frame, LEVEL, LF, RF, LaserBox, LaserLine, MaskingTape, Room, INK } from './Scene';

export function LaserSetupVisual({ toCeiling }: { toCeiling: boolean }) {
  return (
    <Frame label="A laser on the masking tape in the middle of the opening, with a vertical and a level line switched on">
      <Room ceiling={toCeiling} />
      <MaskingTape />
      <LaserLine x1={CX} y1={FLOOR - 24} x2={CX} y2={toCeiling ? CEIL : 8} draw />
      <LaserLine x1={CX} y1={LEVEL} x2={LF} y2={LEVEL} draw />
      <LaserLine x1={CX} y1={LEVEL} x2={RF} y2={LEVEL} draw />
      <LaserBox x={CX} y={FLOOR} />
      <g className="mw-appear">
        <text x={CX + 6} y={toCeiling ? CEIL + 16 : 20} fontSize={10.5} fontWeight={700} fill={INK} fontFamily="system-ui, sans-serif">
          up-and-down line
        </text>
        <text x={RF - 4} y={LEVEL - 6} textAnchor="end" fontSize={10.5} fontWeight={700} fill={INK} fontFamily="system-ui, sans-serif">
          level line
        </text>
      </g>
    </Frame>
  );
}
