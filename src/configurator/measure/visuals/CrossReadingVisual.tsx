/**
 * One of the eight readings to the laser cross, in the alcove. The tape is
 * hooked on the wall, the floor or the ceiling at the glass line and read
 * where the laser lights its blade; the number appears once it is out.
 * Readings already taken sit on the picture as small circled numbers.
 */

import { FloorMark, Frame, GlassLine, LEVEL, Laser, LaserPlane, LevelLine, PointMark, Room, TapeMeasure, W, WallMark, p } from './Scene';

interface Geometry {
  body: { x: number; y: number };
  hook: { x: number; y: number };
  lit: { x: number; y: number };
  mark: { x: number; y: number };
  labelSide: 'before' | 'after';
}

/** Where each reading's tape runs, in picture coordinates, all on the glass line. */
export function readingGeometry(point: number, height: number, toCeiling: boolean): Geometry {
  const cx = W / 2;
  const top = toCeiling ? height - 5 : height;
  const bottom = 5;
  const inset = 14;
  switch (point) {
    case 1:
      return { body: p(cx, bottom, 0), hook: p(0, bottom, 0), lit: p(cx, bottom, 0), mark: p(cx / 2, bottom, 0), labelSide: 'before' };
    case 2:
      return { body: p(cx, top, 0), hook: p(0, top, 0), lit: p(cx, top, 0), mark: p(cx / 2, top, 0), labelSide: 'after' };
    case 3:
      return { body: p(cx, bottom, 0), hook: p(W, bottom, 0), lit: p(cx, bottom, 0), mark: p(cx * 1.5, bottom, 0), labelSide: 'before' };
    case 4:
      return { body: p(cx, top, 0), hook: p(W, top, 0), lit: p(cx, top, 0), mark: p(cx * 1.5, top, 0), labelSide: 'after' };
    case 5:
      return { body: p(inset, LEVEL, 0), hook: p(inset, 0, 0), lit: p(inset, LEVEL, 0), mark: p(inset, LEVEL / 2, 0), labelSide: 'after' };
    case 6:
      return { body: p(W - inset, LEVEL, 0), hook: p(W - inset, 0, 0), lit: p(W - inset, LEVEL, 0), mark: p(W - inset, LEVEL / 2, 0), labelSide: 'before' };
    case 7:
      return { body: p(inset, LEVEL, 0), hook: p(inset, height, 0), lit: p(inset, LEVEL, 0), mark: p(inset, (LEVEL + height) / 2, 0), labelSide: 'after' };
    default:
      return { body: p(W - inset, LEVEL, 0), hook: p(W - inset, height, 0), lit: p(W - inset, LEVEL, 0), mark: p(W - inset, (LEVEL + height) / 2, 0), labelSide: 'before' };
  }
}

const NAMES: Record<number, string> = {
  1: 'the left wall to the laser, along the floor',
  2: 'the left wall to the laser, at the top',
  3: 'the right wall to the laser, along the floor',
  4: 'the right wall to the laser, at the top',
  5: 'the floor up to the level line, on the left',
  6: 'the floor up to the level line, on the right',
  7: 'the level line up to the ceiling, on the left',
  8: 'the level line up to the ceiling, on the right',
};

export function CrossReadingVisual({ point, height, toCeiling, value, done = [] }: { point: number; height: number; toCeiling: boolean; value: number | null; done?: number[] }) {
  const g = readingGeometry(point, height, toCeiling);
  const vertical = point >= 5;
  const atTop = point === 2 || point === 4;
  return (
    <Frame label={`Measuring from ${NAMES[point]}`}>
      <Room height={height} ceiling={toCeiling} />
      <FloorMark side="left" />
      <FloorMark side="right" />
      {!toCeiling && atTop && <WallMark side={point === 2 ? 'left' : 'right'} y={height} />}
      <GlassLine />
      <LevelLine dim={!vertical} />
      <LaserPlane height={height} ceiling={toCeiling} dim={vertical} />
      <Laser />
      {done
        .filter((n) => n !== point)
        .map((n) => {
          const m = readingGeometry(n, height, toCeiling).mark;
          return <PointMark key={n} x={m.x} y={m.y} n={n} />;
        })}
      <TapeMeasure x1={g.body.x} y1={g.body.y} x2={g.hook.x} y2={g.hook.y} value={value === null ? '?' : `${value}mm`} lit={g.lit} labelSide={g.labelSide} />
      <g className="mw-appear">
        <PointMark x={g.mark.x + (vertical ? (point % 2 === 1 ? -16 : 16) : 0)} y={g.mark.y + (vertical ? 0 : atTop ? -16 : 16)} n={point} lit />
      </g>
    </Frame>
  );
}
