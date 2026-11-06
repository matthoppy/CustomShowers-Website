/**
 * The laser on the bathroom floor in front of the opening, pointing in, its
 * two lines coming on: the up-and-down plane through the middle of the marks,
 * and the level line round the walls.
 */

import { Caption, FloorMark, Frame, GlassLine, LEVEL, Laser, LaserPlane, LevelLine, Room, W, p } from './Scene';

export function LaserSetupVisual({ height, toCeiling }: { height: number; toCeiling: boolean }) {
  const levelAt = p(W, LEVEL, 0);
  const planeAt = p(W / 2, height, 0);
  return (
    <Frame label="A laser standing on the floor in front of the shower, pointing in, with an up-and-down line through the middle of the opening and a level line round the walls">
      <Room height={height} ceiling={toCeiling} />
      <FloorMark side="left" />
      <FloorMark side="right" />
      <GlassLine />
      <LevelLine draw />
      <LaserPlane height={height} ceiling={toCeiling} draw />
      <Laser />
      <g className="mw-appear">
        <Caption x={planeAt.x + 8} y={planeAt.y - 10}>
          up-and-down line
        </Caption>
        <Caption x={levelAt.x + 6} y={levelAt.y + 4}>
          level line
        </Caption>
      </g>
    </Frame>
  );
}
