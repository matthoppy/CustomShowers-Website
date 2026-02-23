import React, { useState, useMemo } from 'react';
import { ChainPanel, ChainJunction } from './Square1Configurator';
import { ExplodedPanelView } from './ExplodedPanelView';
import type { PanelModel, JunctionModel } from '@/types/square';

interface PlanViewProps {
    panels: ChainPanel[];
    junctions: ChainJunction[];
    leftWall: boolean;
    rightWall: boolean;
    width?: number;
    height?: number;
    onPanelClick?: (id: string) => void;
    onJunctionClick?: (index: number) => void;
    onAddLeft?: (index: number) => void;
    onAddRight?: (index: number) => void;
    onUpdateJunctionAngle?: (index: number, angle: 90 | 180) => void;
    onToggleWall?: (side: 'left' | 'right') => void;
    activePanelId?: string | null;
}

export function PlanView({
    panels,
    junctions,
    leftWall,
    rightWall,
    width = 600,
    height = 600,
    onPanelClick,
    onJunctionClick,
    onAddLeft,
    onAddRight,
    onUpdateJunctionAngle,
    onToggleWall,
    activePanelId
}: PlanViewProps) {
    const [hoveredPanelId, setHoveredPanelId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'top-down' | 'front'>('top-down');
    const doorIndex = panels.findIndex(p => p.type === 'door');
    if (doorIndex === -1) return null;

    // 1. Calculate relative points at unit scale (with notch support)
    const rawSegments = useMemo(() => {
        const segs: any[] = [];
        const door = panels[doorIndex];

        // Door segment (anchor)
        segs[doorIndex] = { x1: 0, y1: 0, x2: door.width_mm, y2: 0, id: door.id, type: 'door', notches: door.notches };

        // Trace Left side (from Door edge outwards)
        let curX = 0, curY = 0;
        let dx = -1, dy = 0;
        for (let i = doorIndex - 1; i >= 0; i--) {
            if (junctions[i].angle_deg === 90) {
                const nextDx = -dy;
                const nextDy = dx;
                dx = nextDx; dy = nextDy;
            }
            const p = panels[i];
            const nextX = curX + dx * p.width_mm;
            const nextY = curY + dy * p.width_mm;
            segs[i] = { x1: curX, y1: curY, x2: nextX, y2: nextY, id: p.id, type: p.type, notches: p.notches };
            curX = nextX; curY = nextY;
        }

        // Trace Right side (from Door edge outwards)
        curX = door.width_mm; curY = 0;
        dx = 1; dy = 0;
        for (let i = doorIndex + 1; i < panels.length; i++) {
            if (junctions[i - 1].angle_deg === 90) {
                const nextDx = dy;
                const nextDy = -dx;
                dx = nextDx; dy = nextDy;
            }
            const p = panels[i];
            const nextX = curX + dx * p.width_mm;
            const nextY = curY + dy * p.width_mm;
            segs[i] = { x1: curX, y1: curY, x2: nextX, y2: nextY, id: p.id, type: p.type, notches: p.notches };
            curX = nextX; curY = nextY;
        }
        return segs;
    }, [panels, junctions, doorIndex]);

    // 2. Calculate Dynamic Scale & Offsets
    const { finalScale, offsetX, offsetY } = useMemo(() => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        rawSegments.forEach(s => {
            minX = Math.min(minX, s.x1, s.x2);
            maxX = Math.max(maxX, s.x1, s.x2);
            minY = Math.min(minY, s.y1, s.y2);
            maxY = Math.max(maxY, s.y1, s.y2);
        });

        const padding = 240; // Increased padding for outside dimensions
        const contentW = (maxX - minX) || 1000;
        const contentH = (maxY - minY) || 1000;
        const s = Math.min((width - padding) / contentW, (height - padding) / contentH, 0.4);

        return {
            finalScale: s,
            offsetX: (width / 2) - (minX + contentW / 2) * s,
            offsetY: (height / 2) - (minY + contentH / 2) * s
        };
    }, [rawSegments, width, height]);

    const segments = rawSegments.map(s => ({
        ...s,
        x1: s.x1 * finalScale,
        y1: s.y1 * finalScale,
        x2: s.x2 * finalScale,
        y2: s.y2 * finalScale
    }));

    // Helper function to generate notch geometry for a segment
    const getNotchPath = (seg: any, panel: any, angle: number, thickness: number) => {
        if (!panel.notches || (!panel.notches.bottom_left && !panel.notches.bottom_right)) {
            return null;
        }

        const { bottom_left, bottom_right, width_mm, height_mm } = panel.notches;
        const notchW = width_mm * finalScale;
        const notchH = height_mm * finalScale;
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);

        const centerX = (seg.x1 + seg.x2) / 2;
        const centerY = (seg.y1 + seg.y2) / 2;
        const panelLength = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);

        const paths = [];

        if (bottom_left) {
            // Left side notch
            const notchX1 = seg.x1 + nx * (thickness / 2 + notchH);
            const notchY1 = seg.y1 + ny * (thickness / 2 + notchH);
            const notchX2 = seg.x1 + notchW * Math.cos(angle);
            const notchY2 = seg.y1 + notchW * Math.sin(angle);
            const notchX3 = notchX2 + nx * (thickness / 2 + notchH);
            const notchY3 = notchY2 + ny * (thickness / 2 + notchH);

            paths.push(`M ${seg.x1} ${seg.y1} L ${notchX1} ${notchY1} L ${notchX3} ${notchY3} L ${notchX2} ${notchY2} Z`);
        }

        if (bottom_right) {
            // Right side notch
            const notchX1 = seg.x2 + nx * (thickness / 2 + notchH);
            const notchY1 = seg.y2 + ny * (thickness / 2 + notchH);
            const notchX2 = seg.x2 - notchW * Math.cos(angle);
            const notchY2 = seg.y2 - notchW * Math.sin(angle);
            const notchX3 = notchX2 + nx * (thickness / 2 + notchH);
            const notchY3 = notchY2 + ny * (thickness / 2 + notchH);

            paths.push(`M ${seg.x2} ${seg.y2} L ${notchX1} ${notchY1} L ${notchX3} ${notchY3} L ${notchX2} ${notchY2} Z`);
        }

        return paths.length > 0 ? paths : null;
    };

    const leftEdge = (doorIndex === 0)
        ? { x: segments[0].x1, y: segments[0].y1, angle: Math.atan2(segments[0].y2 - segments[0].y1, segments[0].x2 - segments[0].x1) }
        : { x: segments[0].x2, y: segments[0].y2, angle: Math.atan2(segments[0].y2 - segments[0].y1, segments[0].x2 - segments[0].x1) };

    const lastIdx = segments.length - 1;
    const rightEdge = {
        x: segments[lastIdx].x2,
        y: segments[lastIdx].y2,
        angle: Math.atan2(segments[lastIdx].y2 - segments[lastIdx].y1, segments[lastIdx].x2 - segments[lastIdx].x1)
    };

    // Convert ChainPanel/ChainJunction to PanelModel/JunctionModel for ExplodedPanelView
    const explodedViewData = useMemo(() => {
        const panelHeight = 2000; // Default height
        const mappedPanels: PanelModel[] = panels.map((p, idx) => ({
            panel_id: p.id,
            panel_type: p.type === 'door' ? 'door_hinged' : 'fixed',
            plane: 'front',
            position_index: idx,
            hinge_side: p.door_properties?.hinge_side || null,
            handle_side: p.door_properties?.hinge_side === 'left' ? 'right' : 'left',
            wall_fix: { left: false, right: false },
            notches: p.notches || { bottom_left: false, bottom_right: false, width_mm: null, height_mm: null },
            top_edge: { type: 'level', direction: null, drop_mm: null },
            mounting_style: 'channel',
            width_mm: p.width_mm,
            height_mm: panelHeight
        }));

        const mappedJunctions: JunctionModel[] = junctions.map((j, idx) => ({
            junction_id: `j-${idx}`,
            a_panel_id: panels[idx].id,
            a_edge: 'right',
            b_panel_id: panels[idx + 1].id,
            b_edge: 'left',
            angle_deg: j.angle_deg,
            junction_type: 'glass_to_glass'
        }));

        return { panels: mappedPanels, junctions: mappedJunctions };
    }, [panels, junctions]);

    return (
        <div className="flex flex-col w-full h-full">
            {/* Tabs */}
            <div className="flex gap-2 px-6 py-4 bg-white/50 backdrop-blur-sm border-b border-slate-200">
                <button
                    onClick={() => setViewMode('top-down')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                        viewMode === 'top-down'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Top-Down View
                </button>
                <button
                    onClick={() => setViewMode('front')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                        viewMode === 'front'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Exploded View
                </button>
            </div>

            {viewMode === 'top-down' ? (
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    className="overflow-visible select-none outline-none flex-1"
                    onMouseLeave={() => setHoveredPanelId(null)}
                >
                    <g transform={`translate(${offsetX}, ${offsetY})`}>
                        {/* 1. Panel Visual Layer (Bottom) */}
                {segments.map((seg, i) => {
                    const isActive = activePanelId === seg.id;
                    const isHovered = hoveredPanelId === seg.id;
                    const angle = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
                    const thickness = 10 * finalScale;
                    const panel = panels[i];
                    const isDoor = panel.type === 'door';

                    // Door swing arc and hinge line
                    let swingArcs = null;
                    if (isDoor && panel.door_properties) {
                        const { hinge_side, swing_direction } = panel.door_properties;
                        const r = Math.abs(seg.x2 - seg.x1);
                        const hingeX = hinge_side === 'left' ? seg.x1 : seg.x2;
                        const hingeY = hinge_side === 'left' ? seg.y1 : seg.y2;

                        const createArcWithHinge = (isInward: boolean) => {
                            const startAngle = hinge_side === 'left' ? 0 : Math.PI;
                            const directionMultiplier = hinge_side === 'left' ? 1 : -1;
                            const angleOffset = (Math.PI / 2) * (isInward ? -1 : 1) * directionMultiplier;
                            const endAngle = startAngle + angleOffset;
                            const xStart = hingeX + r * Math.cos(startAngle);
                            const yStart = hingeY + r * Math.sin(startAngle);
                            const xEnd = hingeX + r * Math.cos(endAngle);
                            const yEnd = hingeY + r * Math.sin(endAngle);
                            const sweepFlag = isInward ? (hinge_side === 'left' ? 0 : 1) : (hinge_side === 'left' ? 1 : 0);

                            return (
                                <g key={isInward ? 'in' : 'out'}>
                                    {/* Swing Arc */}
                                    <path
                                        d={`M ${xStart} ${yStart} A ${r} ${r} 0 0 ${sweepFlag} ${xEnd} ${yEnd}`}
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                        className="pointer-events-none opacity-40"
                                    />
                                    {/* Hinge Line - from hinge point to arc end */}
                                    <line
                                        x1={hingeX}
                                        y1={hingeY}
                                        x2={xEnd}
                                        y2={yEnd}
                                        stroke="#3b82f6"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                        className="pointer-events-none opacity-40"
                                    />
                                </g>
                            );
                        };

                        if (swing_direction === 'both') {
                            swingArcs = <>{createArcWithHinge(false)}{createArcWithHinge(true)}</>;
                        } else {
                            swingArcs = createArcWithHinge(false); // out
                        }
                    }

                    return (
                        <g key={`panel-${seg.id}`} onClick={() => onPanelClick?.(seg.id)} onMouseEnter={() => setHoveredPanelId(seg.id)} className="cursor-pointer">
                            {swingArcs}
                            <line x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke="transparent" strokeWidth="60" />
                            <rect
                                x={0}
                                y={-thickness / 2}
                                width={panels[i].width_mm * finalScale}
                                height={thickness}
                                fill={isActive ? '#1d4ed8' : '#3b82f6'}
                                fillOpacity={isActive ? 1 : isHovered ? 0.8 : 0.6}
                                transform={`translate(${seg.x1}, ${seg.y1}) rotate(${angle * 180 / Math.PI})`}
                                className="transition-all duration-300"
                                rx={2}
                            />
                        </g>
                    );
                })}

                {/* 1.5. Notch Visualization Layer */}
                {segments.map((seg, i) => {
                    const panel = panels[i];
                    if (!panel.notches || (!panel.notches.bottom_left && !panel.notches.bottom_right)) {
                        return null;
                    }

                    const angle = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
                    const thickness = 10 * finalScale;
                    const nx = -Math.sin(angle);
                    const ny = Math.cos(angle);
                    const { bottom_left, bottom_right, width_mm, height_mm } = panel.notches;
                    const notchW = width_mm * finalScale;
                    const notchH = height_mm * finalScale;

                    return (
                        <g key={`notches-${seg.id}`} className="pointer-events-none">
                            {/* Left notch */}
                            {bottom_left && (
                                <g>
                                    {/* Notch outline */}
                                    <line
                                        x1={seg.x1}
                                        y1={seg.y1}
                                        x2={seg.x1 + nx * (thickness / 2 + notchH)}
                                        y2={seg.y1 + ny * (thickness / 2 + notchH)}
                                        stroke="#f97316"
                                        strokeWidth="2"
                                        opacity="0.6"
                                    />
                                    <line
                                        x1={seg.x1 + nx * (thickness / 2 + notchH)}
                                        y1={seg.y1 + ny * (thickness / 2 + notchH)}
                                        x2={seg.x1 + notchW * Math.cos(angle) + nx * (thickness / 2 + notchH)}
                                        y2={seg.y1 + notchW * Math.sin(angle) + ny * (thickness / 2 + notchH)}
                                        stroke="#f97316"
                                        strokeWidth="2"
                                        opacity="0.6"
                                    />
                                    <line
                                        x1={seg.x1 + notchW * Math.cos(angle) + nx * (thickness / 2 + notchH)}
                                        y1={seg.y1 + notchW * Math.sin(angle) + ny * (thickness / 2 + notchH)}
                                        x2={seg.x1 + notchW * Math.cos(angle)}
                                        y2={seg.y1 + notchW * Math.sin(angle)}
                                        stroke="#f97316"
                                        strokeWidth="2"
                                        opacity="0.6"
                                    />
                                </g>
                            )}

                            {/* Right notch */}
                            {bottom_right && (
                                <g>
                                    {/* Notch outline */}
                                    <line
                                        x1={seg.x2}
                                        y1={seg.y2}
                                        x2={seg.x2 + nx * (thickness / 2 + notchH)}
                                        y2={seg.y2 + ny * (thickness / 2 + notchH)}
                                        stroke="#f97316"
                                        strokeWidth="2"
                                        opacity="0.6"
                                    />
                                    <line
                                        x1={seg.x2 + nx * (thickness / 2 + notchH)}
                                        y1={seg.y2 + ny * (thickness / 2 + notchH)}
                                        x2={seg.x2 - notchW * Math.cos(angle) + nx * (thickness / 2 + notchH)}
                                        y2={seg.y2 - notchW * Math.sin(angle) + ny * (thickness / 2 + notchH)}
                                        stroke="#f97316"
                                        strokeWidth="2"
                                        opacity="0.6"
                                    />
                                    <line
                                        x1={seg.x2 - notchW * Math.cos(angle) + nx * (thickness / 2 + notchH)}
                                        y1={seg.y2 - notchW * Math.sin(angle) + ny * (thickness / 2 + notchH)}
                                        x2={seg.x2 - notchW * Math.cos(angle)}
                                        y2={seg.y2 - notchW * Math.sin(angle)}
                                        stroke="#f97316"
                                        strokeWidth="2"
                                        opacity="0.6"
                                    />
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* 2. Dimensions Layer (Outside) */}
                {segments.map((seg, i) => {
                    const panel = panels[i];
                    const angle = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
                    const angleDeg = angle * 180 / Math.PI;
                    const shouldFlipText = angleDeg < -90 || angleDeg > 90;

                    // OFFSET DIMENSIONS TO THE OUTSIDE (Entry side / y > 0 area)
                    // For a horizontal panel at y=0, outside is y=40.
                    // Dimension lines are at y=35. Text at y=45.
                    const dimY = 50;

                    return (
                        <g key={`dim-${seg.id}`} transform={`translate(${(seg.x1 + seg.x2) / 2}, ${(seg.y1 + seg.y2) / 2}) rotate(${angleDeg})`}>
                            {/* Dimension Lines */}
                            <line x1={-panel.width_mm * finalScale / 2} y1={dimY} x2={panel.width_mm * finalScale / 2} y2={dimY} stroke="#94a3b8" strokeWidth="1" />
                            <line x1={-panel.width_mm * finalScale / 2} y1={dimY - 3} x2={-panel.width_mm * finalScale / 2} y2={dimY + 3} stroke="#94a3b8" strokeWidth="1" />
                            <line x1={panel.width_mm * finalScale / 2} y1={dimY - 3} x2={panel.width_mm * finalScale / 2} y2={dimY + 3} stroke="#94a3b8" strokeWidth="1" />

                            <g transform={shouldFlipText ? `rotate(180)` : ""} onClick={(e) => { e.stopPropagation(); onPanelClick?.(seg.id); }} className="cursor-pointer">
                                <rect x="-20" y={shouldFlipText ? -dimY - 20 : dimY + 5} width="40" height="20" fill="white" />
                                <text
                                    textAnchor="middle"
                                    dy={shouldFlipText ? -dimY - 5 : dimY + 18}
                                    className={`text-[10px] font-black ${activePanelId === seg.id ? 'fill-blue-700' : 'fill-slate-600'}`}
                                >
                                    {panel.width_mm}
                                </text>
                            </g>
                        </g>
                    );
                })}

                {/* 2.5. Notch Dimensions Layer */}
                {segments.map((seg, i) => {
                    const panel = panels[i];
                    if (!panel.notches || (!panel.notches.bottom_left && !panel.notches.bottom_right)) {
                        return null;
                    }

                    const angle = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
                    const angleDeg = angle * 180 / Math.PI;
                    const shouldFlipText = angleDeg < -90 || angleDeg > 90;
                    const { bottom_left, bottom_right, width_mm, height_mm } = panel.notches;
                    const notchW = width_mm * finalScale;
                    const notchH = height_mm * finalScale;
                    const thickness = 10 * finalScale;
                    const nx = -Math.sin(angle);
                    const ny = Math.cos(angle);

                    const dimY = 110;

                    return (
                        <g key={`notch-dim-${seg.id}`}>
                            {/* Left notch dimensions */}
                            {bottom_left && (
                                <g transform={`translate(${seg.x1 + notchW / 2 * Math.cos(angle)}, ${seg.y1 + notchW / 2 * Math.sin(angle)}) rotate(${angleDeg})`}>
                                    {/* Width dimension */}
                                    <line x1={-notchW / 2} y1={dimY} x2={notchW / 2} y2={dimY} stroke="#f97316" strokeWidth="1" />
                                    <line x1={-notchW / 2} y1={dimY - 3} x2={-notchW / 2} y2={dimY + 3} stroke="#f97316" strokeWidth="1" />
                                    <line x1={notchW / 2} y1={dimY - 3} x2={notchW / 2} y2={dimY + 3} stroke="#f97316" strokeWidth="1" />
                                    <g transform={shouldFlipText ? `rotate(180)` : ""}>
                                        <rect x="-16" y={shouldFlipText ? -dimY - 18 : dimY + 3} width="32" height="16" fill="white" />
                                        <text
                                            textAnchor="middle"
                                            dy={shouldFlipText ? -dimY - 6 : dimY + 14}
                                            className="text-[9px] font-bold fill-orange-500"
                                        >
                                            {width_mm}
                                        </text>
                                    </g>
                                </g>
                            )}

                            {/* Right notch dimensions */}
                            {bottom_right && (
                                <g transform={`translate(${seg.x2 - notchW / 2 * Math.cos(angle)}, ${seg.y2 - notchW / 2 * Math.sin(angle)}) rotate(${angleDeg})`}>
                                    {/* Width dimension */}
                                    <line x1={-notchW / 2} y1={dimY} x2={notchW / 2} y2={dimY} stroke="#f97316" strokeWidth="1" />
                                    <line x1={-notchW / 2} y1={dimY - 3} x2={-notchW / 2} y2={dimY + 3} stroke="#f97316" strokeWidth="1" />
                                    <line x1={notchW / 2} y1={dimY - 3} x2={notchW / 2} y2={dimY + 3} stroke="#f97316" strokeWidth="1" />
                                    <g transform={shouldFlipText ? `rotate(180)` : ""}>
                                        <rect x="-16" y={shouldFlipText ? -dimY - 18 : dimY + 3} width="32" height="16" fill="white" />
                                        <text
                                            textAnchor="middle"
                                            dy={shouldFlipText ? -dimY - 6 : dimY + 14}
                                            className="text-[9px] font-bold fill-orange-500"
                                        >
                                            {width_mm}
                                        </text>
                                    </g>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* 3. Junctions Layer */}
                {junctions.map((j, i) => {
                    if (!segments[i] || !segments[i + 1]) return null;
                    const jX = (i < doorIndex) ? segments[i + 1].x1 : segments[i].x2;
                    const jY = (i < doorIndex) ? segments[i + 1].y1 : segments[i].y2;
                    return (
                        <g key={`j-${i}`} onClick={(e) => {
                            e.stopPropagation();
                            onUpdateJunctionAngle?.(i, j.angle_deg === 90 ? 180 : 90);
                        }} className="cursor-pointer">
                            <circle cx={jX} cy={jY} r="35" fill="transparent" />
                            <circle cx={jX} cy={jY} r="12" fill="white" stroke={j.angle_deg === 90 ? '#3b82f6' : '#cbd5e1'} strokeWidth="3" className="shadow-lg" />
                            <text x={jX} y={jY} dy=".3em" textAnchor="middle" className={`text-[7px] font-black ${j.angle_deg === 90 ? 'fill-blue-600' : 'fill-slate-400'} pointer-events-none uppercase`}>
                                {j.angle_deg}°
                            </text>
                        </g>
                    );
                })}

                {/* 4. Labels Layer (Always Visible, Top Layer) */}
                {segments.map((seg, i) => {
                    const angle = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
                    const angleDeg = angle * 180 / Math.PI;
                    const nx = -Math.sin(angle);
                    const ny = Math.cos(angle);
                    const labelOffset = 15; // Very close to the glass line
                    const shouldFlipText = angleDeg < -90 || angleDeg > 90; // Keep text upright

                    return (
                        <g
                            key={`label-${seg.id}`}
                            transform={`translate(${(seg.x1 + seg.x2) / 2 + nx * labelOffset}, ${(seg.y1 + seg.y2) / 2 + ny * labelOffset}) rotate(${angleDeg})`}
                            onClick={(e) => { e.stopPropagation(); onPanelClick?.(seg.id); }}
                            className="cursor-pointer"
                        >
                            <g transform={shouldFlipText ? `rotate(180)` : ""}>
                                <text textAnchor="middle" dy="4" className={`text-[8px] font-bold ${seg.type === 'door' ? 'fill-blue-600' : 'fill-slate-500'} uppercase tracking-tight`}>
                                    {seg.type === 'door' ? 'Door' : `Panel ${i + 1}`}
                                </text>
                            </g>
                        </g>
                    );
                })}

                {/* 5. Interactive Layer (+ Buttons, Topmost) */}
                {segments.map((seg, i) => {
                    if (hoveredPanelId !== seg.id) return null;
                    const angle = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
                    const nx = -Math.sin(angle);
                    const ny = Math.cos(angle);
                    const plusOffset = 45; // Move away from line and junction

                    return (
                        <g key={`plus-${seg.id}`} className="animate-in fade-in duration-200">
                            <g transform={`translate(${seg.x1 + nx * plusOffset}, ${seg.y1 + ny * plusOffset})`} onClick={(e) => { e.stopPropagation(); onAddLeft?.(i); }} className="cursor-pointer">
                                <circle r="16" fill="#1e293b" className="shadow-xl" />
                                <circle r="14" fill="#3b82f6" />
                                <line x1="-5" y1="0" x2="5" y2="0" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="0" y1="-5" x2="0" y2="5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            </g>
                            <g transform={`translate(${seg.x2 + nx * plusOffset}, ${seg.y2 + ny * plusOffset})`} onClick={(e) => { e.stopPropagation(); onAddRight?.(i); }} className="cursor-pointer">
                                <circle r="16" fill="#1e293b" className="shadow-xl" />
                                <circle r="14" fill="#3b82f6" />
                                <line x1="-5" y1="0" x2="5" y2="0" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="0" y1="-5" x2="0" y2="5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            </g>
                        </g>
                    );
                })}

                {/* 6. Wall Indicators (End caps) */}
                {leftWall && (() => {
                    const angle = leftEdge.angle;
                    const nx = -Math.sin(angle);
                    const ny = Math.cos(angle);
                    const wallLabelOffset = -50; // Opposite side of glass line
                    return (
                        <g transform={`translate(${leftEdge.x}, ${leftEdge.y})`} onClick={(e) => { e.stopPropagation(); onToggleWall?.('left'); }} className="cursor-pointer group">
                            <rect x="-1" y="-30" width="2" height="60" fill="#1e293b" transform={`rotate(${angle * 180 / Math.PI})`} className="group-hover:fill-red-500 transition-colors" />
                            <text x={nx * wallLabelOffset} y={ny * wallLabelOffset} textAnchor="middle" dominantBaseline="middle" className="text-[7.5px] font-black fill-slate-400 uppercase tracking-widest group-hover:fill-slate-900 transition-colors">Wall</text>
                        </g>
                    );
                })()}
                {rightWall && (() => {
                    const angle = rightEdge.angle;
                    const nx = -Math.sin(angle);
                    const ny = Math.cos(angle);
                    const wallLabelOffset = -50; // Opposite side of glass line
                    return (
                        <g transform={`translate(${rightEdge.x}, ${rightEdge.y})`} onClick={(e) => { e.stopPropagation(); onToggleWall?.('right'); }} className="cursor-pointer group">
                            <rect x="-1" y="-30" width="2" height="60" fill="#1e293b" transform={`rotate(${angle * 180 / Math.PI})`} className="group-hover:fill-red-500 transition-colors" />
                            <text x={nx * wallLabelOffset} y={ny * wallLabelOffset} textAnchor="middle" dominantBaseline="middle" className="text-[7.5px] font-black fill-slate-400 uppercase tracking-widest group-hover:fill-slate-900 transition-colors">Wall</text>
                        </g>
                    );
                })()}
                    </g>
                </svg>
            ) : (
                <ExplodedPanelView
                    panels={explodedViewData.panels}
                    junctions={explodedViewData.junctions}
                    activePanelId={activePanelId || null}
                    activeJunctionId={null}
                    onPanelSelect={(id) => onPanelClick?.(id)}
                    onJunctionSelect={() => {}}
                    onAddPanel={() => {}}
                    onDeletePanel={() => {}}
                    onUpdateJunctionAngle={() => {}}
                    onUpdatePanelType={() => {}}
                />
            )}
        </div>
    );
}
