/**
 * The glass height: a piece of tape on the wall with the top of the glass
 * marked on it, and the tape measure hooked on the floor, read up at the mark.
 */

import { Caption, FloorMark, Frame, GlassLine, Room, TapeMeasure, W, WallMark, p } from './Scene';

export function HeightVisual({ height, value }: { height: number; value: number | null }) {
  const inset = 14;
  const body = p(inset, height, 0);
  const hook = p(inset, 0, 0);
  const cap = p(W / 2, height, 0);
  return (
    <Frame label="A marker line on tape stuck to the wall at the height of the glass, and a tape measure hooked on the floor reading up to it">
      <Room height={height} ceiling={false} />
      <FloorMark side="left" />
      <FloorMark side="right" />
      <GlassLine />
      <WallMark side="left" y={height} />
      <WallMark side="right" y={height} />
      <TapeMeasure x1={body.x} y1={body.y} x2={hook.x} y2={hook.y} value={value === null ? '?' : `${value}mm`} labelSide="after" />
      <g className="mw-appear">
        <Caption x={cap.x} y={cap.y - 8} anchor="middle">
          top of the glass
        </Caption>
      </g>
    </Frame>
  );
}
