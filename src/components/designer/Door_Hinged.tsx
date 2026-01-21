/**
 * Door_Hinged Component
 * Reusable hinged door component with swing variants
 */

import { useMemo } from 'react';
import Hinge_Shower from './Hinge_Shower';
import Seal_H from './Seal_H';
import Seal_Bubble from './Seal_Bubble';

export type DoorSwingVariant = 'In' | 'Out' | 'InOut_180';

export type HandleType = 'knob' | 'pull';

interface Door_HingedProps {
  /** X position of door (top-left corner) */
  x: number;
  /** Y position of door (top-left corner) */
  y: number;
  /** Door width in pixels */
  width: number;
  /** Door height in pixels */
  height: number;
  /** Swing variant */
  swing: DoorSwingVariant;
  /** Handle type */
  handleType: HandleType;
  /** Hinge X position (on door edge) */
  hingeX: number;
  /** Top hinge Y position */
  topHingeY: number;
  /** Bottom hinge Y position */
  bottomHingeY: number;
}

/**
 * Calculate swing arc paths based on variant
 */
function calculateSwingArcs(
  doorX: number,
  doorY: number,
  doorWidth: number,
  doorHeight: number,
  hingeX: number,
  hingeY: number,
  swing: DoorSwingVariant
): Array<{ path: string }> {
  const radius = doorWidth; // Door width is the radius of the swing
  
  // Door corner points (top-left corner where hinge is)
  const doorTopLeftX = doorX;
  const doorTopLeftY = doorY;
  
  // Calculate angle from hinge to door corner
  const angleToTopLeft = Math.atan2(doorTopLeftY - hingeY, doorTopLeftX - hingeX);
  
  if (swing === 'InOut_180') {
    // Two arcs: IN (90°) and OUT (90°) = 180° total
    const arc1EndAngle = angleToTopLeft - Math.PI / 2; // IN direction
    const arc1EndX = hingeX + radius * Math.cos(arc1EndAngle);
    const arc1EndY = hingeY + radius * Math.sin(arc1EndAngle);
    const arc1Path = `M ${doorTopLeftX} ${doorTopLeftY} A ${radius} ${radius} 0 0 1 ${arc1EndX} ${arc1EndY}`;
    
    const arc2EndAngle = angleToTopLeft + Math.PI / 2; // OUT direction
    const arc2EndX = hingeX + radius * Math.cos(arc2EndAngle);
    const arc2EndY = hingeY + radius * Math.sin(arc2EndAngle);
    const arc2Path = `M ${doorTopLeftX} ${doorTopLeftY} A ${radius} ${radius} 0 0 0 ${arc2EndX} ${arc2EndY}`;
    
    return [
      { path: arc1Path },
      { path: arc2Path }
    ];
  } else {
    // Single arc: 90° swing
    const sweepFlag = swing === 'In' ? 1 : 0;
    const arcEndAngle = swing === 'In'
      ? angleToTopLeft - Math.PI / 2  // Swings inward
      : angleToTopLeft + Math.PI / 2; // Swings outward
    
    const arcEndX = hingeX + radius * Math.cos(arcEndAngle);
    const arcEndY = hingeY + radius * Math.sin(arcEndAngle);
    
    const arcPath = `M ${doorTopLeftX} ${doorTopLeftY} A ${radius} ${radius} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}`;
    
    return [{ path: arcPath }];
  }
}

/**
 * Door_Hinged Component
 * Renders a hinged door with glass, hinges, handle, swing arcs, and seals
 */
export default function Door_Hinged({
  x,
  y,
  width,
  height,
  swing,
  handleType,
  hingeX,
  topHingeY,
  bottomHingeY,
}: Door_HingedProps) {
  // Calculate handle positions
  // Knob center: 950mm from bottom (converted to pixels, assuming 1mm = scale factor)
  // For this component, we'll use relative positioning
  const knobCenterY = y + height - (950 * (height / 2000)); // Assuming 2000mm standard height
  const handleBottomY = y + height - (850 * (height / 2000));
  const handleTopY = handleBottomY - (150 * (height / 2000)); // Standard handle spacing
  
  // Calculate swing arcs (using top hinge as reference)
  const swingArcs = useMemo(() => {
    return calculateSwingArcs(x, y, width, height, hingeX, topHingeY, swing);
  }, [x, y, width, height, hingeX, topHingeY, swing]);
  
  // Determine seal visibility
  const showBubbleSeal = swing === 'InOut_180';
  const showHSeal = swing === 'In' || swing === 'Out';
  
  return (
    <g className="door-hinged">
      {/* Swing arcs - rendered behind door */}
      {swingArcs.map((arc, idx) => (
        <path
          key={`swing-arc-${idx}`}
          d={arc.path}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="8,4"
          opacity="0.6"
          className="swing-arc"
        />
      ))}
      
      {/* Glass rectangle */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(200, 220, 240, 0.4)"
        stroke="#1e40af"
        strokeWidth="4"
        className="door-glass"
      />
      
      {/* Hinges - fixed position, do not move between variants */}
      <g className="hinges">
        {/* Top hinge */}
        <Hinge_Shower
          x={hingeX}
          y={topHingeY}
          orientation="left"
          rotation={0}
          size={12}
        />
        
        {/* Bottom hinge */}
        <Hinge_Shower
          x={hingeX}
          y={bottomHingeY}
          orientation="left"
          rotation={0}
          size={12}
        />
      </g>
      
      {/* Handle group */}
      <g className="handle-group">
        {handleType === 'knob' ? (
          <circle
            cx={x + width - 30}
            cy={knobCenterY}
            r="10"
            fill="#475569"
            stroke="#1e293b"
            strokeWidth="2"
            className="handle-knob"
          />
        ) : (
          <>
            {/* Pull handle */}
            <line
              x1={x + width - 40}
              y1={handleBottomY}
              x2={x + width - 40}
              y2={handleTopY}
              stroke="#475569"
              strokeWidth="4"
              strokeLinecap="round"
              className="handle-pull-bar"
            />
            {/* Handle mounting points */}
            <circle
              cx={x + width - 40}
              cy={handleBottomY}
              r="4"
              fill="#1e293b"
              className="handle-mount-bottom"
            />
            <circle
              cx={x + width - 40}
              cy={handleTopY}
              r="4"
              fill="#1e293b"
              className="handle-mount-top"
            />
          </>
        )}
      </g>
      
      {/* Seals - variant-based visibility (only one visible at a time) */}
      {showHSeal && (
        <Seal_H
          x={x}
          y={y}
          height={height}
          offset={5}
        />
      )}
      
      {showBubbleSeal && (
        <Seal_Bubble
          x={x + width}
          y={y}
          height={height}
          offset={5}
        />
      )}
    </g>
  );
}
