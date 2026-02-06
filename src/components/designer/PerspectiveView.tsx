import React, { useState, useMemo } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChainPanel, ChainJunction } from './Square1Configurator';
import { HardwareFinish, getHardwareColors } from './Hinge';

interface PerspectiveViewProps {
    panels: ChainPanel[];
    junctions: ChainJunction[];
    width?: number;
    height?: number;
    activePanelId?: string | null;
    onPanelClick?: (id: string) => void;
    panelHeight?: number;
    hardwareFinish?: HardwareFinish;
    mountingType?: 'channel' | 'clamps';
}

export function PerspectiveView({
    panels,
    junctions,
    width = 1200,
    height = 800,
    activePanelId,
    onPanelClick,
    panelHeight = 2100,
    hardwareFinish = 'chrome',
    mountingType = 'channel'
}: PerspectiveViewProps) {
    const [viewAngle, setViewAngle] = useState(30);
    const [zoom, setZoom] = useState(1);
    const colors = getHardwareColors(hardwareFinish);

    const doorIndex = panels.findIndex(p => p.type === 'door');
    if (doorIndex === -1) return null;

    // 1. Calculate raw segments at unit scale (exact same logic as PlanView)
    const rawSegments = useMemo(() => {
        const segs: { x1: number; z1: number; x2: number; z2: number; panel: ChainPanel }[] = [];
        const door = panels[doorIndex];

        segs[doorIndex] = { x1: 0, z1: 0, x2: door.width_mm, z2: 0, panel: door };

        let curX = 0, curZ = 0, dx = -1, dz = 0;
        for (let i = doorIndex - 1; i >= 0; i--) {
            if (junctions[i].angle_deg === 90) {
                const nextDx = -dz;
                const nextDz = dx;
                dx = nextDx; dz = nextDz;
            }
            const p = panels[i];
            const nextX = curX + dx * p.width_mm;
            const nextZ = curZ + dz * p.width_mm;
            segs[i] = { x1: curX, z1: curZ, x2: nextX, z2: nextZ, panel: p };
            curX = nextX; curZ = nextZ;
        }

        curX = door.width_mm; curZ = 0; dx = 1; dz = 0;
        for (let i = doorIndex + 1; i < panels.length; i++) {
            if (junctions[i - 1].angle_deg === 90) {
                const nextDx = dz;
                const nextDz = -dx;
                dx = nextDx; dz = nextDz;
            }
            const p = panels[i];
            const nextX = curX + dx * p.width_mm;
            const nextZ = curZ + dz * p.width_mm;
            segs[i] = { x1: curX, z1: curZ, x2: nextX, z2: nextZ, panel: p };
            curX = nextX; curZ = nextZ;
        }
        return segs;
    }, [panels, junctions, doorIndex]);

    // 2. Calculate bounds
    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        rawSegments.forEach(s => {
            minX = Math.min(minX, s.x1, s.x2);
            maxX = Math.max(maxX, s.x1, s.x2);
            minZ = Math.min(minZ, s.z1, s.z2);
            maxZ = Math.max(maxZ, s.z1, s.z2);
        });
        return { minX, maxX, minZ, maxZ };
    }, [rawSegments]);

    // 3. Project 3D to 2D with horizontal rotation around Y axis
    const project = (x3d: number, y3d: number, z3d: number) => {
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cz = (bounds.minZ + bounds.maxZ) / 2;
        const angleRad = (viewAngle * Math.PI) / 180;
        const rotX = (x3d - cx) * Math.cos(angleRad) - (z3d - cz) * Math.sin(angleRad);
        const rotZ = (x3d - cx) * Math.sin(angleRad) + (z3d - cz) * Math.cos(angleRad);
        const isoFactor = 0.5;
        return { x: rotX, y: -y3d + rotZ * isoFactor };
    };

    // 4. Calculate scale to fit viewport
    const { scale, offsetX, offsetY } = useMemo(() => {
        const testPoints: { x: number; y: number }[] = [];
        rawSegments.forEach(seg => {
            testPoints.push(project(seg.x1, 0, seg.z1));
            testPoints.push(project(seg.x2, 0, seg.z2));
            testPoints.push(project(seg.x1, panelHeight, seg.z1));
            testPoints.push(project(seg.x2, panelHeight, seg.z2));
        });

        let minPX = Infinity, maxPX = -Infinity, minPY = Infinity, maxPY = -Infinity;
        testPoints.forEach(p => {
            minPX = Math.min(minPX, p.x);
            maxPX = Math.max(maxPX, p.x);
            minPY = Math.min(minPY, p.y);
            maxPY = Math.max(maxPY, p.y);
        });

        const padding = 200;
        const contentW = maxPX - minPX || 1000;
        const contentH = maxPY - minPY || 1000;
        const s = Math.min((width - padding) / contentW, (height - padding) / contentH, 0.3) * zoom;

        return {
            scale: s,
            offsetX: width / 2 - ((minPX + maxPX) / 2) * s,
            offsetY: height / 2 - ((minPY + maxPY) / 2) * s
        };
    }, [rawSegments, width, height, viewAngle, zoom, panelHeight, bounds]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden bg-white rounded-3xl">
            {/* Rotation Slider */}
            <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 px-4 py-2">
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <input
                    type="range" min="-90" max="90" value={viewAngle}
                    onChange={(e) => setViewAngle(parseInt(e.target.value))}
                    className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs font-black text-slate-600 w-10">{viewAngle}°</span>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 z-10 flex gap-2">
                <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 p-1">
                    <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="h-10 w-10 rounded-full">
                        <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-black text-slate-600 px-2">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="h-10 w-10 rounded-full">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
                    {rawSegments.map((seg, idx) => {
                        const { x1, z1, x2, z2, panel } = seg;
                        const isDoor = panel.type === 'door';
                        const isActive = activePanelId === panel.id;

                        // Project 4 corners of glass panel
                        const bl = project(x1, 0, z1);
                        const br = project(x2, 0, z2);
                        const tl = project(x1, panelHeight, z1);
                        const tr = project(x2, panelHeight, z2);

                        const pathD = `M ${bl.x} ${bl.y} L ${br.x} ${br.y} L ${tr.x} ${tr.y} L ${tl.x} ${tl.y} Z`;

                        return (
                            <g key={panel.id} onClick={() => onPanelClick?.(panel.id)} className="cursor-pointer group">
                                {/* Selection indicator */}
                                {isActive && (
                                    <path d={pathD} fill="none" stroke="#1d4ed8" strokeWidth="6" strokeDasharray="20 20" className="animate-pulse" />
                                )}

                                {/* Glass panel - using PanelFixed/PanelDoor styling */}
                                <path
                                    d={pathD}
                                    fill="#A8C7DC"
                                    fillOpacity="0.55"
                                    stroke="#4A7A9E"
                                    strokeWidth="2"
                                    className="transition-all duration-300 group-hover:fill-opacity-70"
                                />

                                {/* Door hardware - Hinges and Handle */}
                                {isDoor && (
                                    <>
                                        {/* Hinges - Realistic size (70x90mm) */}
                                        {(() => {
                                            const hingeSide = panel.door_properties?.hinge_side === 'left' ? 0 : 1;
                                            const offset = Math.round(panelHeight * 0.14);
                                            const hingeW = 60, hingeH = 90;

                                            return [offset, panelHeight - offset].map((yPos, i) => {
                                                const p3d = project(hingeSide === 0 ? x1 : x2, yPos, hingeSide === 0 ? z1 : z2);
                                                return (
                                                    <rect
                                                        key={i}
                                                        x={p3d.x - hingeW / 2} y={p3d.y - hingeH / 2}
                                                        width={hingeW} height={hingeH}
                                                        fill={colors.fill} stroke={colors.stroke} strokeWidth="2"
                                                        rx="4"
                                                    />
                                                );
                                            });
                                        })()}

                                        {/* Handle - slim bar (25x400mm) */}
                                        {(() => {
                                            const handleSide = panel.door_properties?.hinge_side === 'left' ? 1 : 0;
                                            const baseX = handleSide === 0 ? bl.x : br.x;
                                            const baseY = handleSide === 0 ? bl.y : br.y;
                                            const topX = handleSide === 0 ? tl.x : tr.x;
                                            const topY = handleSide === 0 ? tl.y : tr.y;

                                            const midY = panelHeight / 2;
                                            const p3d = project(handleSide === 0 ? x1 : x2, midY, handleSide === 0 ? z1 : z2);

                                            const handleW = 20, handleH = 400;
                                            return (
                                                <>
                                                    <rect
                                                        x={p3d.x - handleW / 2} y={p3d.y - handleH / 2}
                                                        width={handleW} height={handleH} rx="10"
                                                        fill={colors.fill} stroke={colors.stroke} strokeWidth="1"
                                                    />
                                                    <rect
                                                        x={p3d.x - handleW / 2 + 5} y={p3d.y - handleH / 2 + 10}
                                                        width="4" height={handleH - 20} rx="2"
                                                        fill={colors.highlight} opacity="0.6"
                                                    />
                                                </>
                                            );
                                        })()}
                                    </>
                                )}

                                {/* Fixed panel hardware - Clamps */}
                                {mountingType === 'clamps' && !isDoor && (
                                    <>
                                        {/* Top center clamp - Realistic size (40x40mm) */}
                                        {(() => {
                                            const midX = (x1 + x2) / 2;
                                            const midZ = (z1 + z2) / 2;
                                            const p3d = project(midX, panelHeight, midZ);
                                            const size = 45;
                                            return (
                                                <rect
                                                    x={p3d.x - size / 2} y={p3d.y - size / 2}
                                                    width={size} height={size}
                                                    fill={colors.fill} stroke={colors.stroke} strokeWidth="2"
                                                    rx="4"
                                                />
                                            );
                                        })()}
                                        {/* Bottom center clamp */}
                                        {(() => {
                                            const cx = (bl.x + br.x) / 2;
                                            const cy = (bl.y + br.y) / 2;
                                            const size = 10;
                                            return (
                                                <rect
                                                    x={cx - size / 2} y={cy - size / 2}
                                                    width={size} height={size}
                                                    fill={colors.fill} stroke={colors.stroke} strokeWidth="1"
                                                />
                                            );
                                        })()}
                                    </>
                                )}

                                {/* Channel Indicators (19mm deep visualization if mountingType is channel) */}
                                {mountingType === 'channel' && !isDoor && (
                                    <g opacity="1">
                                        {/* Bottom Channel (19mm deep) */}
                                        {(() => {
                                            const channelDepth = 19;
                                            const p1_top = project(x1, channelDepth, z1);
                                            const p2_top = project(x2, channelDepth, z2);
                                            return (
                                                <path
                                                    d={`M ${bl.x} ${bl.y} L ${br.x} ${br.y} L ${p2_top.x} ${p2_top.y} L ${p1_top.x} ${p1_top.y} Z`}
                                                    fill={colors.fill}
                                                    stroke={colors.stroke}
                                                    strokeWidth="1.5"
                                                />
                                            );
                                        })()}

                                        {/* Wall Channels (if first or last panel and wall fixed) */}
                                        {idx === 0 && (
                                            <path
                                                d={`M ${bl.x} ${bl.y} L ${tl.x} ${tl.y} L ${project(x1 + 19, panelHeight, z1).x} ${project(x1 + 19, panelHeight, z1).y} L ${project(x1 + 19, 0, z1).x} ${project(x1 + 19, 0, z1).y} Z`}
                                                fill={colors.fill}
                                                stroke={colors.stroke}
                                                strokeWidth="1.5"
                                            />
                                        )}
                                        {idx === rawSegments.length - 1 && (
                                            <path
                                                d={`M ${br.x} ${br.y} L ${tr.x} ${tr.y} L ${project(x2 - 19, panelHeight, z2).x} ${project(x2 - 19, panelHeight, z2).y} L ${project(x2 - 19, 0, z2).x} ${project(x2 - 19, 0, z2).y} Z`}
                                                fill={colors.fill}
                                                stroke={colors.stroke}
                                                strokeWidth="1.5"
                                            />
                                        )}
                                    </g>
                                )}

                                {/* Width label */}
                                <text
                                    x={(bl.x + br.x) / 2}
                                    y={(bl.y + br.y) / 2 + 60}
                                    textAnchor="middle"
                                    className="font-black fill-slate-600"
                                    style={{ fontSize: '32px' }}
                                >
                                    {panel.width_mm}mm
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
