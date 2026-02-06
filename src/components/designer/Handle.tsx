import { HardwareFinish, getHardwareColors } from './Hinge';

interface HandleProps {
  x?: number;
  y?: number;
  orientation?: 'left' | 'right';
  scale?: number;
  finish?: HardwareFinish;
}

export function Handle({ x = 0, y = 0, orientation = 'left', scale = 1, finish = 'chrome' }: HandleProps) {
  const baseOffsetX = orientation === 'right' ? -12 : 12;
  const offsetX = baseOffsetX * scale;
  const handleWidth = 3 * scale;
  const handleHeight = 40 * scale;
  const colors = getHardwareColors(finish);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Handle bar */}
      <rect
        x={offsetX}
        y="0"
        width={handleWidth}
        height={handleHeight}
        rx={1.5 * scale}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.5"
      />
      {/* Handle highlight */}
      <rect
        x={offsetX + 0.5 * scale}
        y={2 * scale}
        width={1 * scale}
        height={handleHeight - 4 * scale}
        rx={0.5 * scale}
        fill={colors.highlight}
        opacity="0.6"
      />
    </g>
  );
}
