/**
 * Glass Fabrication Diagram Component
 * Renders an SVG diagram for a single glass panel for fabrication
 */

import React from 'react';
import { PanelModel, calculateGlassWeight } from '@/types/square';
import {
    calculatePanelDeductions,
    calculateHingePlacement,
    selectHingeForDoor,
    HANDLE_HOLE_SPACING_MM,
    HANDLE_BOTTOM_TARGET_MM
} from '@/lib/showerCalculations';

interface GlassFabricationDiagramProps {
    panel: PanelModel;
    workId?: string;
    customerName?: string;
    date?: string;
    glassType?: string;
    quantity?: number;
    isFloorToCeiling?: boolean;
    showHeader?: boolean;
    // Rakes and Notches from state
    floorRake?: { amount: number; direction: 'left' | 'right' };
    wallRake?: { amount: number; direction: 'in' | 'out' };
    ceilingRake?: { left_height_mm: number; right_height_mm: number };
    notches?: Array<{ corner: string; widthMm: number; heightMm: number }>;
}

export const GlassFabricationDiagram: React.FC<GlassFabricationDiagramProps> = ({
    panel,
    workId = 'WK-7697',
    customerName = 'Niklas Carlen',
    date = new Date().toLocaleDateString(),
    glassType = '10MM TOUGHENED',
    quantity = 1,
    isFloorToCeiling = false,
    showHeader = true,
    floorRake,
    wallRake,
    ceilingRake,
    notches = []
}) => {
    // Calculate base dimensions with deductions
    const tightWidth = panel.width_mm || 600;
    const tightHeight = panel.height_mm || 2000;

    // Use deductions logic to get cutting size
    const deductions = calculatePanelDeductions(
        tightWidth,
        tightHeight,
        panel,
        isFloorToCeiling
    );

    let cutWidthTop = deductions.cutWidth;
    let cutWidthBottom = deductions.cutWidth;
    let cutHeightLeft = deductions.cutHeight;
    let cutHeightRight = deductions.cutHeight;

    // Apply Floor Rake
    if (floorRake && floorRake.amount > 0) {
        if (floorRake.direction === 'right') {
            // Lower on right means right height is greater
            cutHeightRight += floorRake.amount;
        } else {
            // Lower on left means left height is greater
            cutHeightLeft += floorRake.amount;
        }
    }

    // Apply Wall Rake (on the wall-fixed side)
    if (wallRake && wallRake.amount > 0) {
        if (panel.wall_fix.left) {
            if (wallRake.direction === 'out') {
                // Leaning out means top is wider
                cutWidthTop += wallRake.amount;
            } else {
                // Leaning in means bottom is wider
                cutWidthBottom += wallRake.amount;
            }
        } else if (panel.wall_fix.right) {
            if (wallRake.direction === 'out') {
                // Leaning out means top is wider
                cutWidthTop += wallRake.amount;
            } else {
                // Leaning in means bottom is wider
                cutWidthBottom += wallRake.amount;
            }
        }
    }

    // Weight calculation
    const weight = calculateGlassWeight(deductions.cutWidth, deductions.cutHeight, panel.width_mm === 8 ? 8 : 10);

    // SVG Config
    const svgWidth = 800; // Larger for clarity
    const svgHeight = 1100;
    const margin = { top: 150, right: 100, bottom: 100, left: 100 };

    const drawWidth = svgWidth - margin.left - margin.right;
    const drawHeight = svgHeight - margin.top - margin.bottom;

    const maxW = Math.max(cutWidthTop, cutWidthBottom);
    const maxH = Math.max(cutHeightLeft, cutHeightRight);

    const scale = Math.min(drawWidth / maxW, drawHeight / maxH) * 0.8;

    const panelDrawW_T = cutWidthTop * scale;
    const panelDrawW_B = cutWidthBottom * scale;
    const panelDrawH_L = cutHeightLeft * scale;
    const panelDrawH_R = cutHeightRight * scale;

    const centerX = margin.left + drawWidth / 2;
    const centerY = margin.top + drawHeight / 2;

    // Corner coordinates (0,0 is top-left of the drawing area for each panel)
    // We adjust X/Y to center the panel
    const xLT = centerX - panelDrawW_T / 2;
    const xRT = centerX + panelDrawW_T / 2;
    const xLB = centerX - panelDrawW_B / 2;
    const xRB = centerX + panelDrawW_B / 2;

    const yLT = centerY - maxH * scale / 2 + (maxH - cutHeightLeft) * scale;
    const yLB = centerY + maxH * scale / 2;
    const yRT = centerY - maxH * scale / 2 + (maxH - cutHeightRight) * scale;
    const yRB = centerY + maxH * scale / 2;

    // Hinge placement
    const hingePlacement = panel.panel_type === 'door_hinged' ? calculateHingePlacement(deductions.cutHeight) : null;

    return (
        <div className="w-full bg-white border border-slate-200">
            <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                {/* Background */}
                <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="white" />

                {/* Title Block */}
                <g transform="translate(50, 40)">
                    <text x="0" y="0" fontSize="14" fontWeight="900" textAnchor="start">Work ID: {workId}</text>
                    <text x="0" y="20" fontSize="14" fontWeight="600">Customer: {customerName}</text>
                    <text x="0" y="40" fontSize="14" fontWeight="600">Date: {date}</text>

                    <text x={svgWidth - 100} y="0" fontSize="14" fontWeight="900" textAnchor="end">Description: {glassType}</text>
                    <text x={svgWidth - 100} y="20" fontSize="14" fontWeight="600" textAnchor="end">Panel Ref: {panel.panel_id} – {panel.panel_type === 'door_hinged' ? 'Door' : 'Fixed'}</text>
                    <text x={svgWidth - 100} y="40" fontSize="14" fontWeight="600" textAnchor="end">Quantity: {quantity}</text>
                    <text x={svgWidth - 100} y="60" fontSize="14" fontWeight="600" textAnchor="end">Finished Size: {Math.round(maxW)} x {Math.round(maxH)}</text>
                    <text x={svgWidth - 100} y="80" fontSize="14" fontWeight="600" textAnchor="end">Approx Weight: {weight}kg</text>

                    <line x1="0" y1="95" x2={svgWidth - 100} y2="95" stroke="black" strokeWidth="2" />
                </g>

                {/* Glass Panel Outline */}
                <path
                    d={`M ${xLT} ${yLT} L ${xRT} ${yRT} L ${xRB} ${yRB} L ${xLB} ${yLB} Z`}
                    fill="none"
                    stroke="black"
                    strokeWidth="2.5"
                />

                {/* Rake indicators */}
                {floorRake && floorRake.amount > 0 && (
                    <g>
                        <line
                            x1={xLB} y1={yLB - floorRake.amount * scale}
                            x2={xRB} y2={yRB - (floorRake.direction === 'right' ? 0 : floorRake.amount) * scale}
                            stroke="black" strokeWidth="1" strokeDasharray="5,5"
                        />
                        <text
                            x={(xLB + xRB) / 2} y={yLB + 30}
                            textAnchor="middle" fontSize="12" fontWeight="bold"
                        >
                            FALL: {floorRake.amount}mm {floorRake.direction === 'right' ? '→' : '←'}
                        </text>
                    </g>
                )}

                {wallRake && wallRake.amount > 0 && (panel.wall_fix.left || panel.wall_fix.right) && (
                    <g>
                        {/* Show dashed vertical line to indicate rake */}
                        {panel.wall_fix.left && (
                            <line x1={xLB} y1={yLB} x2={xLB} y2={yLT} stroke="black" strokeWidth="1" strokeDasharray="5,2" />
                        )}
                        {panel.wall_fix.right && (
                            <line x1={xRB} y1={yRB} x2={xRB} y2={yRT} stroke="black" strokeWidth="1" strokeDasharray="5,2" />
                        )}
                        <text
                            x={panel.wall_fix.left ? xLB - 60 : xRB + 60}
                            y={(yLT + yLB) / 2}
                            textAnchor="middle" fontSize="10" fontWeight="bold"
                            transform={`rotate(${panel.wall_fix.left ? -90 : 90}, ${panel.wall_fix.left ? xLB - 60 : xRB + 60}, ${(yLT + yLB) / 2})`}
                        >
                            WALL RAKE: {wallRake.amount}mm {wallRake.direction.toUpperCase()}
                        </text>
                    </g>
                )}

                {/* Glass Panel Path including NOTCHES */}
                {(() => {
                    // Logic for notches: we modify the simple 4-corner path
                    // This is a simplified version - assumes bottom notches only as per PanelModel
                    const hasBL = panel.notches.bottom_left;
                    const hasBR = panel.notches.bottom_right;
                    const nw = 50 * scale; // Default notch size if not provided
                    const nh = 50 * scale;

                    let d = `M ${xLT} ${yLT} L ${xRT} ${yRT} `;

                    if (hasBR) {
                        d += `L ${xRB} ${yRB - nh} L ${xRB - nw} ${yRB - nh} L ${xRB - nw} ${yRB} `;
                    } else {
                        d += `L ${xRB} ${yRB} `;
                    }

                    if (hasBL) {
                        d += `L ${xLB + nw} ${yLB} L ${xLB + nw} ${yLB - nh} L ${xLB} ${yLB - nh} `;
                    } else {
                        d += `L ${xLB} ${yLB} `;
                    }

                    d += 'Z';

                    return (
                        <path
                            d={d}
                            fill="none"
                            stroke="black"
                            strokeWidth="2.5"
                        />
                    );
                })()}

                {/* Notch Dimensions */}
                {(panel.notches.bottom_left || panel.notches.bottom_right) && (
                    <g>
                        {panel.notches.bottom_left && (
                            <text x={xLB + 25 * scale} y={yLB - 60 * scale} fontSize="10" fontWeight="bold" textAnchor="middle">NOTCH 50x50</text>
                        )}
                        {panel.notches.bottom_right && (
                            <text x={xRB - 25 * scale} y={yRB - 60 * scale} fontSize="10" fontWeight="bold" textAnchor="middle">NOTCH 50x50</text>
                        )}
                    </g>
                )}

                {/* Dimension Lines - Width (Overall) */}
                <g>
                    {/* Top Width */}
                    <line x1={xLT} y1={yLT - 40} x2={xRT} y2={yRT - 40} stroke="black" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                    <line x1={xLT} y1={yLT - 50} x2={xLT} y2={yLT - 5} stroke="black" strokeWidth="0.5" />
                    <line x1={xRT} y1={yRT - 50} x2={xRT} y2={yRT - 5} stroke="black" strokeWidth="0.5" />
                    <rect x={(xLT + xRT) / 2 - 25} y={yLT - 52} width="50" height="20" fill="white" />
                    <text x={(xLT + xRT) / 2} y={yLT - 38} textAnchor="middle" fontSize="12" fontWeight="bold">{Math.round(cutWidthTop)}</text>

                    {/* Bottom Width (if different) */}
                    {Math.abs(cutWidthTop - cutWidthBottom) > 0.5 && (
                        <g>
                            <line x1={xLB} y1={yLB + 40} x2={xRB} y2={yRB + 40} stroke="black" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                            <line x1={xLB} y1={yLB + 5} x2={xLB} y2={yLB + 50} stroke="black" strokeWidth="0.5" />
                            <line x1={xRB} y1={yRB + 5} x2={xRB} y2={yRB + 50} stroke="black" strokeWidth="0.5" />
                            <rect x={(xLB + xRB) / 2 - 25} y={yLB + 28} width="50" height="20" fill="white" />
                            <text x={(xLB + xRB) / 2} y={yLB + 42} textAnchor="middle" fontSize="12" fontWeight="bold">{Math.round(cutWidthBottom)}</text>
                        </g>
                    )}
                </g>

                {/* Dimension Lines - Height */}
                <g>
                    {/* Left Height */}
                    <line x1={xLB - 40} y1={yLB} x2={xLB - 40} y2={yLT} stroke="black" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                    <line x1={xLB - 50} y1={yLB} x2={xLB - 5} y2={yLB} stroke="black" strokeWidth="0.5" />
                    <line x1={xLB - 50} y1={yLT} x2={xLB - 5} y2={yLT} stroke="black" strokeWidth="0.5" />
                    <text
                        x={xLB - 45} y={(yLT + yLB) / 2}
                        textAnchor="middle" fontSize="12" fontWeight="bold"
                        transform={`rotate(-90, ${xLB - 45}, ${(yLT + yLB) / 2})`}
                    >
                        {Math.round(cutHeightLeft)}
                    </text>

                    {/* Right Height (if different) */}
                    {Math.abs(cutHeightLeft - cutHeightRight) > 0.5 && (
                        <g>
                            <line x1={xRB + 40} y1={yRB} x2={xRB + 40} y2={yRT} stroke="black" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                            <line x1={xRB + 5} y1={yRB} x2={xRB + 50} y2={yRB} stroke="black" strokeWidth="0.5" />
                            <line x1={xRB + 5} y1={yRT} x2={xRB + 50} y2={yRT} stroke="black" strokeWidth="0.5" />
                            <text
                                x={xRB + 45} y={(yRT + yRB) / 2}
                                textAnchor="middle" fontSize="12" fontWeight="bold"
                                transform={`rotate(90, ${xRB + 45}, ${(yRT + yRB) / 2})`}
                            >
                                {Math.round(cutHeightRight)}
                            </text>
                        </g>
                    )}
                </g>

                {/* Hinge Cutouts */}
                {hingePlacement && (
                    <g>
                        {[
                            { offset: hingePlacement.bottomHingeOffset, label: 'H1', from: 'bottom' },
                            { offset: deductions.cutHeight - hingePlacement.topHingeOffset, label: 'H2', from: 'bottom' }
                        ].map((h, i) => {
                            const isH1 = h.label === 'H1';
                            const y = yLB - h.offset * scale;
                            const x = panel.hinge_side === 'left' ? xLB : xRB;

                            return (
                                <g key={i}>
                                    {/* Hinge marker - Simple rectangle for cut-out */}
                                    <rect
                                        x={panel.hinge_side === 'left' ? x : x - 30 * scale}
                                        y={y - 15 * scale}
                                        width={30 * scale}
                                        height={30 * scale}
                                        fill="none"
                                        stroke="black"
                                        strokeWidth="1"
                                    />
                                    {/* Dimension line for hinge center */}
                                    <line x1={x} y1={y} x2={panel.hinge_side === 'left' ? x - 60 : x + 60} y2={y} stroke="black" strokeWidth="1" strokeDasharray="2,2" />
                                    <text
                                        x={panel.hinge_side === 'left' ? x - 65 : x + 65}
                                        y={y + 4}
                                        fontSize="10"
                                        fontWeight="black"
                                        textAnchor={panel.hinge_side === 'left' ? 'end' : 'start'}
                                    >
                                        {isH1 ? h.offset : Math.round(deductions.cutHeight - h.offset)} ⌀13
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* Handle Holes */}
                {panel.handle_side && (
                    <g>
                        {[
                            { y: 850, label: 'Handle Bottom' },
                            { y: 850 + 203, label: 'Handle Top' }
                        ].map((h, i) => {
                            const y = yLB - h.y * scale;
                            const x = panel.handle_side === 'left' ? xLB + 75 * scale : xRB - 75 * scale;

                            return (
                                <g key={i}>
                                    {/* Hole center crosshair */}
                                    <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke="black" strokeWidth="0.5" />
                                    <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke="black" strokeWidth="0.5" />
                                    <circle cx={x} cy={y} r={3} fill="black" />

                                    {/* Dimension to center */}
                                    {i === 0 && (
                                        <g>
                                            <line x1={x} y1={y} x2={x} y2={yLB + 20} stroke="black" strokeWidth="0.5" strokeDasharray="2,2" />
                                            <text x={x} y={yLB + 35} textAnchor="middle" fontSize="10" fontWeight="bold">{h.y}</text>
                                            <line x1={x} y1={y} x2={panel.handle_side === 'left' ? xLB : xRB} y2={y} stroke="black" strokeWidth="0.5" strokeDasharray="2,2" />
                                            <text x={x + (panel.handle_side === 'left' ? -20 : 20)} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="bold">75 ⌀13</text>
                                        </g>
                                    )}
                                    {i === 1 && (
                                        <text x={x + (panel.handle_side === 'left' ? 15 : -15)} y={y + 4} textAnchor={panel.handle_side === 'left' ? 'start' : 'end'} fontSize="10" fontWeight="bold">203 C/C</text>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* FP and TGS marks */}
                <text x={centerX} y={yLT - 70} textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="2">FP (FLAT POLISH)</text>
                <text x={centerX} y={yLB + 80} textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="2">FP (FLAT POLISH)</text>

                <g transform={`translate(${xLB + 40}, ${yLB - 40})`}>
                    <rect x="-15" y="-10" width="30" height="20" fill="none" stroke="black" strokeWidth="1" />
                    <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="black">TGS</text>
                </g>

                {/* Defs for Arrows */}
                <defs>
                    <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
                    </marker>
                </defs>
            </svg>
        </div>
    );
};
