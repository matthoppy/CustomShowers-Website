/**
 * Seal_Bubble Component
 * Bubble seal mounted on door edge
 * Used for InOut_180 door swing variant
 */

interface Seal_BubbleProps {
  /** X position of seal (on door edge) */
  x: number;
  /** Y position of seal start (top) */
  y: number;
  /** Height of seal */
  height: number;
  /** Offset from door edge (default: 5px outward) */
  offset?: number;
}

/**
 * Seal_Bubble Component
 * Renders a bubble seal on the door edge
 */
export default function Seal_Bubble({
  x,
  y,
  height,
  offset = 5,
}: Seal_BubbleProps) {
  const sealWidth = 6;
  const sealX = x + offset;
  
  return (
    <g className="seal-bubble">
      {/* Seal line */}
      <line
        x1={x + offset}
        y1={y + 50}
        x2={x + offset}
        y2={y + height - 50}
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        className="seal-line"
      />
      
      {/* Seal body - Bubble seal visual representation */}
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
      
      {/* Bubble seal indicators (circular bubbles along the seal) */}
      {Array.from({ length: Math.floor((height - 100) / 80) }).map((_, idx) => {
        const bubbleY = y + 50 + (idx + 1) * 80;
        return (
          <g key={`bubble-${idx}`} className="bubble-indicator">
            <circle
              cx={sealX + sealWidth / 2}
              cy={bubbleY}
              r="4"
              fill="#10b981"
              stroke="#059669"
              strokeWidth="0.5"
            />
            <circle
              cx={sealX + sealWidth / 2}
              cy={bubbleY}
              r="2"
              fill="#34d399"
            />
          </g>
        );
      })}
    </g>
  );
}
