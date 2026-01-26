export type HingeOrientation = 'wall-to-glass' | 'glass-to-glass' | '90-degree' | '135-degree';
export type MountingMethod = 'channel' | 'clamps';

export function getHingeType(neighborType: 'wall' | 'glass' | 'none', angle: 90 | 135 | 180 = 180): HingeOrientation {
    if (neighborType === 'wall') return 'wall-to-glass';
    if (neighborType === 'glass') {
        if (angle === 90) return '90-degree';
        if (angle === 135) return '135-degree';
        return 'glass-to-glass';
    }
    return 'wall-to-glass'; // Default fallback
}

export function getMountingSpecs(method: MountingMethod) {
    if (method === 'clamps') {
        return {
            gapToWall: 3, // mm
            gapToFloor: 3, // mm (silicone)
            hardware: 'Clamps',
            description: 'Fixed with clamps (3mm gap)'
        };
    }
    return {
        gapToWall: 0, // Glass sits inside channel, handled by deductions
        gapToFloor: 0,
        hardware: 'U-Channel',
        description: 'Fixed with 19mm U-Channel'
    };
}
