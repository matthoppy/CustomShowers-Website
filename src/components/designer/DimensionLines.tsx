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
  /** Where to place the label relative to the line */
  labelPosition?: 'above' | 'below' | 'left' | 'right';
  /** Whether this dimension is editable */
  editable?: boolean;
  /** Callback when value changes */
  onChange?: (value: number) => void;
  /** Callback when label is clicked */
  onClick?: () => void;
}

export function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  value,
  offset = 20,
  orientation,
  labelPosition,
  editable = false,
  onChange,
  onClick,
}: DimensionLineProps) {
  // Calculate center point for label
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;

  // Determine actual label position
  const pos = labelPosition || (orientation === 'horizontal' ? 'below' : 'right');

  // Calculate label position based on orientation and specified position
  let labelX = centerX;
  let labelY = centerY;

  if (pos === 'above') labelY = centerY - offset;
  else if (pos === 'below') labelY = centerY + offset;
  else if (pos === 'left') labelX = centerX - offset;
  else if (pos === 'right') labelX = centerX + offset;

  // Extension lines
  const extLength = 10;
  const extX1 = orientation === 'horizontal' ? x1 : x1;
  const extY1 = orientation === 'horizontal' ? y1 : y1;
  const extX2 = orientation === 'horizontal' ? x2 : x2;
  const extY2 = orientation === 'horizontal' ? y2 : y2;

  return (
    <g className="dimension-line group">
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
      <g
        transform={`translate(${labelX}, ${labelY})`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        className="transition-transform duration-200 hover:scale-110"
      >
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
          className="group-hover:stroke-primary group-hover:fill-primary/5"
        />
        {/* Text label - dark blue for contrast */}
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
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
  /** Callback when width label is clicked */
  onWidthClick?: () => void;
  /** Callback when height label is clicked */
  onHeightClick?: () => void;
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
  onWidthClick,
  onHeightClick,
  editable = false,
}: DimensionLinesProps) {
  const offset = 45; // Increased to prevent touching glass

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
        labelPosition="below"
        editable={editable}
        onChange={onWidthChange}
        onClick={onWidthClick}
      />

      {/* Height dimension (vertical) */}
      <DimensionLine
        x1={x + width + offset}
        y1={y}
        x2={x + width + offset}
        y2={y + height}
        value={heightValue}
        orientation="vertical"
        labelPosition="right"
        editable={editable}
        onChange={onHeightChange}
        onClick={onHeightClick}
      />
    </g>
  );
}
// --- New Component for Multi-Segment Measurements ---

export interface Segment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

export function SegmentDimensions({ segments }: { segments: Segment[] }) {
  return (
    <g className="segment-dimensions">
      {segments.map((seg) => {
        // Calculate midpoint
        const midX = (seg.x1 + seg.x2) / 2;
        const midY = (seg.y1 + seg.y2) / 2;

        // Calculate normal vector to segment to push label away slightly
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len < 5) return null; // Skip very small segments

        // Unit normal vector (pointing "outwards" assuming clockwise/standard order)
        // For horizontal segments (y constant), normal is vertical.
        const nx = -dy / len;
        const ny = dx / len;
        const labelOffset = 22; // Increased to prevent touching

        const labelX = midX + nx * labelOffset;
        const labelY = midY + ny * labelOffset;

        const isLetter = seg.label.length === 1;

        return (
          <g
            key={seg.id}
            transform={`translate(${labelX}, ${labelY})`}
            className="transition-opacity duration-200"
          >
            {isLetter ? (
              <>
                <circle
                  cx="0"
                  cy="0"
                  r="8"
                  fill="#1e3a8a"
                  className="shadow-sm"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7"
                  fill="white"
                  fontWeight="800"
                  className="select-none pointer-events-none"
                >
                  {seg.label}
                </text>
              </>
            ) : (
              <>
                <rect
                  x={-18}
                  y={-7}
                  width={36}
                  height={14}
                  fill="white"
                  fillOpacity="0.8"
                  rx="2"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="8"
                  fill="#1e3a8a"
                  fontWeight="600"
                  className="select-none pointer-events-none"
                >
                  {seg.label}
                </text>
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
