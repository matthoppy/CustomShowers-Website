/**
 * Dimension Lines Component
 * Renders dimension lines with measurements for shower panels
 */

interface DimensionLineProps {
  /** Start X position */
  x1: number;
  /** Start Y position */
  y1: number;
  /** End X position */
  x2: number;
  /** End Y position */
  y2: number;
  /** Measurement value in mm */
  value: number;
  /** Label position offset */
  offset?: number;
  /** Orientation: 'horizontal' | 'vertical' */
  orientation: 'horizontal' | 'vertical';
  /** Whether this dimension is editable */
  editable?: boolean;
  /** Callback when value changes */
  onChange?: (value: number) => void;
}

export function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  value,
  offset = 20,
  orientation,
  editable = false,
  onChange,
}: DimensionLineProps) {
  // Calculate center point for label
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  
  // Calculate label position based on orientation
  const labelX = orientation === 'horizontal' ? centerX : centerX + offset;
  const labelY = orientation === 'horizontal' ? centerY - offset : centerY;
  
  // Extension lines
  const extLength = 10;
  const extX1 = orientation === 'horizontal' ? x1 : x1;
  const extY1 = orientation === 'horizontal' ? y1 : y1;
  const extX2 = orientation === 'horizontal' ? x2 : x2;
  const extY2 = orientation === 'horizontal' ? y2 : y2;
  
  return (
    <g className="dimension-line">
      {/* Extension lines */}
      <line
        x1={extX1}
        y1={extY1 - (orientation === 'horizontal' ? extLength : 0)}
        x2={extX1}
        y2={extY1 + (orientation === 'horizontal' ? 0 : extLength)}
        stroke="#3b82f6"
        strokeWidth="1"
        strokeDasharray="2,2"
      />
      <line
        x1={extX2}
        y1={extY2 - (orientation === 'horizontal' ? extLength : 0)}
        x2={extX2}
        y2={extY2 + (orientation === 'horizontal' ? 0 : extLength)}
        stroke="#3b82f6"
        strokeWidth="1"
        strokeDasharray="2,2"
      />
      
      {/* Dimension line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#3b82f6"
        strokeWidth="1.5"
      />
      
      {/* Arrowheads */}
      <path
        d={`M ${x1} ${y1} L ${x1 - (orientation === 'horizontal' ? 5 : 0)} ${y1 - (orientation === 'horizontal' ? 0 : 5)} L ${x1 + (orientation === 'horizontal' ? 5 : 0)} ${y1 + (orientation === 'horizontal' ? 0 : 5)} Z`}
        fill="#3b82f6"
      />
      <path
        d={`M ${x2} ${y2} L ${x2 - (orientation === 'horizontal' ? -5 : 0)} ${y2 - (orientation === 'horizontal' ? 0 : -5)} L ${x2 + (orientation === 'horizontal' ? -5 : 0)} ${y2 + (orientation === 'horizontal' ? 0 : -5)} Z`}
        fill="#3b82f6"
      />
      
      {/* Measurement label */}
      <g transform={`translate(${labelX}, ${labelY})`}>
        {/* White background box - explicitly white */}
        <rect
          x={-35}
          y={-10}
          width={70}
          height={20}
          fill="rgb(255, 255, 255)"
          stroke="#3b82f6"
          strokeWidth="1.5"
          rx="3"
        />
        {/* Text label - dark blue for contrast */}
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fontSize="12"
          fill="rgb(30, 64, 175)"
          fontWeight="700"
          className="select-none"
        >
          {value}mm
        </text>
      </g>
    </g>
  );
}

interface DimensionLinesProps {
  /** Panel X position */
  x: number;
  /** Panel Y position */
  y: number;
  /** Panel width */
  width: number;
  /** Panel height */
  height: number;
  /** Width measurement value */
  widthValue: number;
  /** Height measurement value */
  heightValue: number;
  /** Callback when width changes */
  onWidthChange?: (value: number) => void;
  /** Callback when height changes */
  onHeightChange?: (value: number) => void;
  /** Whether dimensions are editable */
  editable?: boolean;
}

export function DimensionLines({
  x,
  y,
  width,
  height,
  widthValue,
  heightValue,
  onWidthChange,
  onHeightChange,
  editable = false,
}: DimensionLinesProps) {
  const offset = 30;
  
  return (
    <g className="dimension-lines">
      {/* Width dimension (horizontal) */}
      <DimensionLine
        x1={x}
        y1={y + height + offset}
        x2={x + width}
        y2={y + height + offset}
        value={widthValue}
        orientation="horizontal"
        editable={editable}
        onChange={onWidthChange}
      />
      
      {/* Height dimension (vertical) */}
      <DimensionLine
        x1={x + width + offset}
        y1={y}
        x2={x + width + offset}
        y2={y + height}
        value={heightValue}
        orientation="vertical"
        editable={editable}
        onChange={onHeightChange}
      />
    </g>
  );
}
