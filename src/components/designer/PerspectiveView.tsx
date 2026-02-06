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

    // Helper: interpolate between two 3D points along the panel at a fraction t (0=start, 1=end)
    const lerp3D = (x1: number, z1: number, x2: number, z2: number, t: number) => ({
        x: x1 + (x2 - x1) * t,
        z: z1 + (z2 - z1) * t
    });

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

                        // Per-panel top edge / slope
                        const topEdge = panel.top_edge;
                        const notches = panel.notches;

                        // Calculate top heights for each side
                        let yTopLeft = panelHeight;
                        let yTopRight = panelHeight;
                        if (topEdge?.type === 'sloped' && topEdge.drop_mm) {
                            if (topEdge.direction === 'left') {
                                yTopLeft = panelHeight - topEdge.drop_mm;
                            } else {
                                yTopRight = panelHeight - topEdge.drop_mm;
                            }
                        }

                        // Project 4 corners with slope support
                        const bl = project(x1, 0, z1);
                        const br = project(x2, 0, z2);
                        const tl = project(x1, yTopLeft, z1);
                        const tr = project(x2, yTopRight, z2);

                        // Build glass path with notches
                        let glassPath: string;
                        const notchWmm = notches?.width_mm || 50;
                        const notchHmm = notches?.height_mm || 50;

                        if (notches?.bottom_left && notches?.bottom_right) {
                            // Both bottom notches
                            const tNotchW = notchWmm / panel.width_mm;
                            const nlInner = lerp3D(x1, z1, x2, z2, tNotchW);
                            const nrInner = lerp3D(x1, z1, x2, z2, 1 - tNotchW);
                            const pNlBot = project(x1, 0, z1);
                            const pNlStep = project(x1, notchHmm, z1);
                            const pNlInnerStep = project(nlInner.x, notchHmm, nlInner.z);
                            const pNlInnerBot = project(nlInner.x, 0, nlInner.z);
                            const pNrInnerBot = project(nrInner.x, 0, nrInner.z);
                            const pNrInnerStep = project(nrInner.x, notchHmm, nrInner.z);
                            const pNrStep = project(x2, notchHmm, z2);
                            const pNrBot = project(x2, 0, z2);
                            glassPath = `M ${pNlStep.x} ${pNlStep.y} L ${pNlInnerStep.x} ${pNlInnerStep.y} L ${pNlInnerBot.x} ${pNlInnerBot.y} L ${pNrInnerBot.x} ${pNrInnerBot.y} L ${pNrInnerStep.x} ${pNrInnerStep.y} L ${pNrStep.x} ${pNrStep.y} L ${tr.x} ${tr.y} L ${tl.x} ${tl.y} Z`;
                        } else if (notches?.bottom_left) {
                            const tNotchW = notchWmm / panel.width_mm;
                            const nlInner = lerp3D(x1, z1, x2, z2, tNotchW);
                            const pNlStep = project(x1, notchHmm, z1);
                            const pNlInnerStep = project(nlInner.x, notchHmm, nlInner.z);
                            const pNlInnerBot = project(nlInner.x, 0, nlInner.z);
                            glassPath = `M ${pNlStep.x} ${pNlStep.y} L ${pNlInnerStep.x} ${pNlInnerStep.y} L ${pNlInnerBot.x} ${pNlInnerBot.y} L ${br.x} ${br.y} L ${tr.x} ${tr.y} L ${tl.x} ${tl.y} Z`;
                        } else if (notches?.bottom_right) {
                            const tNotchW = notchWmm / panel.width_mm;
                            const nrInner = lerp3D(x1, z1, x2, z2, 1 - tNotchW);
                            const pNrInnerBot = project(nrInner.x, 0, nrInner.z);
                            const pNrInnerStep = project(nrInner.x, notchHmm, nrInner.z);
                            const pNrStep = project(x2, notchHmm, z2);
                            glassPath = `M ${bl.x} ${bl.y} L ${pNrInnerBot.x} ${pNrInnerBot.y} L ${pNrInnerStep.x} ${pNrInnerStep.y} L ${pNrStep.x} ${pNrStep.y} L ${tr.x} ${tr.y} L ${tl.x} ${tl.y} Z`;
                        } else {
                            glassPath = `M ${bl.x} ${bl.y} L ${br.x} ${br.y} L ${tr.x} ${tr.y} L ${tl.x} ${tl.y} Z`;
                        }

                        return (
                            <g key={panel.id} onClick={() => onPanelClick?.(panel.id)} className="cursor-pointer group">
                                {/* Selection indicator */}
                                {isActive && (
                                    <path d={glassPath} fill="none" stroke="#1d4ed8" strokeWidth="6" strokeDasharray="20 20" className="animate-pulse" />
                                )}

                                {/* Glass panel */}
                                <path
                                    d={glassPath}
                                    fill="#A8C7DC"
                                    fillOpacity="0.55"
                                    stroke="#4A7A9E"
                                    strokeWidth="2"
                                    className="transition-all duration-300 group-hover:fill-opacity-70"
                                />

                                {/* Door hardware - Hinges and Handle (rotated with glass) */}
                                {isDoor && (() => {
                                    const hingeSide = panel.door_properties?.hinge_side || 'left';
                                    const handleSide = hingeSide === 'left' ? 'right' : 'left';
                                    const hingeOffset = Math.round(panelHeight * 0.14);

                                    // Hinge positions along the hinge edge
                                    const hx1 = hingeSide === 'left' ? x1 : x2;
                                    const hz1 = hingeSide === 'left' ? z1 : z2;
                                    // Handle positions along the handle edge
                                    const handleX = handleSide === 'left' ? x1 : x2;
                                    const handleZ = handleSide === 'left' ? z1 : z2;

                                    // Panel direction vector (for drawing oriented rectangles)
                                    const pdx = x2 - x1;
                                    const pdz = z2 - z1;
                                    const pLen = Math.sqrt(pdx * pdx + pdz * pdz);
                                    const pnx = pdx / pLen; // normalised panel direction
                                    const pnz = pdz / pLen;

                                    // Hinge dimensions in mm
                                    const hingeW = 60;
                                    const hingeH = 90;

                                    // For wall-mount: hinge edge aligns with glass edge
                                    // The hinge extends inward (towards panel centre) from the edge
                                    const hingeInwardX = hingeSide === 'left' ? pnx : -pnx;
                                    const hingeInwardZ = hingeSide === 'left' ? pnz : -pnz;

                                    return (
                                        <>
                                            {/* Hinges - 2 positions, oriented with glass */}
                                            {[hingeOffset, panelHeight - hingeOffset].map((yPos, i) => {
                                                // Four corners of the hinge rectangle, attached to glass edge
                                                const c1 = project(hx1, yPos - hingeH / 2, hz1);
                                                const c2 = project(hx1 + hingeInwardX * hingeW, yPos - hingeH / 2, hz1 + hingeInwardZ * hingeW);
                                                const c3 = project(hx1 + hingeInwardX * hingeW, yPos + hingeH / 2, hz1 + hingeInwardZ * hingeW);
                                                const c4 = project(hx1, yPos + hingeH / 2, hz1);
                                                return (
                                                    <g key={`hinge-${i}`}>
                                                        <path
                                                            d={`M ${c1.x} ${c1.y} L ${c2.x} ${c2.y} L ${c3.x} ${c3.y} L ${c4.x} ${c4.y} Z`}
                                                            fill={colors.fill}
                                                            stroke={colors.stroke}
                                                            strokeWidth="2"
                                                        />
                                                        {/* Hinge pin */}
                                                        {(() => {
                                                            const pin = project(hx1, yPos, hz1);
                                                            return <circle cx={pin.x} cy={pin.y} r="4" fill={colors.highlight} stroke={colors.stroke} strokeWidth="1" />;
                                                        })()}
                                                    </g>
                                                );
                                            })}

                                            {/* Handle - 75mm from centre, 200mm long, oriented with glass */}
                                            {(() => {
                                                const handleLengthMm = 200;
                                                const handleOffsetMm = 75;
                                                const handleWidthMm = 20;
                                                const midY = panelHeight / 2;

                                                // Offset inward from handle edge
                                                const inwardX = handleSide === 'left' ? pnx : -pnx;
                                                const inwardZ = handleSide === 'left' ? pnz : -pnz;
                                                const hBaseX = handleX + inwardX * handleOffsetMm;
                                                const hBaseZ = handleZ + inwardZ * handleOffsetMm;

                                                const c1 = project(hBaseX, midY - handleLengthMm / 2, hBaseZ);
                                                const c2 = project(hBaseX + inwardX * handleWidthMm, midY - handleLengthMm / 2, hBaseZ + inwardZ * handleWidthMm);
                                                const c3 = project(hBaseX + inwardX * handleWidthMm, midY + handleLengthMm / 2, hBaseZ + inwardZ * handleWidthMm);
                                                const c4 = project(hBaseX, midY + handleLengthMm / 2, hBaseZ);

                                                return (
                                                    <>
                                                        <path
                                                            d={`M ${c1.x} ${c1.y} L ${c2.x} ${c2.y} L ${c3.x} ${c3.y} L ${c4.x} ${c4.y} Z`}
                                                            fill={colors.fill}
                                                            stroke={colors.stroke}
                                                            strokeWidth="1"
                                                            strokeLinejoin="round"
                                                        />
                                                        {/* Highlight stripe */}
                                                        {(() => {
                                                            const h1 = project(hBaseX, midY - handleLengthMm / 2 + 10, hBaseZ);
                                                            const h2 = project(hBaseX, midY + handleLengthMm / 2 - 10, hBaseZ);
                                                            return (
                                                                <line
                                                                    x1={h1.x} y1={h1.y} x2={h2.x} y2={h2.y}
                                                                    stroke={colors.highlight}
                                                                    strokeWidth="3"
                                                                    opacity="0.6"
                                                                    strokeLinecap="round"
                                                                />
                                                            );
                                                        })()}
                                                    </>
                                                );
                                            })()}
                                        </>
                                    );
                                })()}

                                {/* Channel Indicators (follows glass shape including slope) */}
                                {mountingType === 'channel' && !isDoor && (
                                    <g opacity="1">
                                        {/* Bottom Channel (19mm deep) */}
                                        {(() => {
                                            const channelDepth = 19;
                                            // Use notch-aware bottom edge
                                            let bL = bl, bR = br;
                                            if (notches?.bottom_left) {
                                                bL = project(x1, notchHmm, z1);
                                            }
                                            if (notches?.bottom_right) {
                                                bR = project(x2, notchHmm, z2);
                                            }
                                            const p1_top = project(x1, channelDepth + (notches?.bottom_left ? notchHmm : 0), z1);
                                            const p2_top = project(x2, channelDepth + (notches?.bottom_right ? notchHmm : 0), z2);
                                            return (
                                                <path
                                                    d={`M ${bL.x} ${bL.y} L ${bR.x} ${bR.y} L ${p2_top.x} ${p2_top.y} L ${p1_top.x} ${p1_top.y} Z`}
                                                    fill={colors.fill}
                                                    stroke={colors.stroke}
                                                    strokeWidth="1.5"
                                                />
                                            );
                                        })()}

                                        {/* Top Channel (follows slope) */}
                                        {(() => {
                                            const channelDepth = 19;
                                            const p1_inner = project(x1, yTopLeft - channelDepth, z1);
                                            const p2_inner = project(x2, yTopRight - channelDepth, z2);
                                            return (
                                                <path
                                                    d={`M ${tl.x} ${tl.y} L ${tr.x} ${tr.y} L ${p2_inner.x} ${p2_inner.y} L ${p1_inner.x} ${p1_inner.y} Z`}
                                                    fill={colors.fill}
                                                    stroke={colors.stroke}
                                                    strokeWidth="1.5"
                                                />
                                            );
                                        })()}

                                        {/* Wall Channels (if first or last panel) */}
                                        {idx === 0 && (
                                            (() => {
                                                const channelDepth = 19;
                                                // Wall channel on left edge, from bottom to top (following slope)
                                                const innerBot = lerp3D(x1, z1, x2, z2, channelDepth / panel.width_mm);
                                                const p1 = project(x1, 0, z1);
                                                const p2 = project(x1, yTopLeft, z1);
                                                const p3 = project(innerBot.x, yTopLeft, innerBot.z);
                                                const p4 = project(innerBot.x, 0, innerBot.z);
                                                return (
                                                    <path
                                                        d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
                                                        fill={colors.fill}
                                                        stroke={colors.stroke}
                                                        strokeWidth="1.5"
                                                    />
                                                );
                                            })()
                                        )}
                                        {idx === rawSegments.length - 1 && (
                                            (() => {
                                                const channelDepth = 19;
                                                const innerBot = lerp3D(x1, z1, x2, z2, 1 - channelDepth / panel.width_mm);
                                                const p1 = project(x2, 0, z2);
                                                const p2 = project(x2, yTopRight, z2);
                                                const p3 = project(innerBot.x, yTopRight, innerBot.z);
                                                const p4 = project(innerBot.x, 0, innerBot.z);
                                                return (
                                                    <path
                                                        d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
                                                        fill={colors.fill}
                                                        stroke={colors.stroke}
                                                        strokeWidth="1.5"
                                                    />
                                                );
                                            })()
                                        )}
                                    </g>
                                )}

                                {/* Fixed panel hardware - Clamps */}
                                {mountingType === 'clamps' && !isDoor && (
                                    <>
                                        {/* Top centre clamp */}
                                        {(() => {
                                            const mid = lerp3D(x1, z1, x2, z2, 0.5);
                                            const p3d = project(mid.x, yTopLeft + (yTopRight - yTopLeft) * 0.5, mid.z);
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
                                        {/* Bottom centre clamp */}
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
