/**
 * Hinge_Shower Component
 * Reusable shower door hinge component
 * Oriented to door edge, rotates with door plane
 */

interface Hinge_ShowerProps {
  /** X position of hinge center */
  x: number;
  /** Y position of hinge center */
  y: number;
  /** Door edge orientation: 'left' | 'right' | 'top' | 'bottom' */
  orientation: 'left' | 'right' | 'top' | 'bottom';
  /** Rotation angle in degrees (for door swing visualization) */
  rotation?: number;
  /** Size of hinge (default: 12px radius) */
  size?: number;
}

/**
 * Hinge_Shower Component
 * Renders a shower door hinge with body, plate, and invisible axis
 */
export default function Hinge_Shower({
  x,
  y,
  orientation = 'left',
  rotation = 0,
  size = 12,
}: Hinge_ShowerProps) {
  // Calculate plate dimensions based on orientation
  const plateWidth = size * 2.5; // Plate extends from hinge
  const plateHeight = size * 1.5;
  
  // Calculate plate position based on orientation
  let plateX = x;
  let plateY = y;
  let plateRotation = 0;
  
  switch (orientation) {
    case 'left':
      // Hinge on left edge, plate extends leftward
      plateX = x - plateWidth / 2;
      plateY = y - plateHeight / 2;
      plateRotation = 0;
      break;
    case 'right':
      // Hinge on right edge, plate extends rightward
      plateX = x - plateWidth / 2;
      plateY = y - plateHeight / 2;
      plateRotation = 180;
      break;
    case 'top':
      // Hinge on top edge, plate extends upward
      plateX = x - plateHeight / 2;
      plateY = y - plateWidth / 2;
      plateRotation = -90;
      break;
    case 'bottom':
      // Hinge on bottom edge, plate extends downward
      plateX = x - plateHeight / 2;
      plateY = y - plateWidth / 2;
      plateRotation = 90;
      break;
  }
  
  return (
    <g className="hinge-shower" transform={`rotate(${rotation} ${x} ${y})`}>
      {/* Invisible axis - the rotation point (for reference, can be styled as needed) */}
      <circle
        cx={x}
        cy={y}
        r={size * 0.3}
        fill="transparent"
        stroke="none"
        className="hinge-axis"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Mounting plate - attaches to fixed panel or wall */}
      <g className="hinge-plate" transform={`translate(${plateX} ${plateY}) rotate(${plateRotation} ${plateWidth / 2} ${plateHeight / 2})`}>
        <rect
          x={0}
          y={0}
          width={plateWidth}
          height={plateHeight}
          fill="#475569"
          stroke="#1e293b"
          strokeWidth="1.5"
          rx="2"
          className="plate-body"
        />
        {/* Plate mounting holes */}
        <circle
          cx={plateWidth * 0.25}
          cy={plateHeight / 2}
          r="1.5"
          fill="#1e293b"
          className="plate-hole"
        />
        <circle
          cx={plateWidth * 0.75}
          cy={plateHeight / 2}
          r="1.5"
          fill="#1e293b"
          className="plate-hole"
        />
      </g>
      
      {/* Hinge body - the rotating part attached to door */}
      <g className="hinge-body">
        {/* Outer ring */}
        <circle
          cx={x}
          cy={y}
          r={size}
          fill="#64748b"
          stroke="#1e293b"
          strokeWidth="2"
          className="hinge-outer"
        />
        
        {/* Inner core */}
        <circle
          cx={x}
          cy={y}
          r={size * 0.5}
          fill="#94a3b8"
          stroke="#475569"
          strokeWidth="1"
          className="hinge-inner"
        />
        
        {/* Center pin/axis indicator */}
        <circle
          cx={x}
          cy={y}
          r={size * 0.2}
          fill="#1e293b"
          className="hinge-pin"
        />
      </g>
    </g>
  );
}
