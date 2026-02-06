import React, { useState } from 'react';
import type { JunctionModel, PanelModel } from '@/types/square';
import { PanelFixed } from './PanelFixed';
import { PanelDoor } from './PanelDoor';
import { Hinge, HardwareFinish } from './Hinge';
import { Handle } from './Handle';

interface ExplodedPanelViewProps {
    panels: PanelModel[];
    junctions: JunctionModel[];
    activePanelId: string | null;
    activeJunctionId: string | null;
    onPanelSelect: (id: string) => void;
    onJunctionSelect: (id: string) => void;
    onAddPanel: (index: number) => void;
    onDeletePanel: (id: string) => void;
    onUpdateJunctionAngle: (id: string, angle: number) => void;
    onUpdatePanelType: (id: string, type: 'fixed' | 'door_hinged') => void;
    minPanels?: number;
    activeEditor?: React.ReactNode;
    hardwareFinish?: HardwareFinish;
    readOnly?: boolean;
}

export function ExplodedPanelView({
    panels,
    junctions,
    activePanelId,
    activeJunctionId,
    onPanelSelect,
    onJunctionSelect,
    onAddPanel,
    onDeletePanel,
    onUpdateJunctionAngle,
    onUpdatePanelType,
    minPanels = 2,
    activeEditor,
    hardwareFinish = 'chrome',
    readOnly = false
}: ExplodedPanelViewProps) {
    const [openJunctionPopoverId, setOpenJunctionPopoverId] = useState<string | null>(null);

    // Layout constants
    const width = 800;
    const height = 400;
    const panelWidth = 100;
    const panelHeight = 260;
    const separationGap = 100;
    const startY = (height - panelHeight) / 2;

    const sortedPanels = [...panels].sort((a, b) => a.position_index - b.position_index);
    const totalContentWidth = sortedPanels.length * panelWidth + (sortedPanels.length - 1) * separationGap;
    const startX = (width - totalContentWidth) / 2;

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[500px] relative">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                {sortedPanels.map((panel, idx) => {
                    const localX = startX + idx * (panelWidth + separationGap);
                    const isSelected = activePanelId === panel.panel_id;

                    return (
                        <g key={panel.panel_id} className="cursor-pointer">
                            {/* Panel Rendering */}
                            <g onClick={() => onPanelSelect(panel.panel_id)}>
                                {/* Dotted selection indicator */}
                                {isSelected && (
                                    <rect
                                        x={localX - 5}
                                        y={startY - 5}
                                        width={panelWidth + 10}
                                        height={panelHeight + 10}
                                        fill="none"
                                        stroke="#1d4ed8"
                                        strokeWidth="2"
                                        strokeDasharray="6 6"
                                        rx="8"
                                        className="animate-pulse"
                                    />
                                )}

                                {panel.panel_type === 'door_hinged' ? (
                                    <PanelDoor
                                        width={panelWidth}
                                        height={panelHeight}
                                        x={localX}
                                        y={startY}
                                        top_edge={panel.top_edge}
                                        notches={panel.notches}
                                        hinge_side={panel.hinge_side || 'left'}
                                        handle_side={panel.handle_side || 'right'}
                                        finish={hardwareFinish}
                                    />
                                ) : (
                                    <PanelFixed
                                        width={panelWidth}
                                        height={panelHeight}
                                        x={localX}
                                        y={startY}
                                        isActive={isSelected}
                                        top_edge={panel.top_edge}
                                        notches={panel.notches}
                                        finish={hardwareFinish}
                                    />
                                )}

                                {/* Hardware rendering - hinges/handle use finish */}
                                {panel.panel_type === 'door_hinged' ? (
                                    <>
                                        {/* Hinges */}
                                        {[0.2, 0.8].map((pos, hidx) => {
                                            const hingeY = startY + panelHeight * pos;
                                            const hingeX = panel.hinge_side === 'left' ? localX : localX + panelWidth;
                                            return (
                                                <Hinge
                                                    key={`hinge-${hidx}`}
                                                    x={hingeX}
                                                    y={hingeY}
                                                    orientation={panel.hinge_side || 'left'}
                                                    type="wall"
                                                    finish={hardwareFinish}
                                                />
                                            );
                                        })}

                                        {/* Handle */}
                                        <Handle
                                            x={panel.handle_side === 'left' ? localX : localX + panelWidth}
                                            y={startY + panelHeight / 2}
                                            orientation={panel.handle_side || 'right'}
                                            finish={hardwareFinish}
                                        />
                                    </>
                                ) : (
                                    <>
                                        {/* Clamps for fixed panels */}
                                        {[0.25, 0.75].map((pos, cidx) => {
                                            const clampY = startY + panelHeight * pos;
                                            return (
                                                <circle
                                                    key={`clamp-${cidx}`}
                                                    cx={localX + 5}
                                                    cy={clampY}
                                                    r="3"
                                                    fill="#64748b"
                                                    stroke="#475569"
                                                    strokeWidth="1"
                                                />
                                            );
                                        })}
                                    </>
                                )}

                                {/* Label */}
                                <text
                                    x={localX + panelWidth / 2}
                                    y={startY - 30}
                                    textAnchor="middle"
                                    className="text-[14px] font-black fill-slate-900 uppercase tracking-widest"
                                >
                                    {panel.panel_id}
                                </text>

                                {/* Delete Button (if above minPanels, hidden in readOnly) */}
                                {!readOnly && sortedPanels.length > minPanels && isSelected && (
                                    <g
                                        transform={`translate(${localX + panelWidth - 10}, ${startY + 10})`}
                                        onClick={(e) => { e.stopPropagation(); onDeletePanel(panel.panel_id); }}
                                        className="hover:scale-110 transition-transform"
                                    >
                                        <circle r="12" fill="#ef4444" stroke="white" strokeWidth="2" />
                                        <path d="M-5 -5 L5 5 M-5 5 L5 -5" stroke="white" strokeWidth="2" />
                                    </g>
                                )}
                            </g>

                            {/* Junction Control */}
                            {idx < sortedPanels.length - 1 && (() => {
                                const nextPanel = sortedPanels[idx + 1];
                                const midX = localX + panelWidth + separationGap / 2;
                                const junction = junctions.find(j =>
                                    (j.a_panel_id === panel.panel_id && j.b_panel_id === nextPanel.panel_id) ||
                                    (j.b_panel_id === panel.panel_id && j.a_panel_id === nextPanel.panel_id)
                                );

                                if (!junction) return null;
                                const isJunctionSelected = activeJunctionId === junction.junction_id;

                                return (
                                    <g transform={`translate(${midX}, ${startY + panelHeight / 2})`}>
                                        <g
                                            className="cursor-pointer group"
                                            onClick={() => onJunctionSelect(junction.junction_id)}
                                        >
                                            <rect
                                                x="-20" y="-20" width="40" height="40" transform="rotate(45)"
                                                fill={isJunctionSelected ? "#3b82f6" : "#f8fafc"}
                                                stroke={isJunctionSelected ? "#2563eb" : "#e2e8f0"}
                                                strokeWidth="2"
                                                rx="6"
                                                className="group-hover:fill-blue-50 transition-colors"
                                            />
                                            <text
                                                y="4" textAnchor="middle"
                                                className={`text-[12px] font-black ${isJunctionSelected ? 'fill-white' : 'fill-slate-600'}`}
                                            >
                                                {junction.angle_deg}°
                                            </text>
                                        </g>

                                        {/* Simple Angle Toggle Popover (placeholder) */}
                                        {isJunctionSelected && (
                                            <g transform="translate(0, 40)">
                                                <rect x="-40" y="0" width="80" height="90" fill="white" stroke="#e2e8f0" strokeWidth="1" rx="8" shadow="sm" />
                                                {[90, 135, 180].map((angle, i) => (
                                                    <g
                                                        key={angle}
                                                        transform={`translate(0, ${25 + i * 25})`}
                                                        className="cursor-pointer hover:bg-slate-50"
                                                        onClick={() => onUpdateJunctionAngle(junction.junction_id, angle)}
                                                    >
                                                        <text textAnchor="middle" className="text-[10px] font-bold fill-slate-700">{angle}°</text>
                                                    </g>
                                                ))}
                                            </g>
                                        )}
                                    </g>
                                );
                            })()}

                            {/* Add Panel Button - moved to top center (hidden in readOnly) */}
                            {!readOnly && (
                                <g
                                    transform={`translate(${localX + panelWidth + separationGap / 2}, ${startY - 50})`}
                                    className="cursor-pointer group"
                                    onClick={() => onAddPanel(idx + 1)}
                                >
                                    <circle r="18" fill="#22c55e" stroke="white" strokeWidth="2" className="group-hover:scale-110 transition-transform shadow-lg" />
                                    <path d="M-6 0 L6 0 M0 -6 L0 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Editor Area (Pass-through from SquareConfigurator) */}
            {activeEditor && (
                <div className="w-full max-w-2xl mt-8">
                    {activeEditor}
                </div>
            )}
        </div>
    );
}
