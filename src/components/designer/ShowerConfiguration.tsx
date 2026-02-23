import React, { useState } from 'react';
import type { JunctionModel, PanelModel } from '@/types/square';
import { PanelFixed } from './PanelFixed';
import { PanelDoor } from './PanelDoor';
import { Hinge, HardwareFinish } from './Hinge';
import { Handle } from './Handle';
import { Clamp } from './Clamp';
import { Label } from '../ui/label';

export type DoorVariant = 'left' | 'right' | 'double';
export type ConfigurationCategory = 'inline' | 'square' | 'quadrant' | 'fixed-panel';

export type ShowerTemplateType =
  | 'single-door'
  | 'double-door'
  | 'left-panel'
  | 'right-panel'
  | 'three-panel'
  | 'corner-left'
  | 'corner-right'
  | '90-return'
  | '90-return-left'
  | '90-return-right'
  | 'angled-ceiling';

export type ShowerPanelDefinition = {
  id: string;
  type: 'fixed' | 'door';
  x: number;
  y: number;
  width: number;
  height: number;
  orientation?: 'front' | 'left' | 'right';
  top_edge?: { type: 'level' | 'sloped'; direction: 'left' | 'right' | null; drop_mm: number | null };
  notches?: { bottom_left: boolean; bottom_right: boolean; width_mm: number | null; height_mm: number | null };
  door_swing?: 'inward' | 'outward' | 'both' | null;
};

type ShowerConfigurationProps = {
  category?: ConfigurationCategory;
  baseType?: string;
  type?: ShowerTemplateType;
  width?: number;
  height?: number;
  realWidthMm?: number;
  realHeightMm?: number;
  panels?: PanelModel[] | ShowerPanelDefinition[];
  junctions?: JunctionModel[];
  viewMode?: '2d' | '3d' | 'exploded';
  doorVariant?: DoorVariant;
  mountingType?: 'channel' | 'clamps';
  mountingSide?: 'left' | 'right';
  hardwareFinish?: HardwareFinish;
  activePanelId?: string | null;
  activeJunctionId?: string | null;
  hideDimensions?: boolean;
  scaleOverride?: number;
  isActive?: boolean;
  onPanelClick?: (panelId: string) => void;
  onJunctionSelect?: (junctionId: string) => void;
  onAddPanel?: (index: number) => void;
  onUpdateJunctionAngle?: (junctionId: string, angle: number) => void;
};

const lineSegmentsIntersect = (
  p1: { x: number; z: number },
  p2: { x: number; z: number },
  p3: { x: number; z: number },
  p4: { x: number; z: number }
): boolean => {
  const det = (p2.x - p1.x) * (p4.z - p3.z) - (p4.x - p3.x) * (p2.z - p1.z);
  if (Math.abs(det) < 0.001) return false;
  const t = ((p3.x - p1.x) * (p4.z - p3.z) - (p4.x - p3.x) * (p3.z - p1.z)) / det;
  const u = ((p3.x - p1.x) * (p2.z - p1.z) - (p2.x - p1.x) * (p3.z - p1.z)) / det;
  return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
};

export function ShowerConfiguration({
  category = 'square',
  width = 600,
  height = 500,
  realWidthMm = 900,
  realHeightMm = 2000,
  panels = [],
  junctions = [],
  viewMode = '3d',
  activePanelId,
  activeJunctionId,
  hideDimensions = false,
  scaleOverride = 1,
  isActive = false,
  mountingType = 'channel',
  hardwareFinish = 'chrome',
  onPanelClick,
  onJunctionSelect,
  onAddPanel,
  onUpdateJunctionAngle,
}: ShowerConfigurationProps) {
  const [openJunctionPopoverId, setOpenJunctionPopoverId] = useState<string | null>(null);

  const normalizedPanels: PanelModel[] = Array.isArray(panels) && panels.length > 0 && 'panel_id' in (panels[0] as any)
    ? (panels as PanelModel[])
    : (panels as any[]).map((p, idx) => ({
      panel_id: p.id || `P${idx + 1}`,
      panel_type: p.type === 'door' ? 'door_hinged' : 'fixed',
      width_mm: p.width || 300,
      height_mm: p.height || 2000,
      position_index: idx,
      plane: p.orientation === 'left' ? 'return_left' : p.orientation === 'right' ? 'return_right' : 'front',
      hinge_side: p.door_properties?.hinge_side || 'left',
      handle_side: p.door_properties?.hinge_side === 'left' ? 'right' : 'left',
      wall_fix: { left: false, right: false },
      mounting_style: 'channel',
      notches: p.notches || { bottom_left: false, bottom_right: false, width_mm: null, height_mm: null },
      top_edge: p.top_edge || { type: 'level', direction: null, drop_mm: null },
      ...p
    }));

  const sortedPanels = [...normalizedPanels].sort((a, b) => a.position_index - b.position_index);

  // Layout constants
  const separationGap = 80; // Distance between panels in exploded view
  const panelHeightScale = 0.13;
  const frontWidth = 100; // Visual panel width base
  const panelHeight = realHeightMm * panelHeightScale;
  const startY = (height - panelHeight) / 2;

  if (viewMode === '3d') {
    const doorIndex = sortedPanels.findIndex(p => p.panel_type === 'door_hinged');
    let doorRotation = 0;
    if (doorIndex >= 0) {
      for (let i = 0; i < doorIndex; i++) {
        const j = junctions?.find(jun =>
          (jun.a_panel_id === sortedPanels[i].panel_id && jun.b_panel_id === sortedPanels[i + 1].panel_id) ||
          (jun.b_panel_id === sortedPanels[i].panel_id && jun.a_panel_id === sortedPanels[i + 1].panel_id)
        );
        if (j) doorRotation += (180 - (j.angle_deg || 180));
      }
    }
    const globalRotation = -doorRotation;

    // Calculate total layout width for proper scaling
    const totalWidthMm = sortedPanels.reduce((sum, p) => sum + (p.width_mm || 700), 0);
    const maxHeightMm = Math.max(...sortedPanels.map(p => p.height_mm || realHeightMm));

    // Scale factor to fit layout in view (use the smaller of width/height constraints)
    const widthScale = (width * 0.6) / (totalWidthMm * 0.15);
    const heightScale = (height * 0.7) / (maxHeightMm * 0.13);
    const autoScale = Math.min(widthScale, heightScale, 1.5);
    const finalScale = scaleOverride !== 1 ? scaleOverride : autoScale;

    let cursor3D = { x: 0, z: 0 };
    const panel3DData = sortedPanels.map((panel, index) => {
      let cumulativeRotation = 0;
      for (let i = 0; i < index; i++) {
        const j = junctions?.find(jun =>
          (jun.a_panel_id === sortedPanels[i].panel_id && jun.b_panel_id === sortedPanels[i + 1].panel_id) ||
          (jun.b_panel_id === sortedPanels[i].panel_id && jun.a_panel_id === sortedPanels[i + 1].panel_id)
        );
        if (j) {
          let rotationToAdd = 180 - (j.angle_deg || 180);
          if ((j.angle_deg || 180) !== 180 && doorIndex >= 0) {
            if (i < doorIndex) rotationToAdd = Math.abs(rotationToAdd);
            else rotationToAdd = -Math.abs(rotationToAdd);
          }
          cumulativeRotation += rotationToAdd;
        }
      }

      // Use actual panel width with scaling factor
      const panelWidthMm = panel.width_mm || 700;
      const visualWidth = panelWidthMm * 0.05; // Scale mm to visual units
      const halfVisualWidth = visualWidth / 2;

      let xPos = 0;
      let zPos = 0;

      if (index === 0) {
        xPos = 0; zPos = 0;
      } else {
        let prevRotation = 0;
        let prevX = 0;
        let prevZ = 0;
        for (let i = 0; i < index; i++) {
          const prevPanelWidth = (sortedPanels[i].width_mm || 700) * 0.05;
          const prevHalfWidth = prevPanelWidth / 2;

          if (i === 0) {
            prevX = 0; prevZ = 0; prevRotation = 0;
          } else {
            const prevPrevRotation = prevRotation;
            const jPrev = junctions?.find(jun =>
              (jun.a_panel_id === sortedPanels[i - 1].panel_id && jun.b_panel_id === sortedPanels[i].panel_id) ||
              (jun.b_panel_id === sortedPanels[i - 1].panel_id && jun.a_panel_id === sortedPanels[i].panel_id)
            );
            if (jPrev) {
              let rotationToAdd = 180 - (jPrev.angle_deg || 180);
              if ((jPrev.angle_deg || 180) !== 180 && doorIndex >= 0) {
                if (i - 1 < doorIndex) rotationToAdd = Math.abs(rotationToAdd);
                else rotationToAdd = -Math.abs(rotationToAdd);
              }
              prevRotation += rotationToAdd;
            }
            const prevPrevPanelWidth = (sortedPanels[i - 1].width_mm || 700) * 0.05;
            const prevPrevHalfWidth = prevPrevPanelWidth / 2;
            const prevRad = (prevPrevRotation * Math.PI) / 180;
            const freeEdgeX = prevX + prevPrevHalfWidth * Math.cos(prevRad);
            const freeEdgeZ = prevZ + prevPrevHalfWidth * Math.sin(prevRad);
            const currRad = (prevRotation * Math.PI) / 180;
            prevX = freeEdgeX - (-prevHalfWidth) * Math.cos(currRad);
            prevZ = freeEdgeZ - (-prevHalfWidth) * Math.sin(currRad);
          }
        }
        const prevPanelWidth = (sortedPanels[index - 1].width_mm || 700) * 0.05;
        const prevHalfWidth = prevPanelWidth / 2;
        const prevRad = (prevRotation * Math.PI) / 180;
        const freeEdgeX = prevX + prevHalfWidth * Math.cos(prevRad);
        const freeEdgeZ = prevZ + prevHalfWidth * Math.sin(prevRad);
        const currRad = (cumulativeRotation * Math.PI) / 180;
        xPos = freeEdgeX - (-halfVisualWidth) * Math.cos(currRad);
        zPos = freeEdgeZ - (-halfVisualWidth) * Math.sin(currRad);
      }

      const currentRad = (cumulativeRotation * Math.PI) / 180;
      const cos = Math.cos(currentRad);
      const sin = Math.sin(currentRad);

      const planeCorners = [{ x: -halfVisualWidth, z: 0 }, { x: halfVisualWidth, z: 0 }].map(c => ({
        x: xPos + c.x * cos - c.z * sin,
        z: zPos + c.x * sin + c.z * cos,
      }));

      return { panel, xPos, zPos, rotation: cumulativeRotation, corners: planeCorners, visualWidth, halfWidth: halfVisualWidth };
    });

    const collisions: Array<[number, number]> = [];
    for (let i = 0; i < panel3DData.length; i++) {
      for (let j = i + 2; j < panel3DData.length; j++) {
        if (lineSegmentsIntersect(panel3DData[i].corners[0], panel3DData[i].corners[1], panel3DData[j].corners[0], panel3DData[j].corners[1])) {
          collisions.push([i, j]);
        }
      }
    }

    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden bg-white rounded-3xl">
        {collisions.length > 0 && (
          <div className="absolute top-4 left-4 right-4 z-10 p-3 bg-red-500 text-white rounded-full text-[10px] font-black tracking-widest text-center shadow-lg animate-pulse">
            ⚠️ PHYSICAL COLLISION DETECTED
          </div>
        )}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <g transform={`translate(${width / 2}, ${height / 2}) scale(${finalScale})`}>
            <g transform={`rotate(${globalRotation})`}>
              {panel3DData.map(({ panel, xPos, zPos, rotation, halfWidth }) => {
                const rad = (rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const pHeightPx = (panel.height_mm || realHeightMm) * 0.13;
                const halfH = pHeightPx / 2;
                const isoX = xPos - zPos * 0.5;
                const isoY = (xPos + zPos) * 0.25;

                const corners = [
                  { x: -halfWidth, y: -halfH }, { x: halfWidth, y: -halfH },
                  { x: halfWidth, y: halfH }, { x: -halfWidth, y: halfH }
                ].map(c => {
                  const rX = c.x * cos; const rZ = c.x * sin;
                  return { x: isoX + (rX - rZ * 0.5), y: isoY + ((rX + rZ) * 0.25 + c.y) };
                });

                const pathD = `M ${corners[0].x} ${corners[0].y} L ${corners[1].x} ${corners[1].y} L ${corners[2].x} ${corners[2].y} L ${corners[3].x} ${corners[3].y} Z`;
                const isDoor = panel.panel_type === 'door_hinged';
                const isActive = activePanelId === panel.panel_id;

                return (
                  <g key={panel.panel_id} onClick={() => onPanelClick?.(panel.panel_id)} className="cursor-pointer group">
                    {/* Selection indicator - dotted outline */}
                    {isActive && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#1d4ed8"
                        strokeWidth="3"
                        strokeDasharray="6 6"
                        className="animate-pulse"
                        style={{ transform: 'scale(1.05)', transformOrigin: `${isoX}px ${isoY}px` }}
                      />
                    )}

                    {/* Glass panel */}
                    <path
                      d={pathD}
                      fill={isDoor ? "#60A5FA" : "#93C5FD"}
                      fillOpacity={isActive ? "0.8" : "0.5"}
                      stroke={isActive ? "#1d4ed8" : isDoor ? "#2563EB" : "#3B82F6"}
                      strokeWidth={isActive ? "3" : "2"}
                      className="transition-all duration-300 group-hover:fill-opacity-90"
                    />

                    {/* Hardware rendering - DOORS */}
                    {isDoor && (
                      <>
                        {/* Door indicator */}
                        <circle cx={isoX} cy={isoY - halfH + 15} r="6" fill="#EF4444" stroke="#fff" strokeWidth="2" className="animate-pulse" />
                        <text x={isoX} y={isoY - halfH + 18} textAnchor="middle" className="text-[6px] font-black fill-white">D</text>

                        {/* Hinges - 3 positions */}
                        {[0.15, 0.5, 0.85].map((pos, idx) => {
                          const hingeY = isoY - halfH + pHeightPx * pos;
                          const hingeSide = panel.hinge_side === 'left' ? -1 : 1;
                          const hingeX = isoX + (hingeSide * halfWidth);
                          return (
                            <g key={`hinge-${idx}`}>
                              <rect x={hingeX - 4} y={hingeY - 8} width="8" height="16" fill="#475569" rx="2" stroke="#334155" strokeWidth="1" />
                              <circle cx={hingeX} cy={hingeY} r="3" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
                            </g>
                          );
                        })}

                        {/* Handle - vertical bar */}
                        {(() => {
                          const handleSide = panel.handle_side === 'left' ? -1 : 1;
                          const handleX = isoX + (handleSide * (halfWidth - 8));
                          return (
                            <g>
                              <rect
                                x={handleX - 3}
                                y={isoY - 25}
                                width="6"
                                height="50"
                                fill="#64748b"
                                stroke="#475569"
                                strokeWidth="1"
                                rx="3"
                              />
                              <rect
                                x={handleX - 2}
                                y={isoY - 20}
                                width="4"
                                height="40"
                                fill="#94a3b8"
                                rx="2"
                              />
                            </g>
                          );
                        })()}
                      </>
                    )}

                    {/* Fixed panel hardware - Clamps */}
                    {!isDoor && (
                      <>
                        {/* Top clamps */}
                        {[0.25, 0.75].map((pos, idx) => {
                          const clampX = isoX - halfWidth + (halfWidth * 2) * pos;
                          const clampY = isoY - halfH;
                          return (
                            <g key={`clamp-top-${idx}`}>
                              <rect x={clampX - 6} y={clampY - 8} width="12" height="10" fill="#475569" rx="2" stroke="#334155" strokeWidth="1" />
                              <rect x={clampX - 4} y={clampY - 6} width="8" height="6" fill="#64748b" rx="1" />
                            </g>
                          );
                        })}
                        {/* Bottom clamps */}
                        {[0.25, 0.75].map((pos, idx) => {
                          const clampX = isoX - halfWidth + (halfWidth * 2) * pos;
                          const clampY = isoY + halfH;
                          return (
                            <g key={`clamp-bottom-${idx}`}>
                              <rect x={clampX - 6} y={clampY - 2} width="12" height="10" fill="#475569" rx="2" stroke="#334155" strokeWidth="1" />
                              <rect x={clampX - 4} y={clampY} width="8" height="6" fill="#64748b" rx="1" />
                            </g>
                          );
                        })}
                      </>
                    )}

                    {/* Panel label */}
                    <text x={isoX} y={isoY + halfH + 20} textAnchor="middle" className="text-[10px] font-black fill-slate-600">
                      {panel.width_mm}mm
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>
    );
  }

  // EXPLODED / 2D VIEW
  const visualScale = 0.13; // Consistent with other components
  const totalExplodedWidth = sortedPanels.reduce((sum, p) => sum + p.width_mm * visualScale, 0) + (sortedPanels.length - 1) * separationGap;
  const explodedStartX = (width - totalExplodedWidth) / 2;

  let currentX = explodedStartX;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-visible">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <g transform={`scale(${scaleOverride})`}>
          {sortedPanels.map((p, idx) => {
            const pWidth = p.width_mm * visualScale;
            const localX = currentX;
            currentX += pWidth + separationGap;

            const isSelected = p.panel_id === activePanelId;

            return (
              <g key={p.panel_id} onClick={() => onPanelClick?.(p.panel_id)} className="cursor-pointer">
                {/* Selection Highlight */}
                {isSelected && (
                  <rect
                    x={localX - 10} y={startY - 10}
                    width={pWidth + 20} height={panelHeight + 20}
                    fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8 4" rx="8"
                  />
                )}

                {p.panel_type === 'door_hinged' ? (
                  <PanelDoor
                    width={pWidth}
                    height={panelHeight}
                    x={localX}
                    y={startY}
                    hinge_side={p.hinge_side || 'left'}
                    handle_side={p.handle_side || 'right'}
                    finish={hardwareFinish}
                  />
                ) : (
                  <PanelFixed
                    width={pWidth}
                    height={panelHeight}
                    x={localX}
                    y={startY}
                    useClampsMode={mountingType === 'clamps'}
                    channels={mountingType === 'channel' ? [
                      'bottom',
                      ...(p.wall_fix?.left ? ['left'] : []),
                      ...(p.wall_fix?.right ? ['right'] : [])
                    ] as any : []}
                    hingePositions={[20, panelHeight - 30]} // Clamp positions
                    clampEdge="center"
                    finish={hardwareFinish}
                  />
                )}

                {/* Labels */}
                <text
                  x={localX + pWidth / 2} y={startY - 35}
                  textAnchor="middle"
                  className="text-[14px] font-black fill-slate-900 uppercase tracking-tight"
                >
                  {p.panel_id} ({p.width_mm}mm)
                </text>

                {/* Junction Indicators between panels */}
                {idx < sortedPanels.length - 1 && (() => {
                  const nextPanel = sortedPanels[idx + 1];
                  const midX = localX + pWidth + separationGap / 2;
                  const junction = junctions?.find(j =>
                    (j.a_panel_id === p.panel_id && j.b_panel_id === nextPanel.panel_id) ||
                    (j.b_panel_id === p.panel_id && j.a_panel_id === nextPanel.panel_id)
                  );
                  if (!junction) return null;
                  const isOpen = activeJunctionId === junction.junction_id;

                  return (
                    <g transform={`translate(${midX}, ${startY + panelHeight / 2})`}>
                      <rect
                        x="-18" y="-18" width="36" height="36" transform="rotate(45)"
                        fill={isOpen ? "#3b82f6" : "#1e293b"}
                        rx="6"
                        onClick={(e) => { e.stopPropagation(); onJunctionSelect?.(junction.junction_id); }}
                      />
                      <text y="4" textAnchor="middle" className="text-[12px] font-black fill-white pointer-events-none">{junction.angle_deg}°</text>
                    </g>
                  );
                })()}

                {/* Add Panel Button */}
                <g
                  transform={`translate(${localX + pWidth + separationGap / 2}, ${startY + panelHeight})`}
                  className="cursor-pointer group"
                  onClick={(e) => { e.stopPropagation(); onAddPanel?.(idx + 1); }}
                >
                  {idx < sortedPanels.length - 1 && (
                    <>
                      <circle r="16" fill="#1e293b" className="group-hover:fill-blue-600 transition-colors shadow-lg" />
                      <circle r="14" fill="#22c55e" stroke="white" strokeWidth="2" />
                      <line x1="-6" y1="0" x2="6" y2="0" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      <line x1="0" y1="-6" x2="0" y2="6" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
