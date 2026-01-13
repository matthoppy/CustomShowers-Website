/**
 * Shower Overlays Component
 * Renders overlay elements like door direction arcs, floor/wall rakes, and notches
 */

interface ShowerOverlaysProps {
  /** Panel X position */
  x: number;
  /** Panel Y position */
  y: number;
  /** Panel width */
  width: number;
  /** Panel height */
  height: number;
  /** Door swing direction */
  doorSwing: 'in' | 'out' | 'in-out';
  /** Floor rake value in mm */
  floorRake?: number;
  /** Floor rake direction */
  floorRakeDirection?: 'none' | 'left' | 'right' | 'front' | 'back';
  /** Left wall rake value in mm */
  leftWallRake?: number;
  /** Left wall rake direction */
  leftWallRakeDirection?: 'none' | 'in' | 'out';
  /** Notches array */
  notches?: Array<{
    panel: 'panel-door' | 'panel-fixed' | 'panel-return';
    corner: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    widthMm: number;
    heightMm: number;
  }>;
  /** Callback when door swing changes */
  onDoorSwingChange?: (swing: 'in' | 'out' | 'in-out') => void;
  /** Callback when notch is clicked */
  onNotchClick?: (notchIndex: number) => void;
  /** Callback when panel area is clicked (for adding notches) */
  onPanelClick?: (x: number, y: number) => void;
  /** Whether interactive */
  interactive?: boolean;
}

export function ShowerOverlays({
  x,
  y,
  width,
  height,
  doorSwing,
  floorRake = 0,
  floorRakeDirection = 'none',
  leftWallRake = 0,
  leftWallRakeDirection = 'none',
  notches = [],
  onDoorSwingChange,
  onNotchClick,
  onPanelClick,
  interactive = false,
}: ShowerOverlaysProps) {
  // Calculate door arc center and radius
  const doorCenterX = x;
  const doorCenterY = y + height / 2;
  const arcRadius = width * 0.4; // 40% of door width

  // Calculate door arc path based on swing direction
  const getDoorArcPath = () => {
    if (doorSwing === 'in-out') {
      // Show both arcs for 180° swing
      const arc1 = `M ${doorCenterX} ${doorCenterY} A ${arcRadius} ${arcRadius} 0 0 1 ${doorCenterX + arcRadius * 0.707} ${doorCenterY - arcRadius * 0.707}`;
      const arc2 = `M ${doorCenterX} ${doorCenterY} A ${arcRadius} ${arcRadius} 0 0 0 ${doorCenterX + arcRadius * 0.707} ${doorCenterY + arcRadius * 0.707}`;
      return [arc1, arc2];
    } else if (doorSwing === 'in') {
      // Arc swings inward (downward)
      return [`M ${doorCenterX} ${doorCenterY} A ${arcRadius} ${arcRadius} 0 0 0 ${doorCenterX + arcRadius * 0.707} ${doorCenterY + arcRadius * 0.707}`];
    } else {
      // Arc swings outward (upward) - default 'out'
      return [`M ${doorCenterX} ${doorCenterY} A ${arcRadius} ${arcRadius} 0 0 1 ${doorCenterX + arcRadius * 0.707} ${doorCenterY - arcRadius * 0.707}`];
    }
  };

  const doorArcs = getDoorArcPath();

  return (
    <g className="shower-overlays">
      <defs>
        <marker
          id="arrow-marker"
          markerWidth="10"
          markerHeight="10"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#444" />
        </marker>
      </defs>

      {/* Door opening direction arcs - clickable */}
      <g>
        {doorArcs.map((arcPath, idx) => (
          <g key={`door-arc-${idx}`}>
            {/* Invisible wider hit area for easier clicking */}
            {interactive && onDoorSwingChange && (
              <path
                d={arcPath}
                stroke="transparent"
                strokeWidth="12"
                fill="none"
                cursor="pointer"
                onClick={() => {
                  // Cycle through: out -> in -> in-out -> out
                  if (doorSwing === 'out') {
                    onDoorSwingChange('in');
                  } else if (doorSwing === 'in') {
                    onDoorSwingChange('in-out');
                  } else {
                    onDoorSwingChange('out');
                  }
                }}
                className="hover:opacity-20"
              />
            )}
            <path
              d={arcPath}
              stroke={interactive ? "#3b82f6" : "#444"}
              strokeWidth="2"
              strokeDasharray="6 4"
              fill="none"
              cursor={interactive ? "pointer" : "default"}
              className={interactive ? "hover:stroke-primary hover:stroke-width-3 transition-all" : ""}
              onClick={interactive && onDoorSwingChange ? () => {
                if (doorSwing === 'out') {
                  onDoorSwingChange('in');
                } else if (doorSwing === 'in') {
                  onDoorSwingChange('in-out');
                } else {
                  onDoorSwingChange('out');
                }
              } : undefined}
            />
          </g>
        ))}
      </g>

      {/* Floor rake overlay */}
      {floorRake > 0 && floorRakeDirection !== 'none' && (
        <g>
          <line
            x1={x}
            y1={y + height + 20}
            x2={x + width}
            y2={y + height + 20}
            stroke="#444"
            strokeWidth="2"
            strokeDasharray="6 4"
            markerEnd="url(#arrow-marker)"
          />
          <text
            x={x + width / 2}
            y={y + height + 50}
            textAnchor="middle"
            fontSize="12"
            fill="#222"
          >
            Floor slope: {floorRake}mm
          </text>
        </g>
      )}

      {/* Left wall rake overlay */}
      {leftWallRake > 0 && leftWallRakeDirection !== 'none' && (
        <g>
          <line
            x1={x - 20}
            y1={y}
            x2={x - 20}
            y2={y + height}
            stroke="#444"
            strokeWidth="2"
            strokeDasharray="6 4"
            markerEnd="url(#arrow-marker)"
          />
          <text
            x={x - 50}
            y={y + height / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#222"
            transform={`rotate(-90 ${x - 50} ${y + height / 2})`}
          >
            Wall out of plumb: {leftWallRake}mm
          </text>
        </g>
      )}

      {/* Panel area - clickable for adding notches */}
      {interactive && onPanelClick && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          stroke="transparent"
          strokeWidth="0"
          cursor="crosshair"
          onClick={(e) => {
            const svg = e.currentTarget.ownerSVGElement;
            if (svg) {
              const pt = svg.createSVGPoint();
              pt.x = e.clientX;
              pt.y = e.clientY;
              const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
              onPanelClick(svgPt.x, svgPt.y);
            }
          }}
          className="hover:fill-blue-50 hover:fill-opacity-30 transition-all"
        />
      )}

      {/* Notch overlays - clickable */}
      {notches.map((notch, idx) => {
        // Calculate notch position based on corner
        let notchX = x;
        let notchY = y + height - notch.heightMm;
        
        if (notch.corner === 'bottom-right' || notch.corner === 'top-right') {
          notchX = x + width - notch.widthMm;
        }
        if (notch.corner === 'top-left' || notch.corner === 'top-right') {
          notchY = y;
        }
        
        return (
          <g key={idx}>
            <rect
              x={notchX}
              y={notchY}
              width={notch.widthMm}
              height={notch.heightMm}
              fill={interactive ? "rgba(59, 130, 246, 0.1)" : "none"}
              stroke={interactive ? "#3b82f6" : "#444"}
              strokeWidth="2"
              strokeDasharray="6 4"
              cursor={interactive ? "pointer" : "default"}
              className={interactive ? "hover:fill-blue-200 hover:stroke-primary transition-all" : ""}
              onClick={interactive && onNotchClick ? () => onNotchClick(idx) : undefined}
            />
            <text
              x={notchX + 3}
              y={notchY - 5}
              fontSize="11"
              fill="#222"
              pointerEvents="none"
            >
              Notch {notch.widthMm}×{notch.heightMm}
            </text>
          </g>
        );
      })}
    </g>
  );
}
