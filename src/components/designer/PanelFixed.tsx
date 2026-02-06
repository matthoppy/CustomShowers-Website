import { useEffect } from 'react';
import { Clamp } from './Clamp';
import { HardwareFinish, getHardwareColors } from './Hinge';

export type PanelShapeProfile = 'standard' | 'notch-bl' | 'notch-br' | 'double-notch-bl' | 'double-notch-br' | 'notch-bl-br';

export interface PanelSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  label: string;
}

interface PanelFixedProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  orientation?: 'front' | 'left' | 'right';
  channels?: ('bottom' | 'left' | 'right' | 'top')[];
  useClampsMode?: boolean;
  hingePositions?: number[];
  clampEdge?: 'left' | 'right' | 'center';
  topRake?: { drop: number; direction: 'left' | 'right' };
  bottomRake?: { amount: number; direction: 'left' | 'right' };
  wallRake?: { amount: number; direction: 'in' | 'out' };
  top_edge?: { type: 'level' | 'sloped'; direction: 'left' | 'right' | null; drop_mm: number | null };
  slopedTop?: { leftMm: number; rightMm: number };
  notches?: { bottom_left: boolean; bottom_right: boolean; width_mm: number | null; height_mm: number | null };
  shapeProfile?: PanelShapeProfile;
  isActive?: boolean;
  isFloorToCeiling?: boolean;
  onSegmentsUpdate?: (segments: PanelSegment[]) => void;
  finish?: HardwareFinish;
}

export function PanelFixed({
  width = 80,
  height = 260,
  x = 0,
  y = 0,
  orientation = 'front',
  channels = [],
  useClampsMode = false,
  hingePositions = [],
  clampEdge = 'center',
  topRake,
  bottomRake,
  wallRake,
  top_edge,
  slopedTop,
  notches,
  shapeProfile = 'standard',
  isActive = false,
  onSegmentsUpdate,
  finish = 'chrome'
}: PanelFixedProps) {
  const depth = 4;
  const channelThickness = 2;
  const hingeSize = 14;


  // Track points for path and dimensions, with side tags for channels
  const points: { x: number; y: number; side?: string }[] = [];

  if (orientation === 'front') {
    const rakeOffset = wallRake ? (wallRake.amount * 0.13 * (wallRake.direction === 'out' ? -1 : 1)) : 0;

    // Determine Top Y coordinates
    let yTL = 0;
    let yTR = 0;
    if (top_edge?.type === 'sloped') {
      if (top_edge.direction === 'left') yTL = (top_edge.drop_mm || 0) * 0.13;
      else yTR = (top_edge.drop_mm || 0) * 0.13;
    } else if (slopedTop) {
      yTL = slopedTop.leftMm * 0.13;
      yTR = slopedTop.rightMm * 0.13;
    } else if (topRake) {
      if (topRake.direction === 'left') yTL = topRake.drop;
      else yTR = topRake.drop;
    }

    const notchW = (notches?.width_mm || 50) * 0.13; // default 50mm
    const notchH = (notches?.height_mm || 50) * 0.13; // default 50mm

    if (notches?.bottom_left && notches?.bottom_right) {
      points.push({ x: rakeOffset, y: yTL, side: 'top' });
      points.push({ x: width + rakeOffset, y: yTR, side: 'right' });
      points.push({ x: width, y: height - notchH, side: 'bottom' });
      points.push({ x: width - notchW, y: height - notchH, side: 'bottom' });
      points.push({ x: width - notchW, y: height, side: 'bottom' });
      points.push({ x: notchW, y: height, side: 'bottom' });
      points.push({ x: notchW, y: height - notchH, side: 'bottom' });
      points.push({ x: 0, y: height - notchH, side: 'left' });
    } else if (notches?.bottom_left) {
      points.push({ x: rakeOffset, y: yTL, side: 'top' });
      points.push({ x: width + rakeOffset, y: yTR, side: 'right' });
      points.push({ x: width, y: height, side: 'bottom' });
      points.push({ x: notchW, y: height, side: 'bottom' });
      points.push({ x: notchW, y: height - notchH, side: 'bottom' });
      points.push({ x: 0, y: height - notchH, side: 'left' });
    } else if (notches?.bottom_right) {
      points.push({ x: rakeOffset, y: yTL, side: 'top' });
      points.push({ x: width + rakeOffset, y: yTR, side: 'right' });
      points.push({ x: width, y: height - notchH, side: 'bottom' });
      points.push({ x: width - notchW, y: height - notchH, side: 'bottom' });
      points.push({ x: width - notchW, y: height, side: 'bottom' });
      points.push({ x: 0, y: height, side: 'left' });
    } else {
      // Standard rectangle with rakes
      let yBR = height, yBL = height;
      if (bottomRake) {
        if (bottomRake.direction === 'left') yBL -= bottomRake.amount;
        else yBR -= bottomRake.amount;
      }

      // If mounted on right, the rake applies to the right wall
      const isRightWall = clampEdge === 'right';
      const xTL = isRightWall ? 0 : rakeOffset;
      const xTR = isRightWall ? width + rakeOffset : width;
      const xBR = width;
      const xBL = 0;

      points.push({ x: xTL, y: yTL, side: 'top' });
      points.push({ x: xTR, y: yTR, side: 'right' });
      points.push({ x: xBR, y: yBR, side: 'bottom' });
      points.push({ x: xBL, y: yBL, side: 'left' });
    }

    const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;

    const channelSegments = points.map((p1, i) => {
      const p2 = points[(i + 1) % points.length];
      const segmentSide = p1.side;
      const belongsToChannel = channels.includes(segmentSide as any);

      if (!belongsToChannel) return null;
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }).filter(Boolean).join(' ');

    // Notify parent about segments
    useEffect(() => {
      if (onSegmentsUpdate && points.length > 0) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const segments: PanelSegment[] = points.map((p1, i) => {
          const p2 = points[(i + 1) % points.length];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const lengthMm = Math.round(Math.sqrt(dx * dx + dy * dy) / 0.13);
          return {
            id: `seg-${i}`,
            x1: p1.x + x,
            y1: p1.y + y,
            x2: p2.x + x,
            y2: p2.y + y,
            length: lengthMm,
            label: alphabet[i] || `${i}`
          };
        });
        onSegmentsUpdate(segments);
      }
    }, [width, height, x, y, shapeProfile, topRake, bottomRake, slopedTop, onSegmentsUpdate]);


    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Main front face */}
        <path
          d={pathD}
          fill="#A8C7DC"
          fillOpacity="0.55"
          stroke="#4A7A9E"
          strokeWidth="2"
        />

        {/* Channels (Perimeter following) */}
        {(() => {
          const colors = getHardwareColors(finish);
          return channelSegments && (
            <g>
              {/* Outer thicker stroke for the channel body */}
              <path
                d={channelSegments}
                fill="none"
                stroke={colors.fill}
                strokeWidth={channelThickness * 3}
                strokeOpacity="1"
                strokeLinejoin="round"
              />
              {/* Inner detail stroke */}
              <path
                d={channelSegments}
                fill="none"
                stroke={colors.stroke}
                strokeWidth="1"
                strokeOpacity="0.5"
                strokeLinejoin="round"
              />
            </g>
          );
        })()}

        {useClampsMode && hingePositions.map((pos, index) => {
          const clampX = clampEdge === 'left' ? 5 : (clampEdge === 'right' ? width - 5 : width / 2);
          return <Clamp key={index} x={clampX} y={pos + 7} orientation="front" edge={clampEdge} finish={finish} />;
        })}
      </g>
    );
  }

  if (orientation === 'left') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Side face - angled to the LEFT */}
        <path
          d={`M 0 0 L -${depth * 10} -${depth * 2} L -${depth * 10} ${height - depth * 2} L 0 ${height} Z`}
          fill="#A8C7DC"
          fillOpacity="0.75"
          stroke="#4A7A9E"
          strokeWidth="2"
        />

        {/* Clamps for left-angled panel */}
        {useClampsMode && hingePositions.map((pos, index) => {
          const clampX = -depth * 5; // visually center on the angled panel
          const clampY = pos + hingeSize / 2;
          return <Clamp key={index} x={clampX} y={clampY} orientation="left" edge={clampEdge} finish={finish} />;
        })}
      </g>
    );
  }

  // orientation === 'right'
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Side face - angled back at 90 degrees */}
      <path
        d={`M 0 0 L ${depth * 10} -${depth * 2} L ${depth * 10} ${height - depth * 2} L 0 ${height} Z`}
        fill="#9CBDD6"
        fillOpacity="0.8"
        stroke="#4A7A9E"
        strokeWidth="2"
      />

      {/* Clamps for right-angled panel */}
      {useClampsMode && hingePositions.map((pos, index) => {
        const clampX = depth * 5; // visually center
        const clampY = pos + hingeSize / 2;
        return <Clamp key={index} x={clampX} y={clampY} orientation="right" edge={clampEdge} finish={finish} />;
      })}
    </g>
  );
}
