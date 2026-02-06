import { HardwareFinish, getHardwareColors } from './Hinge';

interface HandleProps {
  x?: number;
  y?: number;
  orientation?: 'left' | 'right';
  scale?: number;
  finish?: HardwareFinish;
}

/**
 * Handle Component
 * - Positioned 75mm from centre of glass (inward from handle edge)
 * - 200mm long
 * - Scale 0.13 maps mm to px in exploded view
 */
export function Handle({ x = 0, y = 0, orientation = 'left', scale = 1, finish = 'chrome' }: HandleProps) {
  // 75mm offset from glass centre (towards door interior)
  const offsetMm = 75;
  const offsetX = (orientation === 'right' ? -offsetMm : offsetMm) * 0.13 * scale;
  // 200mm long handle
  const handleHeightMm = 200;
  const handleHeight = handleHeightMm * 0.13 * scale;
  const handleWidth = 3 * scale;
  const colors = getHardwareColors(finish);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Handle bar - centred vertically */}
      <rect
        x={offsetX - handleWidth / 2}
        y={-handleHeight / 2}
        width={handleWidth}
        height={handleHeight}
        rx={1.5 * scale}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.5"
      />
      {/* Handle highlight */}
      <rect
        x={offsetX - handleWidth / 2 + 0.5 * scale}
        y={-handleHeight / 2 + 2 * scale}
        width={1 * scale}
        height={handleHeight - 4 * scale}
        rx={0.5 * scale}
        fill={colors.highlight}
        opacity="0.6"
      />
    </g>
  );
}
