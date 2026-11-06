/**
 * Floor to the top of the glass, up the wall beside the opening.
 */

import { FLOOR, Frame, LF, RF, MaskingTape, Room, TapeMeasure, ACCENT } from './Scene';

export function HeightVisual({ value }: { value: number | null }) {
  const top = 36;
  return (
    <Frame label="Measuring from the floor up to where the top of the glass will be">
      <Room ceiling={false} />
      <MaskingTape />
      <rect x={LF + 6} y={top} width={RF - LF - 12} height={FLOOR - 7 - top} fill={ACCENT} opacity={0.06} />
      <line x1={LF + 6} y1={top} x2={RF - 6} y2={top} stroke={ACCENT} strokeWidth={1.2} strokeDasharray="4 3" />
      <TapeMeasure x1={LF + 24} y1={FLOOR} x2={LF + 24} y2={top} value={value === null ? '?' : `${value}mm`} />
      <text x={RF - 10} y={top - 8} textAnchor="end" fontSize={10.5} fontWeight={700} fill={ACCENT} fontFamily="system-ui, sans-serif">
        top of the glass
      </text>
    </Frame>
  );
}
