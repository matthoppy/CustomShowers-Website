import { HardwareFinish, getHardwareColors } from './Hinge';

interface ClampProps {
    x?: number;
    y?: number;
    orientation?: 'front' | 'left' | 'right';
    edge?: 'left' | 'right' | 'center';
    scale?: number;
    finish?: HardwareFinish;
}

export function Clamp({ x = 0, y = 0, orientation = 'front', edge = 'center', scale = 1, finish = 'chrome' }: ClampProps) {
    const baseSize = 10;
    const size = baseSize * scale;
    const colors = getHardwareColors(finish);

    if (orientation === 'front') {
        // Front-facing clamp - square
        let xOffset = 0;
        if (edge === 'left') xOffset = -size / 2;
        else if (edge === 'right') xOffset = -size / 2;
        else xOffset = -size / 2; // center

        return (
            <g transform={`translate(${x}, ${y})`}>
                <rect
                    x={xOffset}
                    y={-size / 2}
                    width={size}
                    height={size}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="1"
                />
            </g>
        );
    }

    if (orientation === 'left') {
        // Left-angled clamp - parallelogram
        const depth = 4;
        const angleRatio = 0.5;
        const verticalOffset = size * angleRatio;

        return (
            <g transform={`translate(${x}, ${y})`}>
                <path
                    d={`M ${-size / 2} ${-size / 2} L ${-size / 2 - depth * 3.5} ${-size / 2 - verticalOffset} L ${-size / 2 - depth * 3.5} ${size / 2 - verticalOffset} L ${-size / 2} ${size / 2} Z`}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="1"
                />
            </g>
        );
    }

    // orientation === 'right'
    // Right-angled clamp - parallelogram
    const depth = 4;
    const angleRatio = 0.5;
    const verticalOffset = size * angleRatio;

    return (
        <g transform={`translate(${x}, ${y})`}>
            <path
                d={`M ${-size / 2} ${-size / 2} L ${-size / 2 + depth * 3.5} ${-size / 2 - verticalOffset} L ${-size / 2 + depth * 3.5} ${size / 2 - verticalOffset} L ${-size / 2} ${size / 2} Z`}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="1"
            />
        </g>
    );
}
