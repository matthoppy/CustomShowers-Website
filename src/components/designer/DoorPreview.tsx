import React from 'react';
import type { DoorState, DoorOverlay } from '@/types/door';
import { PanelDoor } from './PanelDoor';
import { Hinge } from './Hinge';
import { Handle } from './Handle';

interface DoorPreviewProps {
    state: DoorState;
    overlays: DoorOverlay[];
    width?: number;
    height?: number;
    onMeasurementClick?: (id: string) => void;
}

export const DoorPreview: React.FC<DoorPreviewProps> = ({
    state,
    overlays,
    width = 400,
    height = 500,
    onMeasurementClick
}) => {
    const { door_type, hardware_finish, derived } = state;

    // Scaling logic (Reference: 2000mm height -> 400px height)
    const baseScale = 0.2; // Slightly larger scale
    const h_mm = Math.max(derived.height_left_mm || 0, derived.height_right_mm || 0) || 2000;
    const w_mm = Math.max(derived.opening_width_bottom_mm || 0, derived.opening_width_top_mm || 0) || 600;

    const doorHeight = Math.max(200, Math.min(450, h_mm * baseScale));
    const doorWidth = Math.max(100, Math.min(350, w_mm * baseScale));

    const startX = (width - doorWidth) / 2;
    const startY = (height - doorHeight) / 2;

    // Hardware color mapping
    const hardwareColors: Record<string, string> = {
        chrome: '#A8A8A8',
        black: '#1A1A1A',
        brushed_nickel: '#8E8E8E',
        brass: '#C5A059',
        other: '#666666'
    };
    const hardwareColor = hardwareColors[hardware_finish] || hardwareColors.chrome;

    const renderLaserOverlays = () => {
        return overlays.map((overlay, index) => {
            const { type, meta } = overlay;
            const isHighlighted = type === 'highlight_field';

            if (type === 'laser_crosshair') {
                const v_laser_x = meta.x_offset || doorWidth / 2;
                const h_laser_y = meta.y_offset || doorHeight / 2;

                return (
                    <g key={`laser-${index}`}>
                        {/* Vertical Laser - Clipped to glass height */}
                        <line
                            x1={startX + v_laser_x} y1={startY}
                            x2={startX + v_laser_x} y2={startY + doorHeight}
                            stroke="red" strokeWidth="1" strokeDasharray="3,3"
                            opacity="0.8"
                        />
                        {/* Horizontal Laser - Clipped to glass width */}
                        <line
                            x1={startX} y1={startY + h_laser_y}
                            x2={startX + doorWidth} y2={startY + h_laser_y}
                            stroke="red" strokeWidth="1" strokeDasharray="3,3"
                            opacity="0.8"
                        />
                    </g>
                );
            }

            if (type === 'laser_dimension_red') {
                const { x, y, value, id, label } = meta;
                const active = state.measurements[id as keyof typeof state.measurements] !== undefined;

                return (
                    <g
                        key={`dim-red-${index}`}
                        transform={`translate(${startX + x}, ${startY + y})`}
                        className="cursor-pointer group"
                        onClick={() => onMeasurementClick?.(id)}
                    >
                        {/* Measurement box */}
                        <rect
                            x={-22} y={-11} width={44} height={22}
                            fill={active ? "white" : "#FFF5F5"}
                            stroke="red"
                            strokeWidth={isHighlighted ? 2.5 : 1}
                            rx={4}
                            className={`${isHighlighted ? 'animate-pulse' : 'group-hover:stroke-[2px]'}`}
                        />
                        <text
                            x={0} y={0} textAnchor="middle" dominantBaseline="central"
                            fontSize="11" fontWeight="bold" fill="red"
                        >
                            {value || label || id[0].toUpperCase()}
                        </text>
                        {label && (
                            <text x={0} y={-18} textAnchor="middle" fontSize="9" fill="red" fontWeight="black" className="uppercase">
                                {label}
                            </text>
                        )}
                    </g>
                );
            }

            if (type === 'total_dimension_blue') {
                const { x, y, value, orientation } = meta;
                const isVertical = orientation === 'vertical';

                return (
                    <g
                        key={`dim-blue-${index}`}
                        transform={`translate(${startX + x}, ${startY + y})`}
                    >
                        {/* Dimension Lines */}
                        {isVertical ? (
                            <g transform="translate(0, 0)">
                                {/* Vertical line */}
                                <line x1="40" y1={-doorHeight / 2} x2="40" y2={doorHeight / 2} stroke="#3b82f6" strokeWidth="1.5" />
                                {/* Bottom extension */}
                                <line x1="40" y1={doorHeight / 2} x2={-x + 2} y2={doorHeight / 2} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                                {/* Top extension */}
                                <line x1="40" y1={-doorHeight / 2} x2={-x + 2} y2={-doorHeight / 2} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                                {/* Ticks */}
                                <line x1="35" y1={-doorHeight / 2} x2="45" y2={-doorHeight / 2} stroke="#3b82f6" strokeWidth="2" />
                                <line x1="35" y1={doorHeight / 2} x2="45" y2={doorHeight / 2} stroke="#3b82f6" strokeWidth="2" />
                            </g>
                        ) : (
                            <g transform="translate(0, 0)">
                                {/* Horizontal line */}
                                <line x1={-doorWidth / 2} y1="-30" x2={doorWidth / 2} y2="-30" stroke="#3b82f6" strokeWidth="1.5" />
                                {/* Left extension */}
                                <line x1={-doorWidth / 2} y1="-30" x2={-doorWidth / 2} y2={-y + 2} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                                {/* Right extension */}
                                <line x1={doorWidth / 2} y1="-30" x2={doorWidth / 2} y2={-y + 2} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                                {/* Ticks */}
                                <line x1={-doorWidth / 2} y1="-35" x2={-doorWidth / 2} y2="-25" stroke="#3b82f6" strokeWidth="2" />
                                <line x1={doorWidth / 2} y1="-35" x2={doorWidth / 2} y2="-25" stroke="#3b82f6" strokeWidth="2" />
                            </g>
                        )}

                        <rect
                            x={isVertical ? 5 : -35} y={isVertical ? -18 : -47} width={70} height={36}
                            fill="white" stroke="#3b82f6" strokeWidth="3" rx={10}
                            className="drop-shadow-lg"
                        />
                        <text
                            x={isVertical ? 40 : 0} y={isVertical ? 0 : -29} textAnchor="middle" dominantBaseline="central"
                            fontSize="16" fontWeight="900" fill="#1e40af"
                        >
                            {value}mm
                        </text>
                    </g>
                );
            }

            return null;
        });
    };

    const renderDoorBody = () => {
        if (door_type === 'double') {
            const g1_width = doorWidth / 2;
            return (
                <g>
                    {/* Left Door */}
                    <PanelDoor width={g1_width - 1} height={doorHeight} x={startX} y={startY} orientation="front" />
                    {/* Right Door */}
                    <PanelDoor width={g1_width - 1} height={doorHeight} x={startX + g1_width + 1} y={startY} orientation="front" />

                    {/* Hinges and Handles */}
                    <Hinge x={startX} y={startY + 50} orientation="left" type="wall" />
                    <Hinge x={startX} y={startY + doorHeight - 50} orientation="left" type="wall" />
                    <Hinge x={startX + doorWidth} y={startY + 50} orientation="right" type="wall" />
                    <Hinge x={startX + doorWidth} y={startY + doorHeight - 50} orientation="right" type="wall" />

                    <Handle x={startX + g1_width - 1} y={startY + doorHeight / 2 - 20} orientation="right" />
                    <Handle x={startX + g1_width + 1} y={startY + doorHeight / 2 - 20} orientation="left" />
                </g>
            );
        }

        const isLeft = door_type === 'left';
        return (
            <g>
                <PanelDoor width={doorWidth} height={doorHeight} x={startX} y={startY} orientation="front" />

                {/* Hinges */}
                <Hinge
                    x={isLeft ? startX : startX + doorWidth}
                    y={startY + 50}
                    orientation={isLeft ? 'left' : 'right'}
                    type="wall"
                />
                <Hinge
                    x={isLeft ? startX : startX + doorWidth}
                    y={startY + doorHeight - 70}
                    orientation={isLeft ? 'left' : 'right'}
                    type="wall"
                />

                {/* Handle */}
                <Handle
                    x={isLeft ? startX + doorWidth : startX}
                    y={startY + doorHeight / 2 - 20}
                    orientation={isLeft ? 'right' : 'left'}
                />
            </g>
        );
    };

    return (
        <div className="w-full flex flex-col items-center justify-center overflow-visible">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full max-w-[500px] h-auto drop-shadow-md overflow-visible"
            >
                {renderDoorBody()}
                {renderLaserOverlays()}
            </svg>
        </div>
    );
};
