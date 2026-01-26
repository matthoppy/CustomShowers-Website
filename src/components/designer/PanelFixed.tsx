import { useEffect } from 'react';
import { Clamp } from './Clamp';

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
  slopedTop?: { leftMm: number; rightMm: number };
  shapeProfile?: PanelShapeProfile;
  isActive?: boolean;
  isFloorToCeiling?: boolean;
  onSegmentsUpdate?: (segments: PanelSegment[]) => void;
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
  slopedTop,
  shapeProfile = 'standard',
  isActive = false,
  onSegmentsUpdate,
}: PanelFixedProps) {
  const depth = 4;
  const channelThickness = 2;
  const hingeSize = 14;


  // Track points for path and dimensions, with side tags for channels
  const points: { x: number; y: number; side?: string }[] = [];

  if (orientation === 'front') {
    const notchSize = 25; // Visual notch size

    // Determine Top Y coordinates
    let yTL = 0;
    let yTR = 0;
    if (slopedTop) {
      yTL = slopedTop.leftMm * 0.13;
      yTR = slopedTop.rightMm * 0.13;
    } else if (topRake) {
      if (topRake.direction === 'left') yTL = topRake.drop;
      else yTR = topRake.drop;
    }

    if (shapeProfile === 'notch-bl') {
      points.push({ x: 0, y: yTL, side: 'left' });
      points.push({ x: width, y: yTR, side: 'top' });
      points.push({ x: width, y: height, side: 'right' });
      points.push({ x: notchSize, y: height, side: 'bottom' });
      points.push({ x: notchSize, y: height - notchSize, side: 'bottom' });
      points.push({ x: 0, y: height - notchSize, side: 'left' });
    } else if (shapeProfile === 'notch-br') {
      points.push({ x: 0, y: yTL, side: 'left' });
      points.push({ x: width, y: yTR, side: 'top' });
      points.push({ x: width, y: height - notchSize, side: 'right' });
      points.push({ x: width - notchSize, y: height - notchSize, side: 'bottom' });
      points.push({ x: width - notchSize, y: height, side: 'bottom' });
      points.push({ x: 0, y: height, side: 'left' });
    } else if (shapeProfile === 'double-notch-bl') {
      points.push({ x: 0, y: yTL, side: 'left' });
      points.push({ x: width, y: yTR, side: 'top' });
      points.push({ x: width, y: height, side: 'right' });
      points.push({ x: notchSize * 2, y: height, side: 'bottom' });
      points.push({ x: notchSize * 2, y: height - notchSize, side: 'bottom' });
      points.push({ x: notchSize, y: height - notchSize, side: 'bottom' });
      points.push({ x: notchSize, y: height - notchSize * 2, side: 'left' });
      points.push({ x: 0, y: height - notchSize * 2, side: 'left' });
    } else if (shapeProfile === 'double-notch-br') {
      points.push({ x: 0, y: yTL, side: 'left' });
      points.push({ x: width, y: yTR, side: 'top' });
      points.push({ x: width, y: height - notchSize * 2, side: 'right' });
      points.push({ x: width - notchSize, y: height - notchSize * 2, side: 'bottom' });
      points.push({ x: width - notchSize, y: height - notchSize, side: 'bottom' });
      points.push({ x: width - notchSize * 2, y: height - notchSize, side: 'bottom' });
      points.push({ x: width - notchSize * 2, y: height, side: 'bottom' });
      points.push({ x: 0, y: height, side: 'left' });
    } else if (shapeProfile === 'notch-bl-br') {
      points.push({ x: 0, y: yTL, side: 'left' });
      points.push({ x: width, y: yTR, side: 'top' });
      points.push({ x: width, y: height - notchSize, side: 'right' });
      points.push({ x: width - notchSize, y: height - notchSize, side: 'bottom' });
      points.push({ x: width - notchSize, y: height, side: 'bottom' });
      points.push({ x: notchSize, y: height, side: 'bottom' });
      points.push({ x: notchSize, y: height - notchSize, side: 'bottom' });
      points.push({ x: 0, y: height - notchSize, side: 'left' });
    } else {
      // Standard rectangle with rakes
      let yBR = height, yBL = height;
      if (bottomRake) {
        if (bottomRake.direction === 'left') yBL -= bottomRake.amount;
        else yBR -= bottomRake.amount;
      }
      points.push({ x: 0, y: yTL, side: 'left' });
      points.push({ x: width, y: yTR, side: 'top' });
      points.push({ x: width, y: yBR, side: 'right' });
      points.push({ x: 0, y: yBL, side: 'bottom' });
    }

    const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;

    const channelSegments = points.map((p1, i) => {
      const p2 = points[(i + 1) % points.length];
      // A segment belongs to a side if its STARTING point is tagged with that side.
      // If isFloorToCeiling is true, and the segment is 'top', it should have a channel.
      const segmentSide = p1.side;
      const belongsToChannel = channels.includes(segmentSide as any);

      if (!belongsToChannel) return null;
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }).filter(Boolean).join(' ');

    // Notify parent about segments to enable multi-segment measurements
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
          fill="#B8D4E8"
          fillOpacity="0.4"
          stroke="#6B9DC4"
          strokeWidth="1.5"
        />

        {/* Channels (Perimeter following) */}
        {channelSegments && (
          <path
            d={channelSegments}
            fill="none"
            stroke="#A0A0A0"
            strokeWidth={channelThickness * 2}
            strokeOpacity="0.6"
            strokeLinejoin="round"
          />
        )}

        {useClampsMode && hingePositions.map((pos, index) => {
          const clampX = clampEdge === 'left' ? 5 : (clampEdge === 'right' ? width - 5 : width / 2);
          return <Clamp key={index} x={clampX} y={pos + 7} orientation="front" edge={clampEdge} />;
        })}
      </g>
    );
  }

  if (orientation === 'left') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Side face - angled to the LEFT */}
        <path
          d={`M 0 0 L ${-depth * 20} -${depth * 10} L ${-depth * 20} ${height - depth * 10} L 0 ${height} Z`}
          fill="#A8C7DC"
          fillOpacity="0.45"
          stroke="#6B9DC4"
          strokeWidth="1.5"
        />

        {/* Bottom channel on angled panel */}
        {channels.includes('bottom') && (
          <path
            d={`M 0 ${height} L ${-depth * 20} ${height - depth * 10} L ${-depth * 20} ${height - depth * 10 - channelThickness} L 0 ${height - channelThickness} Z`}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="0.5"
          />
        )}

        {/* Left side channel (vertical edge at back wall) on angled panel */}
        {channels.includes('left') && (
          <path
            d={`M ${-depth * 20} -${depth * 10} L ${-depth * 20 + channelThickness} -${depth * 10} L ${-depth * 20 + channelThickness} ${channels.includes('bottom') ? height - depth * 10 - channelThickness : height - depth * 10} L ${-depth * 20} ${channels.includes('bottom') ? height - depth * 10 - channelThickness : height - depth * 10} Z`}
            fill="#A0A0A0"
            stroke="#707070"
            strokeWidth="0.5"
          />
        )}

        {/* Clamps for left-angled panel */}
        {useClampsMode && hingePositions.map((pos, index) => {
          const clampSize = 10;
          let clampX = clampSize / 2; // at the front edge of glass
          if (clampEdge === 'left') clampX = -depth * 20 + clampSize / 2; // at the back wall edge of glass

          // Center clamps with hinges: hinges start at pos and center at pos + hingeSize/2
          const clampY = pos + hingeSize / 2;

          return <Clamp key={index} x={clampX} y={clampY} orientation="left" edge={clampEdge} />;
        })}
      </g>
    );
  }

  // orientation === 'right'
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Side face - angled back at 90 degrees */}
      <path
        d={`M 0 0 L ${depth * 20} -${depth * 10} L ${depth * 20} ${height - depth * 10} L 0 ${height} Z`}
        fill="#9CBDD6"
        fillOpacity="0.5"
        stroke="#6B9DC4"
        strokeWidth="1.5"
      />

      {/* Bottom channel on side face */}
      {channels.includes('bottom') && (
        <path
          d={`M 0 ${height} L ${depth * 20} ${height - depth * 10} L ${depth * 20} ${height - depth * 10 - channelThickness} L 0 ${height - channelThickness} Z`}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="0.5"
        />
      )}

      {/* Right side channel (vertical edge at back wall) on angled panel */}
      {channels.includes('right') && (
        <path
          d={`M ${depth * 20} -${depth * 10} L ${depth * 20 - channelThickness} -${depth * 10} L ${depth * 20 - channelThickness} ${channels.includes('bottom') ? height - depth * 10 - channelThickness : height - depth * 10} L ${depth * 20} ${channels.includes('bottom') ? height - depth * 10 - channelThickness : height - depth * 10} Z`}
          fill="#A0A0A0"
          stroke="#707070"
          strokeWidth="0.5"
        />
      )}

      {/* Clamps for right-angled panel */}
      {useClampsMode && hingePositions.map((pos, index) => {
        const clampSize = 10;
        let clampX = clampSize / 2; // at the front edge of glass
        if (clampEdge === 'right') clampX = depth * 20 + clampSize / 2; // at the back wall edge of glass

        // Center clamps with hinges: hinges start at pos and center at pos + hingeSize/2
        const clampY = pos + hingeSize / 2;

        return <Clamp key={index} x={clampX} y={clampY} orientation="right" edge={clampEdge} />;
      })}
    </g>
  );
}
