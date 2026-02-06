import { Hinge, HardwareFinish } from './Hinge';
import { Handle } from './Handle';

interface PanelDoorProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  orientation?: 'front' | 'left' | 'right';
  top_edge?: { type: 'level' | 'sloped'; direction: 'left' | 'right' | null; drop_mm: number | null };
  notches?: { bottom_left: boolean; bottom_right: boolean; width_mm: number | null; height_mm: number | null };
  door_swing?: 'inward' | 'outward' | 'both' | null;
  hinge_side?: 'left' | 'right';
  handle_side?: 'left' | 'right';
  finish?: HardwareFinish;
}

export function PanelDoor({
  width = 80,
  height = 260,
  x = 0,
  y = 0,
  orientation = 'front',
  top_edge,
  notches,
  door_swing,
  hinge_side = 'left',
  handle_side = 'right',
  finish = 'chrome'
}: PanelDoorProps) {
  const depth = 4;
  const scale = 0.13; // Consistent with other panels

  // Point-based path calculation (similar to PanelFixed)
  const points: { x: number; y: number }[] = [];

  // Determine Top Y coordinates
  let yTL = 0;
  let yTR = 0;
  if (top_edge?.type === 'sloped') {
    if (top_edge.direction === 'left') yTL = (top_edge.drop_mm || 0) * scale;
    else yTR = (top_edge.drop_mm || 0) * scale;
  }

  const notchW = (notches?.width_mm || 50) * scale;
  const notchH = (notches?.height_mm || 50) * scale;

  if (orientation === 'front') {
    if (notches?.bottom_left && notches?.bottom_right) {
      points.push({ x: 0, y: yTL });
      points.push({ x: width, y: yTR });
      points.push({ x: width, y: height - notchH });
      points.push({ x: width - notchW, y: height - notchH });
      points.push({ x: width - notchW, y: height });
      points.push({ x: notchW, y: height });
      points.push({ x: notchW, y: height - notchH });
      points.push({ x: 0, y: height - notchH });
    } else if (notches?.bottom_left) {
      points.push({ x: 0, y: yTL });
      points.push({ x: width, y: yTR });
      points.push({ x: width, y: height });
      points.push({ x: notchW, y: height });
      points.push({ x: notchW, y: height - notchH });
      points.push({ x: 0, y: height - notchH });
    } else if (notches?.bottom_right) {
      points.push({ x: 0, y: yTL });
      points.push({ x: width, y: yTR });
      points.push({ x: width, y: height - notchH });
      points.push({ x: width - notchW, y: height - notchH });
      points.push({ x: width - notchW, y: height });
      points.push({ x: 0, y: height });
    } else {
      points.push({ x: 0, y: yTL });
      points.push({ x: width, y: yTR });
      points.push({ x: width, y: height });
      points.push({ x: 0, y: height });
    }
  }

  const pathD = orientation === 'front' ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')} Z` : '';

  // Door swing indicator removed - no longer needed in exploded/3D views
  const renderSwingIcon = () => null;


  if (orientation === 'front') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <path
          d={pathD}
          fill="#A8C7DC"
          fillOpacity="0.55"
          stroke="#4A7A9E"
          strokeWidth="2"
        />

        {/* Render Hardware */}
        {(() => {
          const hingeOffset = Math.round(height * 0.14);
          return (
            <>
              <Hinge
                x={hinge_side === 'left' ? 0 : width}
                y={hingeOffset - 10}
                orientation={hinge_side}
                scale={1}
                finish={finish}
              />
              <Hinge
                x={hinge_side === 'left' ? 0 : width}
                y={height - hingeOffset - 10}
                orientation={hinge_side}
                scale={1}
                finish={finish}
              />
              <Handle
                x={handle_side === 'left' ? 0 : width}
                y={height / 2}
                orientation={handle_side}
                scale={1}
                finish={finish}
              />
            </>
          );
        })()}

        {renderSwingIcon()}
      </g>
    );
  }

  // Simplified 3D views to match PanelFixed
  const perspectiveOffset = depth * 10;
  const perspectiveHeight = depth * 2;

  if (orientation === 'left') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <path
          d={`M 0 ${yTL} L -${perspectiveOffset} ${yTL - perspectiveHeight} L -${perspectiveOffset} ${height - perspectiveHeight} L 0 ${height} Z`}
          fill="#9CBDD6"
          fillOpacity="0.75"
          stroke="#4A7A9E"
          strokeWidth="2"
        />
        <rect x={-perspectiveOffset} y={yTL - perspectiveHeight} width={perspectiveOffset} height={height} fill="transparent" />
      </g>
    );
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d={`M 0 ${yTL} L ${perspectiveOffset} ${yTR - perspectiveHeight} L ${perspectiveOffset} ${height - perspectiveHeight} L 0 ${height} Z`}
        fill="#8CB3CC"
        fillOpacity="0.8"
        stroke="#4A7A9E"
        strokeWidth="2"
      />
      <rect x={0} y={yTR - perspectiveHeight} width={perspectiveOffset} height={height} fill="transparent" />
    </g>
  );
}
