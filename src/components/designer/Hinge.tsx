export type HardwareFinish = 'chrome' | 'matte-black' | 'brushed-brass' | 'satin-brass';

export const getHardwareColors = (finish: HardwareFinish) => {
  switch (finish) {
    case 'matte-black':
      return { fill: '#1A1A1A', stroke: '#000000', highlight: '#333333' };
    case 'brushed-brass':
    case 'satin-brass':
      return { fill: '#C5A059', stroke: '#8B6F39', highlight: '#E5C587' };
    case 'chrome':
    default:
      return { fill: '#A0A0A0', stroke: '#707070', highlight: '#D8D8D8' };
  }
};

interface HingeProps {
  x?: number;
  y?: number;
  orientation?: 'left' | 'right';
  type?: 'wall' | 'glass'; // wall = 1 rectangle, glass = 2 rectangles
  scale?: number;
  junctionGap?: number; // Gap between panels in exploded view
  finish?: HardwareFinish;
}

/**
 * Hinge Component for Exploded View
 * 
 * - Wall-to-glass: 1 rectangle on the door glass only
 * - Glass-to-glass: 2 rectangles, one on each glass panel at the junction
 * 
 * The rectangles are always positioned ON their respective glass panels:
 * - For wall-to-glass: single rectangle inset into the door
 * - For glass-to-glass: left rectangle on left panel, right rectangle on right panel
 *   with a gap between them matching the exploded view gap
 * 
 * All junction angles (90°, 135°, 180°) look the same in exploded view.
 */
export function Hinge({
  x = 0,
  y = 0,
  orientation = 'left',
  type = 'wall',
  scale = 1,
  junctionGap = 60, // Default gap between panels in exploded view
  finish = 'chrome'
}: HingeProps) {
  const squareHeight = 20 * scale;
  const squareWidth = 12 * scale;
  const colors = getHardwareColors(finish);

  if (type === 'wall') {
    // Wall-to-glass: Single rectangle on the door glass
    // Rectangle is inset into the glass from the edge
    const insetX = orientation === 'left' ? x : x - squareWidth;

    return (
      <g transform={`translate(${insetX}, ${y})`}>
        <rect
          x={0}
          y={0}
          width={squareWidth}
          height={squareHeight}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="1"
        />
      </g>
    );
  }

  // Glass-to-glass: Two rectangles, each on its own glass panel
  // The x position is at the junction between panels
  // Left rectangle is inset into the left panel (to the left of junction)
  // Right rectangle is inset into the right panel (to the right of junction + gap)

  // Left panel: rectangle sits on the right edge of the left panel
  const leftRectX = x - squareWidth;

  // Right panel: rectangle sits on the left edge of the right panel
  // (which is across the junction gap)
  const rightRectX = x + junctionGap;

  return (
    <g>
      {/* Rectangle on left glass panel (door side) */}
      <rect
        x={leftRectX}
        y={y}
        width={squareWidth}
        height={squareHeight}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="1"
      />

      {/* Rectangle on right glass panel (fixed panel side) */}
      <rect
        x={rightRectX}
        y={y}
        width={squareWidth}
        height={squareHeight}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="1"
      />
    </g>
  );
}
