/**
 * Seal_H Component
 * H-seal mounted on fixed panel edge
 * Used for In or Out door swing variants
 */

interface Seal_HProps {
  /** X position of seal (on fixed panel edge) */
  x: number;
  /** Y position of seal start (top) */
  y: number;
  /** Height of seal */
  height: number;
  /** Offset from panel edge (default: 5px inward) */
  offset?: number;
}

/**
 * Seal_H Component
 * Renders an H-seal on the fixed panel edge
 */
export default function Seal_H({
  x,
  y,
  height,
  offset = 5,
}: Seal_HProps) {
  const sealWidth = 6;
  const sealX = x - offset - sealWidth;
  
  return (
    <g className="seal-h">
      {/* Seal line */}
      <line
        x1={x - offset}
        y1={y + 50}
        x2={x - offset}
        y2={y + height - 50}
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        className="seal-line"
      />
      
      {/* Seal body - H-seal visual representation */}
      <rect
        x={sealX}
        y={y + 50}
        width={sealWidth}
        height={height - 100}
        fill="rgba(16, 185, 129, 0.2)"
        stroke="#10b981"
        strokeWidth="1"
        className="seal-body"
      />
      
      {/* H-seal cross-section indicator (top) */}
      <g className="seal-cross-section-top">
        <line
          x1={sealX}
          y1={y + 60}
          x2={sealX + sealWidth}
          y2={y + 60}
          stroke="#10b981"
          strokeWidth="1.5"
        />
        <line
          x1={sealX + sealWidth / 2}
          y1={y + 55}
          x2={sealX + sealWidth / 2}
          y2={y + 65}
          stroke="#10b981"
          strokeWidth="1.5"
        />
      </g>
      
      {/* H-seal cross-section indicator (bottom) */}
      <g className="seal-cross-section-bottom">
        <line
          x1={sealX}
          y1={y + height - 60}
          x2={sealX + sealWidth}
          y2={y + height - 60}
          stroke="#10b981"
          strokeWidth="1.5"
        />
        <line
          x1={sealX + sealWidth / 2}
          y1={y + height - 55}
          x2={sealX + sealWidth / 2}
          y2={y + height - 65}
          stroke="#10b981"
          strokeWidth="1.5"
        />
      </g>
    </g>
  );
}
