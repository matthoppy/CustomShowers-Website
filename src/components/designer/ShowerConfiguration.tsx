import { useState } from 'react';
import { PanelFixed, PanelShapeProfile, PanelSegment } from './PanelFixed';
import { PanelDoor } from './PanelDoor';
import { Hinge } from './Hinge';
import { Handle } from './Handle';
import { DimensionLines, SegmentDimensions } from './DimensionLines';
// import { Channel } from './Channel'; // Removed as it is not used directly here

export type DoorVariant = 'left' | 'right' | 'double';
export type ConfigurationCategory = 'inline' | 'square' | 'quadrant';
// Adding ShowerTemplateType alias as it seems to be expected by the wrapper
export type ShowerTemplateType = string;


import type { MountingType } from '@/lib/templates';

export interface ShowerPanelDefinition {
  id: string;
  type: 'door' | 'fixed' | 'return';
  width: number;
  height: number;
  x: number;
  y: number;
  orientation?: 'front' | 'left' | 'right';
  topRake?: { drop: number; direction: 'left' | 'right' };
  channels?: ('bottom' | 'left' | 'right' | 'top')[];
  useClampsMode?: boolean;
  hingePositions?: number[];
  clampEdge?: 'left' | 'right' | 'center';
}

interface ShowerConfigurationProps {
  category: ConfigurationCategory;
  baseType: string;
  doorVariant?: DoorVariant;
  mountingType?: MountingType; // Replaces useClampsMode
  mountingSide?: 'left' | 'right'; // New prop for side-specific mounting
  width?: number;
  height?: number;
  realWidthMm?: number; // New: Actual width to display in dimension labels
  realHeightMm?: number; // New: Actual height to display in dimension labels
  onWidthClick?: () => void; // New: Callback when width label is clicked
  onHeightClick?: () => void; // New: Callback when height label is clicked
  floorRake?: { amount: number; direction: 'left' | 'right' };
  wallRake?: { amount: number; direction: 'in' | 'out' };
  notches?: Array<{ corner: string; widthMm: number; heightMm: number }>;
  panels?: ShowerPanelDefinition[]; // New prop for dynamic panels
  shapeProfile?: PanelShapeProfile;
  slopedTop?: { leftMm: number; rightMm: number };
  isFloorToCeiling?: boolean;
  isActive?: boolean;
}

export function ShowerConfiguration({
  category,
  baseType,
  doorVariant = 'right',
  mountingType = 'channel', // Default to channel
  mountingSide = 'left', // Default to left wall
  width = 320,
  height = 400,
  realWidthMm,
  realHeightMm,
  onWidthClick,
  onHeightClick,
  floorRake,
  wallRake,
  notches = [],
  panels = [],
  shapeProfile = 'standard',
  slopedTop,
  isFloorToCeiling = false,
  isActive = false,
}: ShowerConfigurationProps) {
  const [segments, setSegments] = useState<PanelSegment[]>([]);

  // Calculate scaling (Reference: 2000mm height -> 260px height)

  const scale = 0.13;
  const panelHeight = realHeightMm ? Math.max(100, Math.min(300, realHeightMm * scale)) : 260;
  const panelWidth = realWidthMm ? Math.max(50, Math.min(220, realWidthMm * scale)) : 90;

  const startX = (width - panelWidth) / 2;
  const startY = (height - panelHeight) / 2 - 5; // Centered vertically, offset for labels below

  // ... (inside render method or main function)
  if (panels && panels.length > 0) {
    return (
      <g>
        {panels.map((p) => {
          if (p.type === 'fixed') {
            return (
              <PanelFixed
                key={p.id}
                width={p.width}
                height={p.height}
                x={p.x}
                y={p.y}
                orientation={p.orientation}
                channels={p.channels}
                useClampsMode={mountingType === 'clamps'} // Force override or use panel specific? Using override for consistency
                hingePositions={p.hingePositions}
                clampEdge={p.clampEdge}
                topRake={p.topRake}
              />
            );
          } else if (p.type === 'door') {
            // Door logic - similar but simplified for now (no rake on door usually, or same logic)
            return (
              <PanelDoor
                key={p.id}
                width={p.width}
                height={p.height}
                x={p.x}
                y={p.y}
                orientation={p.orientation === 'left' ? 'left' : 'front'} // Map generic orientation
              />
            );
          }
          return null;
        })}
        {/* Render Hinges/Handles separately or include in definition? for now separate or assume standard */}
      </g>
    );
  }

  // Fallback to existing renderContent
  const renderContent = () => {
    // --- INLINE CONFIGURATIONS ---
    if (category === 'inline') {
      switch (baseType) {
        case 'fixed-panel':
          return (
            <PanelFixed
              width={panelWidth}
              height={panelHeight}
              x={startX}
              y={startY}
              channels={mountingType === 'clamps' ? [] : [
                ...(mountingSide === 'left' ? ['left' as const] : ['right' as const]),
                'bottom' as const,
                ...(isFloorToCeiling ? ['top' as const] : [])
              ]}
              useClampsMode={mountingType === 'clamps'}
              hingePositions={[40, panelHeight - 40]} // Standard clamp positions
              clampEdge={mountingSide}
              wallRake={wallRake}
              bottomRake={floorRake}
              slopedTop={slopedTop}
              shapeProfile={shapeProfile}
              isFloorToCeiling={isFloorToCeiling}
              isActive={isActive}
              onSegmentsUpdate={setSegments}
            />
          );

        case 'single':
          // Simple single door
          const hingeX = doorVariant === 'left' ? startX : startX + panelWidth;
          const hingeOrientation = doorVariant === 'left' ? 'left' : 'right'; // Hinges on wall

          return (
            <>
              <PanelDoor
                width={panelWidth}
                height={panelHeight}
                x={startX}
                y={startY}
                orientation={doorVariant === 'left' ? 'left' : 'front'} // Just for visual distinction if needed
              />
              <Hinge x={hingeX} y={startY + 40} orientation={hingeOrientation} type="wall" />
              <Hinge x={hingeX} y={startY + panelHeight - 40} orientation={hingeOrientation} type="wall" />
              <Handle
                x={doorVariant === 'left' ? startX + panelWidth : startX}
                y={startY + panelHeight / 2}
                orientation={doorVariant === 'left' ? 'right' : 'left'}
              />
            </>
          );

        case 'panel-and-door':
          // Fixed Panel + Door
          return (
            <>
              <PanelFixed
                width={panelWidth}
                height={panelHeight}
                x={startX - panelWidth}
                y={startY}
                channels={['bottom', 'left']}
                useClampsMode={mountingType === 'clamps'}
                hingePositions={[40, panelHeight - 40]}
                clampEdge="left"
                wallRake={wallRake}
              />
              <PanelDoor
                width={panelWidth}
                height={panelHeight}
                x={startX}
                y={startY}
              />
              {/* Hinges connect door to fixed panel */}
              <Hinge x={startX} y={startY + 40} orientation="left" type="glass" />
              <Hinge x={startX} y={startY + panelHeight - 40} orientation="left" type="glass" />
              <Handle x={startX + panelWidth} y={startY + panelHeight / 2} orientation="right" />
            </>
          );

        case 'door-and-panel':
          // Door + Fixed Panel
          return (
            <>
              <PanelDoor
                width={panelWidth}
                height={panelHeight}
                x={startX - panelWidth}
                y={startY}
              />
              <PanelFixed
                width={panelWidth}
                height={panelHeight}
                x={startX}
                y={startY}
                channels={['bottom', 'right']}
                useClampsMode={mountingType === 'clamps'}
                hingePositions={[40, panelHeight - 40]}
                clampEdge="right"
                wallRake={wallRake}
              />
              {/* Hinges connect door to fixed panel */}
              <Hinge x={startX} y={startY + 40} orientation="right" type="glass" />
              <Hinge x={startX} y={startY + panelHeight - 40} orientation="right" type="glass" />
              <Handle x={startX - panelWidth} y={startY + panelHeight / 2} orientation="left" />
            </>
          );

        case 'center-door':
          // Fixed + Door + Fixed
          const sidePanelWidth = panelWidth * 0.75;
          return (
            <>
              <PanelFixed
                width={sidePanelWidth}
                height={panelHeight}
                x={startX - sidePanelWidth}
                y={startY}
                channels={['bottom', 'left']}
                useClampsMode={mountingType === 'clamps'}
                hingePositions={[40, panelHeight - 40]}
                clampEdge="left"
                wallRake={wallRake}
              />
              <PanelDoor
                width={panelWidth}
                height={panelHeight}
                x={startX}
                y={startY}
              />
              <PanelFixed
                width={sidePanelWidth}
                height={panelHeight}
                x={startX + panelWidth}
                y={startY}
                channels={['bottom', 'right']}
                useClampsMode={mountingType === 'clamps'}
                hingePositions={[40, panelHeight - 40]}
                clampEdge="right"
                wallRake={wallRake}
              />
              {/* Hinges on left side of door (connecting to left fixed) */}
              <Hinge x={startX} y={startY + 40} orientation="left" type="glass" />
              <Hinge x={startX} y={startY + panelHeight - 40} orientation="left" type="glass" />
              <Handle x={startX + panelWidth} y={startY + panelHeight / 2} orientation="right" />
            </>
          );

        default:
          return <text x="50%" y="50%" textAnchor="middle">Unknown Inline Type</text>;
      }
    }

    // --- SQUARE CONFIGURATIONS ---
    if (category === 'square') {
      const returnPanelWidth = panelWidth * 0.8;

      switch (baseType) {
        case 'l-left':
          // Return Left + Door
          return (
            <>
              {/* Return Panel (Left) */}
              <PanelFixed
                width={returnPanelWidth}
                height={panelHeight}
                x={startX}
                y={startY}
                orientation="left"
                channels={['bottom', 'left']}
                useClampsMode={mountingType === 'clamps'}
                hingePositions={[40, panelHeight - 40]}
                clampEdge="left"
              />
              {/* Door */}
              <PanelDoor
                width={panelWidth}
                height={panelHeight}
                x={startX}
                y={startY}
              />
              {/* Corner Hinges (90 degree) */}
              <Hinge x={startX} y={startY + 40} orientation="left" type="90-degree" />
              <Hinge x={startX} y={startY + panelHeight - 40} orientation="left" type="90-degree" />
              <Handle x={startX + panelWidth} y={startY + panelHeight / 2} orientation="right" />
            </>
          );

        case 'l-right':
          // Door + Return Right
          return (
            <>
              {/* Door */}
              <PanelDoor
                width={panelWidth}
                height={panelHeight}
                x={startX}
                y={startY}
              />
              {/* Return Panel (Right) */}
              <PanelFixed
                width={returnPanelWidth}
                height={panelHeight}
                x={startX + panelWidth}
                y={startY}
                orientation="right"
                channels={['bottom', 'right']}
                useClampsMode={mountingType === 'clamps'}
                hingePositions={[40, panelHeight - 40]}
                clampEdge="right"
              />
              {/* Corner Hinges (90 degree) */}
              <Hinge x={startX + panelWidth} y={startY + 40} orientation="right" type="90-degree" />
              <Hinge x={startX + panelWidth} y={startY + panelHeight - 40} orientation="right" type="90-degree" />
              <Handle x={startX} y={startY + panelHeight / 2} orientation="left" />
            </>
          );

        case 'fixed-door-return-left':
          // Return Left + Fixed + Door
          // Logic: Return Left attaches to... ? Usually Return Left attaches to Fixed Panel
          // Layout: Return(L) -> Fixed -> Door
          return (
            <>
              {/* Return Panel (Left) */}
              <PanelFixed
                width={returnPanelWidth}
                height={panelHeight}
                x={startX - panelWidth}
                y={startY}
                orientation="left"
                channels={['bottom', 'left']}
                useClampsMode={mountingType === 'clamps'}
                hingePositions={[40, panelHeight - 40]}
                clampEdge="left"
              />
              {/* Fixed Panel */}
              <PanelFixed
                width={panelWidth}
                height={panelHeight}
                x={startX - panelWidth}
                y={startY}
                channels={['bottom']} // No side channels where it meets return/door
                useClampsMode={mountingType === 'clamps'}
                hingePositions={[40, panelHeight - 40]}
                clampEdge="center"
              />
              {/* Door */}
              <PanelDoor
                width={panelWidth}
                height={panelHeight}
                x={startX}
                y={startY}
              />
              {/* Corner Clamp/Hinge for Return-Fixed connection? Usually a bracket or silicone */}
              {/* Use 90-degree hinge visual for corner connection */}
              <Hinge x={startX - panelWidth} y={startY + 40} orientation="left" type="return-fixed" />
              <Hinge x={startX - panelWidth} y={startY + panelHeight - 40} orientation="left" type="return-fixed" />

              {/* Glass-Glass Hinges for Fixed-Door */}
              <Hinge x={startX} y={startY + 40} orientation="left" type="glass" />
              <Hinge x={startX} y={startY + panelHeight - 40} orientation="left" type="glass" />

              <Handle x={startX + panelWidth} y={startY + panelHeight / 2} orientation="right" />
            </>
          );

        // Add more square cases as needed based on the list
        // Implementing a generic fallback for other square types to show *something*
        default:
          // Simple placeholder for complex types
          return (
            <>
              <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="10" fill="#888">
                {baseType} (Visual Placeholder)
              </text>
              {/* Just render a box to show bounds */}
              <rect x={startX} y={startY} width={panelWidth} height={panelHeight} fill="none" stroke="#ccc" />
            </>
          );
      }
    }

    // --- QUADRANT CONFIGURATIONS ---
    if (category === 'quadrant') {
      // Placeholder for quadrant logic
      return (
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#888">
          Quadrant: {baseType}
        </text>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[450px]">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full max-w-[450px]"
        style={{ overflow: 'visible' }}
      >
        <g transform="scale(1.1) translate(-15, -35)">
          {renderContent()}

          {/* Extra dimensions for complex profiles */}
          {segments.length > 0 && shapeProfile !== 'standard' && (
            <SegmentDimensions
              segments={segments.filter(seg => {
                // Heuristic: filter out segments that coincide with main boundaries
                const isMainWidth = Math.abs(seg.y1 - seg.y2) < 1 && (seg.y1 < 10 || Math.abs(seg.y1 - panelHeight) < 10);
                const isMainHeight = Math.abs(seg.x1 - seg.x2) < 1 && (seg.x1 < 10 || Math.abs(seg.x1 - panelWidth) < 10);
                return !(isMainWidth || isMainHeight);
              })}
            />
          )}

          {/* Main Dimension Lines */}
          {(realWidthMm || realHeightMm) && (
            <DimensionLines
              x={startX}
              y={startY}
              width={panelWidth}
              height={panelHeight}
              widthValue={realWidthMm || 0}
              heightValue={realHeightMm || 0}
              onWidthClick={onWidthClick}
              onHeightClick={onHeightClick}
              editable={false}
            />
          )}

          {/* Laser Plumb Line Visualization */}
          {wallRake && (
            <g>
              <line
                x1={mountingSide === 'left' ? startX : startX + panelWidth}
                y1={startY - 20}
                x2={mountingSide === 'left' ? startX : startX + panelWidth}
                y2={startY + panelHeight + 20}
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={mountingSide === 'left' ? startX - 5 : startX + panelWidth + 5}
                y={startY - 25}
                textAnchor={mountingSide === 'left' ? 'end' : 'start'}
                fill="#ef4444"
                fontSize="8"
                fontWeight="bold"
                className="uppercase tracking-tighter"
              >
                Laser Plumb
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

