import React, { useState } from 'react';
import { PanelModel } from '@/types/square';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ShowerConfiguration } from './ShowerConfiguration';

interface MeasurementPoint {
    id: string;
    label: string;
    description: string;
    value: number | null;
    unit: string;
}

interface DimensionsInputProps {
    panels: PanelModel[];
    measurements: Record<string, number>;
    onMeasurementChange: (key: string, value: number) => void;
    junctions?: any[];
    baseType?: string;
    realWidthMm?: number;
    realHeightMm?: number;
    mountingType?: string;
    mountingSide?: string;
    doorVariant?: string;
    floorRake?: { amount: number; direction: 'left' | 'right' };
    wallRake?: { amount: number; direction: 'in' | 'out' };
    ceilingRake?: { left_height_mm: number; right_height_mm: number };
    onFloorRakeChange?: (rake: { amount: number; direction: 'left' | 'right' } | undefined) => void;
    onWallRakeChange?: (rake: { amount: number; direction: 'in' | 'out' } | undefined) => void;
    onCeilingRakeChange?: (rake: { left_height_mm: number; right_height_mm: number } | undefined) => void;
}

export const DimensionsInput: React.FC<DimensionsInputProps> = ({
    panels,
    measurements,
    onMeasurementChange,
    junctions = [],
    baseType,
    realWidthMm,
    realHeightMm,
    mountingType,
    mountingSide,
    doorVariant,
    floorRake,
    wallRake,
    ceilingRake,
    onFloorRakeChange,
    onCeilingRakeChange
}) => {
    const [activeMeasurement, setActiveMeasurement] = useState<string | null>('A');

    // Generate measurement points based on panels
    const sortedPanels = [...panels].sort((a, b) => a.position_index - b.position_index);

    // Create measurement points: A = height, B, C, D... = panel widths
    const measurementPoints: MeasurementPoint[] = [
        {
            id: 'A',
            label: 'A',
            description: 'Overall Height',
            value: measurements['height'] || null,
            unit: 'mm'
        }
    ];

    // Add width points for each panel (B, C, D, E...)
    const widthLabels = ['B', 'C', 'D', 'E', 'F', 'G'];
    sortedPanels.forEach((panel, index) => {
        if (index < widthLabels.length) {
            measurementPoints.push({
                id: widthLabels[index],
                label: widthLabels[index],
                description: `${panel.panel_id} Width`,
                value: measurements[`${panel.panel_id}_width`] || panel.width_mm || null,
                unit: 'mm'
            });
        }
    });

    // Find door panel for door width
    const doorPanel = sortedPanels.find(p => p.panel_type === 'door_hinged');

    const handleInputChange = (pointId: string, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            if (pointId === 'A') {
                onMeasurementChange('height', numValue);
            } else {
                // Find corresponding panel
                const panelIndex = widthLabels.indexOf(pointId);
                if (panelIndex >= 0 && panelIndex < sortedPanels.length) {
                    const panel = sortedPanels[panelIndex];
                    onMeasurementChange(`${panel.panel_id}_width`, numValue);
                }
            }
        }
    };

    const handleDoorWidthChange = (value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0 && doorPanel) {
            onMeasurementChange(`${doorPanel.panel_id}_door_opening`, numValue);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Fields - NOW ON LEFT */}
            <div className="space-y-6 order-2 lg:order-1">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Enter Measurements
                </Label>

                {/* Measurement Inputs */}
                <div className="space-y-4">
                    {measurementPoints.map(point => (
                        <Card
                            key={point.id}
                            className={`cursor-pointer transition-all ${activeMeasurement === point.id
                                ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/10'
                                : 'hover:border-slate-300'
                                }`}
                            onClick={() => setActiveMeasurement(point.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-white ${activeMeasurement === point.id ? 'bg-blue-600' : 'bg-slate-400'
                                        }`}>
                                        {point.label}
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-slate-500 mb-1 block">{point.description}</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Enter measurement"
                                                value={point.value || ''}
                                                onChange={(e) => handleInputChange(point.id, e.target.value)}
                                                className="h-10 font-mono"
                                                onFocus={() => setActiveMeasurement(point.id)}
                                            />
                                            <span className="text-slate-400 text-sm font-bold">{point.unit}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Door Opening (if door exists) */}
                {doorPanel && (
                    <div className="pt-4 border-t border-slate-100">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">
                            Door Opening Width
                        </Label>
                        <Card className="border-blue-200 bg-blue-50/50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500 text-white text-lg">
                                        🚪
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-slate-500 mb-1 block">
                                            {doorPanel.panel_id} Door Opening
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Enter door width"
                                                value={measurements[`${doorPanel.panel_id}_door_opening`] || ''}
                                                onChange={(e) => handleDoorWidthChange(e.target.value)}
                                                className="h-10 font-mono"
                                            />
                                            <span className="text-slate-400 text-sm font-bold">mm</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Ceiling Rake (optional) */}
                {ceilingRake && onCeilingRakeChange && (
                    <div className="pt-4 border-t border-slate-100">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">
                            Sloped Ceiling Heights
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-slate-500 mb-1 block">Left Height</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={ceilingRake.left_height_mm || ''}
                                        onChange={(e) => onCeilingRakeChange({
                                            ...ceilingRake,
                                            left_height_mm: parseInt(e.target.value, 10) || 0
                                        })}
                                        className="h-10 font-mono"
                                    />
                                    <span className="text-slate-400 text-sm font-bold">mm</span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-slate-500 mb-1 block">Right Height</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={ceilingRake.right_height_mm || ''}
                                        onChange={(e) => onCeilingRakeChange({
                                            ...ceilingRake,
                                            right_height_mm: parseInt(e.target.value, 10) || 0
                                        })}
                                        className="h-10 font-mono"
                                    />
                                    <span className="text-slate-400 text-sm font-bold">mm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Labeled Diagram - NOW ON RIGHT */}
            <div className="relative bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 p-8 min-h-[400px] flex flex-col items-center justify-center order-1 lg:order-2 group">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 absolute top-6 left-8">
                    3D Reference Diagram
                </Label>

                <div className="w-full aspect-square flex items-center justify-center">
                    <ShowerConfiguration
                        category="square"
                        baseType={baseType}
                        panels={panels}
                        junctions={junctions}
                        viewMode="3d"
                        width={280}
                        height={280}
                        realWidthMm={realWidthMm}
                        realHeightMm={realHeightMm}
                        mountingType={mountingType as any}
                        mountingSide={mountingSide as any}
                        doorVariant={doorVariant as any}
                        isActive={true}
                        hideDimensions={true}
                        scaleOverride={0.12}
                    />
                </div>


                <div className="mt-6 flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fixed Panel</span>
                    </div>
                    {doorPanel && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Door Panel</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
