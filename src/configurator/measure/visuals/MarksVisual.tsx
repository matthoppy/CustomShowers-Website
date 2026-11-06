/**
 * Marking the glass line: a short piece of tape on the floor against each
 * wall, and the line drawn across it where the glass will stand.
 */

import { Caption, FloorMark, Frame, GlassLine, Room, W, p } from './Scene';

export function MarksVisual({ height }: { height: number }) {
  const mid = p(W / 2, 0, 0);
  return (
    <Frame label="Two short pieces of masking tape on the floor, one against each wall, each with a marker line where the glass will stand">
      <Room height={height} ceiling={false} />
      <FloorMark side="left" animate />
      <FloorMark side="right" animate />
      <g className="mw-appear">
        <GlassLine lit />
        <Caption x={mid.x} y={mid.y + 22} anchor="middle">
          the glass line
        </Caption>
      </g>
    </Frame>
  );
}
