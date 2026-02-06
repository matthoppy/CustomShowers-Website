import React, { useState, useEffect, useMemo } from 'react';
import type {
    DoorState,
    DoorOverlay,
    DoorConfigType,
    DoorHeightMode,
    DoorThresholdType,
    DoorHardwareFinish,
    DoorMeasurements,
    DoorDerivedValues,
    DoorDeductions,
    GlassType,
    HingeType
} from '@/types/door';
import { DoorPreview } from './DoorPreview';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle2, Ruler, Cog, FileText, FlaskConical as Flask, ShieldCheck } from 'lucide-react';

const INITIAL_STATE: DoorState = {
    door_type: 'right',
    height_mode: 'standard',
    seals_required: true,
    glass_type: 'clear',
    hinge_type: 'geneva',
    threshold_type: 'none',
    hardware_finish: 'chrome',
    ceiling_air_gap_mm: 40,
    measurements: {
        // Horizontal
        left_wall_to_vertical_laser_bottom: 300,
        vertical_laser_to_right_wall_bottom: 300,
        left_wall_to_vertical_laser_top: 300,
        vertical_laser_to_right_wall_top: 300,
        // Vertical
        floor_to_horizontal_laser_left: 1000,
        horizontal_laser_to_ceiling_left: 1000,
        floor_to_horizontal_laser_right: 1000,
        horizontal_laser_to_ceiling_right: 1000,
        // Standard
        glass_height_hinge_side_mm: 2000,
    },
    derived: {
        opening_width_bottom_mm: 600,
        opening_width_top_mm: 600,
        height_left_mm: 2000,
        height_right_mm: 2000,
    },
    deductions: {
        hinge_side: 8,
        handle_side: 9,
        bottom: 10,
        total_width: 17,
        total_height: 10,
    },
    warnings: [],
};

export const DoorConfigurator: React.FC = () => {
    const [screen, setScreen] = useState<'options' | 'dimensions' | 'technical' | 'confirmation'>('options');
    const [state, setState] = useState<DoorState>(INITIAL_STATE);
    const [activeField, setActiveField] = useState<string | null>(null);

    // Update Derived Values and Deductions
    useEffect(() => {
        const m = state.measurements;
        const derived: DoorDerivedValues = {};

        // Widths (Complete Pairs rule)
        if (m.left_wall_to_vertical_laser_bottom !== undefined && m.vertical_laser_to_right_wall_bottom !== undefined) {
            derived.opening_width_bottom_mm = m.left_wall_to_vertical_laser_bottom + m.vertical_laser_to_right_wall_bottom;
        }
        if (m.left_wall_to_vertical_laser_top !== undefined && m.vertical_laser_to_right_wall_top !== undefined) {
            derived.opening_width_top_mm = m.left_wall_to_vertical_laser_top + m.vertical_laser_to_right_wall_top;
        }

        // Heights
        if (state.height_mode === 'floor_to_ceiling') {
            if (m.floor_to_horizontal_laser_left !== undefined && m.horizontal_laser_to_ceiling_left !== undefined) {
                derived.height_left_mm = (m.floor_to_horizontal_laser_left + m.horizontal_laser_to_ceiling_left) - state.ceiling_air_gap_mm;
            }
            if (m.floor_to_horizontal_laser_right !== undefined && m.horizontal_laser_to_ceiling_right !== undefined) {
                derived.height_right_mm = (m.floor_to_horizontal_laser_right + m.horizontal_laser_to_ceiling_right) - state.ceiling_air_gap_mm;
            }
        } else {
            const doorHeight = state.measurements.glass_height_hinge_side_mm || 0;
            const floorFall = (m.floor_to_horizontal_laser_left || 0) - (m.floor_to_horizontal_laser_right || 0);

            derived.height_left_mm = doorHeight;
            derived.height_right_mm = doorHeight - floorFall;
        }

        // Rakes
        if (derived.height_left_mm && derived.height_right_mm) {
            derived.wall_rake_mm = derived.height_left_mm - derived.height_right_mm;
        }
        if (derived.opening_width_top_mm && derived.opening_width_bottom_mm) {
            derived.width_difference_mm = derived.opening_width_top_mm - derived.opening_width_bottom_mm;
        }

        // Deductions
        const deductions: DoorDeductions = {
            hinge_side: state.seals_required ? 8 : 5,
            handle_side: state.seals_required ? 9 : 5,
            bottom: state.seals_required
                ? (state.threshold_type === 'clear_threshold' ? 16 : state.threshold_type === 'tapered_threshold' ? 18 : 10)
                : 8,
            total_width: 0,
            total_height: 0
        };
        deductions.total_width = deductions.hinge_side + deductions.handle_side;
        deductions.total_height = deductions.bottom + (state.height_mode === 'floor_to_ceiling' ? state.ceiling_air_gap_mm : 0);

        // Weight Calculation (10mm glass: Area * 25kg/m2)
        const avg_height_m = ((derived.height_left_mm || 0) + (derived.height_right_mm || 0)) / 2000;
        const avg_width_m = ((derived.opening_width_bottom_mm || 0) + (derived.opening_width_top_mm || 0)) / 2000;
        const weight_kg = avg_height_m * avg_width_m * 25;

        // Hinge Logic
        let hinge_type = state.hinge_type;
        const hinge_limit_width = 800;
        const hinge_limit_weight = 38;
        const exceeds_standard = (derived.opening_width_bottom_mm || 0) > hinge_limit_width || weight_kg > hinge_limit_weight;

        if (exceeds_standard && hinge_type !== 'bellagio') {
            hinge_type = 'bellagio';
        }

        setState(prev => ({ ...prev, derived, deductions, hinge_type }));
    }, [state.measurements, state.height_mode, state.seals_required, state.threshold_type, state.ceiling_air_gap_mm, state.hinge_type]);

    const updateMeasurement = (field: keyof DoorMeasurements, value: number) => {
        setState(prev => ({
            ...prev,
            measurements: { ...prev.measurements, [field]: value }
        }));
    };

    const getOverlays = (): DoorOverlay[] => {
        if (screen === 'options' || screen === 'technical') return [];

        const m = state.measurements;

        // Match scaling logic in DoorPreview for accurate overlay placement
        const h_mm = Math.max(state.derived.height_left_mm || 0, state.derived.height_right_mm || 0) || 2000;
        const w_mm = Math.max(state.derived.opening_width_bottom_mm || 0, state.derived.opening_width_top_mm || 0) || 600;
        const visualWidth = Math.max(100, Math.min(350, w_mm * 0.2));
        const visualHeight = Math.max(200, Math.min(450, h_mm * 0.2));

        const centerX = visualWidth / 2;
        const centerY = visualHeight / 2;

        const overlays: DoorOverlay[] = [
            { type: 'laser_crosshair', meta: { x_offset: centerX, y_offset: centerY } }
        ];

        // 1 & 2: Bottom Width (positioned halfway between edge and laser)
        overlays.push({
            type: 'laser_dimension_red',
            meta: { x: centerX / 2, y: visualHeight + 40, value: m.left_wall_to_vertical_laser_bottom, label: 'B1', id: 'left_wall_to_vertical_laser_bottom' }
        });
        overlays.push({
            type: 'laser_dimension_red',
            meta: { x: centerX + centerX / 2, y: visualHeight + 40, value: m.vertical_laser_to_right_wall_bottom, label: 'B2', id: 'vertical_laser_to_right_wall_bottom' }
        });

        // 3 & 4: Top Width
        overlays.push({
            type: 'laser_dimension_red',
            meta: { x: centerX / 2, y: -20, value: m.left_wall_to_vertical_laser_top, label: 'T1', id: 'left_wall_to_vertical_laser_top' }
        });
        overlays.push({
            type: 'laser_dimension_red',
            meta: { x: centerX + centerX / 2, y: -20, value: m.vertical_laser_to_right_wall_top, label: 'T2', id: 'vertical_laser_to_right_wall_top' }
        });

        // 5 & 6: Left Height (Halfway vertically)
        const leftH1Value = m.floor_to_horizontal_laser_left;
        const leftH2Value = state.height_mode === 'floor_to_ceiling' ? m.horizontal_laser_to_ceiling_left : m.horizontal_laser_to_top_level_left;

        overlays.push({
            type: 'laser_dimension_red',
            meta: { x: -40, y: centerY + centerY / 2, value: leftH1Value, label: 'H1', id: 'floor_to_horizontal_laser_left' }
        });
        if (state.height_mode === 'floor_to_ceiling') {
            overlays.push({
                type: 'laser_dimension_red',
                meta: {
                    x: -40, y: centerY / 2,
                    value: leftH2Value,
                    label: 'H2',
                    id: 'horizontal_laser_to_ceiling_left'
                }
            });
        }

        // 7 & 8: Right Height
        const rightH3Value = m.floor_to_horizontal_laser_right;
        const rightH4Value = state.height_mode === 'floor_to_ceiling' ? m.horizontal_laser_to_ceiling_right : m.horizontal_laser_to_top_level_right;

        overlays.push({
            type: 'laser_dimension_red',
            meta: { x: visualWidth + 40, y: centerY + centerY / 2, value: rightH3Value, label: 'H3', id: 'floor_to_horizontal_laser_right' }
        });
        if (state.height_mode === 'floor_to_ceiling') {
            overlays.push({
                type: 'laser_dimension_red',
                meta: {
                    x: visualWidth + 40, y: centerY / 2,
                    value: rightH4Value,
                    label: 'H4',
                    id: 'horizontal_laser_to_ceiling_right'
                }
            });
        }

        // Totals
        if (state.derived.height_left_mm) {
            overlays.push({
                type: 'total_dimension_blue',
                meta: { x: -140, y: centerY, value: state.derived.height_left_mm.toFixed(0), orientation: 'vertical' }
            });
        }

        if (activeField) {
            overlays.push({ type: 'highlight_field', meta: { id: activeField } });
        }

        return overlays;
    };

    const renderOptions = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Cog className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Door Configuration</h3>
                        </div>
                        <RadioGroup
                            value={state.door_type}
                            onValueChange={(val) => setState(prev => ({ ...prev, door_type: val as DoorConfigType }))}
                            className="grid grid-cols-3 gap-3"
                        >
                            {['left', 'right', 'double'].map(type => (
                                <Label
                                    key={type}
                                    className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${state.door_type === type ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-slate-50'}`}
                                >
                                    <RadioGroupItem value={type} className="sr-only" />
                                    <span className="text-xs font-bold capitalize">{type}</span>
                                </Label>
                            ))}
                        </RadioGroup>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Ruler className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Height Mode</h3>
                        </div>
                        <RadioGroup
                            value={state.height_mode}
                            onValueChange={(val) => setState(prev => ({ ...prev, height_mode: val as DoorHeightMode }))}
                            className="grid grid-cols-2 gap-3"
                        >
                            {['standard', 'floor_to_ceiling'].map(mode => (
                                <Label
                                    key={mode}
                                    className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${state.height_mode === mode ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-slate-50'}`}
                                >
                                    <RadioGroupItem value={mode} className="sr-only" />
                                    <span className="text-xs font-bold capitalize">{mode.replace(/_/g, ' ')}</span>
                                </Label>
                            ))}
                        </RadioGroup>
                    </section>

                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 italic leading-snug">
                            Choose your layout and height mode to begin measuring.
                        </p>
                    </div>
                </div>

                <div className="relative group flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 overflow-hidden">
                    <DoorPreview state={state} overlays={getOverlays()} />
                </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-slate-200">
                <Button onClick={() => setScreen('dimensions')} className="px-12 h-12 font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all rounded-full">
                    Proceed to Dimensions
                </Button>
            </div>
        </div>
    );

    const renderTechnical = () => {
        const avg_height_m = ((state.derived.height_left_mm || 0) + (state.derived.height_right_mm || 0)) / 2000;
        const avg_width_m = ((state.derived.opening_width_bottom_mm || 0) + (state.derived.opening_width_top_mm || 0)) / 2000;
        const weight_kg = (avg_height_m * avg_width_m * 25).toFixed(1);

        const hinge_limit_width = 800;
        const hinge_limit_weight = 38;
        const exceeds_standard = (state.derived.opening_width_bottom_mm || 0) > hinge_limit_width || Number(weight_kg) > hinge_limit_weight;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 uppercase tracking-wider">
                                    <Flask className="w-4 h-4 text-primary" />
                                    Technical Setup & Upgrades
                                </h3>
                                <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                                    Step 3 of 4
                                </div>
                            </div>
                            <CardContent className="p-8 space-y-12">
                                {/* Glass Type Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Glass Type</h4>
                                    </div>
                                    <RadioGroup
                                        value={state.glass_type}
                                        onValueChange={(val) => setState(prev => ({ ...prev, glass_type: val as GlassType }))}
                                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                                    >
                                        {(['clear', 'low_iron', 'satin', 'bronze'] as GlassType[]).map(type => (
                                            <Label
                                                key={type}
                                                className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${state.glass_type === type ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-slate-50'}`}
                                            >
                                                <RadioGroupItem value={type} className="sr-only" />
                                                <span className="text-xs font-bold capitalize">{type.replace('_', ' ')}</span>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Hinge Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-4 bg-primary rounded-full" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hinge Hardware</h4>
                                        </div>
                                        {exceeds_standard && (
                                            <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Heavy Duty Required</span>
                                        )}
                                    </div>
                                    <RadioGroup
                                        value={state.hinge_type}
                                        onValueChange={(val) => setState(prev => ({ ...prev, hinge_type: val as HingeType }))}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        {/* Standard Hinge */}
                                        <Label
                                            className={`flex items-center gap-4 p-5 border rounded-2xl transition-all ${exceeds_standard ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-slate-50'} ${state.hinge_type !== 'bellagio' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                                        >
                                            <RadioGroupItem value="geneva" disabled={exceeds_standard} className="sr-only" />
                                            <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center font-black text-slate-300">G/V</div>
                                            <div className="flex-1">
                                                <div className="text-xs font-black uppercase tracking-tight">Geneva / Vienna</div>
                                                <div className="text-[10px] text-slate-500 font-medium">Standard Capacity (Up to 38kg)</div>
                                            </div>
                                            {!exceeds_standard && state.hinge_type !== 'bellagio' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                        </Label>

                                        {/* Premium Hinge */}
                                        <Label
                                            className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all ${state.hinge_type === 'bellagio' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-slate-50'}`}
                                        >
                                            <RadioGroupItem value="bellagio" className="sr-only" />
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white">B</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs font-black uppercase tracking-tight">Bellagio</div>
                                                    <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-black tracking-widest">UPGRADE</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-medium">Heavy Duty Capacity (Up to 50kg+)</div>
                                            </div>
                                            {state.hinge_type === 'bellagio' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                        </Label>
                                    </RadioGroup>
                                </div>

                                {/* Moved Hardware Sections */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-4 bg-primary rounded-full" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hardware Finish</h4>
                                        </div>
                                        <RadioGroup
                                            value={state.hardware_finish}
                                            onValueChange={(val) => setState(prev => ({ ...prev, hardware_finish: val as DoorHardwareFinish }))}
                                            className="grid grid-cols-3 gap-2"
                                        >
                                            {['chrome', 'matte_black', 'brushed_nickel'].map(f => (
                                                <Label
                                                    key={f}
                                                    className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${state.hardware_finish === f ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-slate-50'}`}
                                                >
                                                    <RadioGroupItem value={f} className="sr-only" />
                                                    <span className="text-[10px] font-bold capitalize">{f.replace('_', ' ')}</span>
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-4 bg-primary rounded-full" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Water Protection</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="space-y-0.5">
                                                    <Label className="text-[11px] font-bold">Minimize Water Seals</Label>
                                                    <p className="text-[9px] text-slate-500 italic">Clear vinyl components</p>
                                                </div>
                                                <Switch
                                                    checked={state.seals_required}
                                                    onCheckedChange={(val) => setState(prev => ({ ...prev, seals_required: val }))}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase text-slate-400">Threshold Seal</Label>
                                                <RadioGroup
                                                    value={state.threshold_type}
                                                    onValueChange={(val) => setState(prev => ({ ...prev, threshold_type: val as DoorThresholdType }))}
                                                    className="grid grid-cols-3 gap-2"
                                                >
                                                    {['none', 'clear_threshold', 'tapered_threshold'].map(t => (
                                                        <Label
                                                            key={t}
                                                            className={`flex flex-col items-center justify-center text-center p-2 border rounded-lg cursor-pointer transition-all ${state.threshold_type === t ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-white'}`}
                                                        >
                                                            <RadioGroupItem value={t} className="sr-only" />
                                                            <span className="text-[8px] font-bold capitalize leading-tight">{t.replace(/_/g, ' ')}</span>
                                                        </Label>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Seal Visuals Gallery */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Component Reference</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { name: 'Bulb Seal', path: '/seals/bulb-seal.png', desc: 'Side Hinge/Handle' },
                                            { name: 'H-Seal', path: '/seals/h-seal.png', desc: 'Glass to Glass' },
                                            { name: 'Bottom Seal', path: '/seals/bottom-seal.png', desc: 'Floor Sweep' },
                                            { name: 'Threshold', path: '/seals/threshold.png', desc: 'Water Bar' },
                                        ].map(img => (
                                            <div key={img.name} className="group relative bg-slate-50 border border-slate-100 rounded-xl p-3 text-center transition-all hover:bg-white hover:shadow-md">
                                                <div className="aspect-square mb-2 overflow-hidden rounded-lg bg-white border border-slate-100">
                                                    <img src={img.path} alt={img.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                                                </div>
                                                <div className="text-[9px] font-black uppercase text-slate-900 leading-tight">{img.name}</div>
                                                <div className="text-[8px] text-slate-400 font-medium">{img.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b pb-2">Width Calculation</h4>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Left (Hinge Side)', value: state.deductions.hinge_side },
                                                    { label: 'Right (Handle Side)', value: state.deductions.handle_side },
                                                ].map(d => (
                                                    <div key={d.label} className="flex justify-between items-center group">
                                                        <span className="text-xs text-slate-500 font-medium group-hover:text-slate-900 transition-colors">{d.label}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px w-8 bg-slate-100" />
                                                            <span className="font-mono text-sm font-black text-amber-600">-{d.value}mm</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Separator className="bg-slate-100" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-black text-slate-900 uppercase">Total Width Deduction</span>
                                                    <span className="font-mono text-lg font-black text-slate-900">-{state.deductions.total_width}mm</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b pb-2">Height Calculation</h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500 font-medium">Bottom Floor Gap</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-px w-8 bg-slate-100" />
                                                        <span className="font-mono text-sm font-black text-amber-600">-{state.deductions.bottom}mm</span>
                                                    </div>
                                                </div>
                                                {state.height_mode === 'floor_to_ceiling' && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-slate-500 font-medium">Ceiling Airflow Gap</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px w-8 bg-slate-100" />
                                                            <span className="font-mono text-sm font-black text-amber-600">-{state.ceiling_air_gap_mm}mm</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <Separator className="bg-slate-100" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-black text-slate-900 uppercase">Total Height Deduction</span>
                                                    <span className="font-mono text-lg font-black text-slate-900">-{state.deductions.total_height}mm</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 text-center text-center">Visual Breakdown</h4>
                                            <div className="flex items-center justify-center py-6 bg-white rounded-xl shadow-sm border border-slate-100 h-[280px]">
                                                <DoorPreview
                                                    state={state}
                                                    overlays={getOverlays()}
                                                />
                                            </div>
                                            <div className="mt-4 flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                                                <p className="text-[10px] text-slate-600 leading-normal font-medium">
                                                    Deductions are applied to the <strong>maximum</strong> opening dimensions recorded in the previous step.
                                                </p>
                                            </div>
                                        </div>

                                        {state.height_mode === 'floor_to_ceiling' && (
                                            <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-sm font-bold text-amber-900">Ceiling Air Gap</Label>
                                                        <p className="text-[10px] text-amber-800/60 leading-tight">Adjust gap for airflow in full-height units</p>
                                                    </div>
                                                    <span className="text-sm font-black text-amber-900">{state.ceiling_air_gap_mm}mm</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="1"
                                                    value={state.ceiling_air_gap_mm}
                                                    onChange={(e) => setState(s => ({ ...s, ceiling_air_gap_mm: Number(e.target.value) }))}
                                                    className="w-full accent-amber-500"
                                                />
                                                <p className="text-[9px] text-amber-700/50 italic text-center">Gap is automatically deducted from total height</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Door Weight Stats */}
                        <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Door Weight (10mm Glass)</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{weight_kg}</span>
                                <span className="text-lg font-black text-slate-400 mb-1">KG</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${Number(weight_kg) > hinge_limit_weight ? 'bg-amber-500' : 'bg-primary'}`}
                                        style={{ width: `${Math.min(100, (Number(weight_kg) / 50) * 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                    <span>0kg</span>
                                    <span>50kg Limit</span>
                                </div>
                            </div>
                            {Number(weight_kg) > hinge_limit_weight && (
                                <div className="p-3 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-xl leading-relaxed">
                                    Door weight exceeds standard capacity. Bellagio hinges are required.
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                            <ShieldCheck className="w-12 h-12 text-primary/40" />
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Technical Review</h3>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest max-w-[200px]">Review all deductions and hardware choices before finalising.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-8 border-t border-slate-200">
                    <Button variant="ghost" onClick={() => setScreen('dimensions')} className="text-slate-400 hover:text-slate-900 font-black h-12 uppercase tracking-widest text-xs">
                        Back to Dimensions
                    </Button>
                    <Button onClick={() => setScreen('confirmation')} className="px-16 h-12 font-black uppercase tracking-widest text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-2xl transition-all rounded-full">
                        Confirm Technical Setup
                    </Button>
                </div>
            </div>
        );
    };

    const renderDimensions = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-1 space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                            {state.height_mode === 'standard'
                                ? "Enter the total height from the floor to the top of the glass."
                                : "Door dimensions will update once complete pairs (e.g. Left + Right) for an edge are entered."}
                        </p>
                    </div>

                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                        {state.height_mode === 'standard' && (
                            <div className="p-5 border rounded-2xl bg-white shadow-sm space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Door Height</Label>
                                <div className="relative">
                                    <Input
                                        id="dim-input-glass_height_hinge_side_mm"
                                        type="number"
                                        value={state.measurements.glass_height_hinge_side_mm || ''}
                                        onFocus={() => setActiveField('glass_height_hinge_side_mm')}
                                        onChange={(e) => updateMeasurement('glass_height_hinge_side_mm', Number(e.target.value))}
                                        className="h-10 text-base font-black border-slate-200 focus:border-primary pr-12 transition-all"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">MM</span>
                                </div>
                                <p className="text-[9px] text-slate-400 italic">Total vertical height from floor to top level</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-3.5 bg-red-500 rounded-full shadow-sm shadow-red-500/50" />
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Horizontal Measurements</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Bottom Width Points</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            id="dim-input-left_wall_to_vertical_laser_bottom"
                                            value={state.measurements.left_wall_to_vertical_laser_bottom || ''}
                                            onFocus={() => setActiveField('left_wall_to_vertical_laser_bottom')}
                                            onChange={(e) => updateMeasurement('left_wall_to_vertical_laser_bottom', Number(e.target.value))}
                                            placeholder="Left (B)"
                                            className={`h-9 text-xs font-bold border-red-100 hover:border-red-200 focus:border-red-400 transition-all ${activeField === 'left_wall_to_vertical_laser_bottom' ? 'bg-red-50 shadow-sm' : ''}`}
                                        />
                                        <Input
                                            id="dim-input-vertical_laser_to_right_wall_bottom"
                                            value={state.measurements.vertical_laser_to_right_wall_bottom || ''}
                                            onFocus={() => setActiveField('vertical_laser_to_right_wall_bottom')}
                                            onChange={(e) => updateMeasurement('vertical_laser_to_right_wall_bottom', Number(e.target.value))}
                                            placeholder="Right (B)"
                                            className={`h-9 text-xs font-bold border-red-100 hover:border-red-200 focus:border-red-400 transition-all ${activeField === 'vertical_laser_to_right_wall_bottom' ? 'bg-red-50 shadow-sm' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 border-t border-slate-200/50">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Top Width Points</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            id="dim-input-left_wall_to_vertical_laser_top"
                                            value={state.measurements.left_wall_to_vertical_laser_top || ''}
                                            onFocus={() => setActiveField('left_wall_to_vertical_laser_top')}
                                            onChange={(e) => updateMeasurement('left_wall_to_vertical_laser_top', Number(e.target.value))}
                                            placeholder="Left (T)"
                                            className={`h-9 text-xs font-bold border-red-100 hover:border-red-200 focus:border-red-400 transition-all ${activeField === 'left_wall_to_vertical_laser_top' ? 'bg-red-50 shadow-sm' : ''}`}
                                        />
                                        <Input
                                            id="dim-input-vertical_laser_to_right_wall_top"
                                            value={state.measurements.vertical_laser_to_right_wall_top || ''}
                                            onFocus={() => setActiveField('vertical_laser_to_right_wall_top')}
                                            onChange={(e) => updateMeasurement('vertical_laser_to_right_wall_top', Number(e.target.value))}
                                            placeholder="Right (T)"
                                            className={`h-9 text-xs font-bold border-red-100 hover:border-red-200 focus:border-red-400 transition-all ${activeField === 'vertical_laser_to_right_wall_top' ? 'bg-red-50 shadow-sm' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-3.5 bg-red-500 rounded-full shadow-sm shadow-red-500/50" />
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Vertical Measurements</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                                {state.height_mode === 'standard' ? (
                                    <div className="space-y-4">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">Vertical Points</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase ml-1">Left (H1)</span>
                                                <Input
                                                    id="dim-input-floor_to_horizontal_laser_left"
                                                    value={state.measurements.floor_to_horizontal_laser_left || ''}
                                                    onFocus={() => setActiveField('floor_to_horizontal_laser_left')}
                                                    onChange={(e) => updateMeasurement('floor_to_horizontal_laser_left', Number(e.target.value))}
                                                    placeholder="Floor to L"
                                                    className={`h-9 text-xs font-bold border-red-100 focus:border-red-400 transition-all ${activeField === 'floor_to_horizontal_laser_left' ? 'bg-red-50 shadow-sm' : ''}`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase ml-1">Right (H3)</span>
                                                <Input
                                                    id="dim-input-floor_to_horizontal_laser_right"
                                                    value={state.measurements.floor_to_horizontal_laser_right || ''}
                                                    onFocus={() => setActiveField('floor_to_horizontal_laser_right')}
                                                    onChange={(e) => updateMeasurement('floor_to_horizontal_laser_right', Number(e.target.value))}
                                                    placeholder="Floor to L"
                                                    className={`h-9 text-xs font-bold border-red-100 focus:border-red-400 transition-all ${activeField === 'floor_to_horizontal_laser_right' ? 'bg-red-50 shadow-sm' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Left Side Points</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    id="dim-input-floor_to_horizontal_laser_left"
                                                    value={state.measurements.floor_to_horizontal_laser_left || ''}
                                                    onFocus={() => setActiveField('floor_to_horizontal_laser_left')}
                                                    onChange={(e) => updateMeasurement('floor_to_horizontal_laser_left', Number(e.target.value))}
                                                    placeholder="Floor to L"
                                                    className={`h-9 text-xs font-bold border-red-100 focus:border-red-400 transition-all ${activeField === 'floor_to_horizontal_laser_left' ? 'bg-red-50 shadow-sm' : ''}`}
                                                />
                                                <Input
                                                    id="dim-input-horizontal_laser_to_ceiling_left"
                                                    value={state.measurements.horizontal_laser_to_ceiling_left || ''}
                                                    onFocus={() => setActiveField('horizontal_laser_to_ceiling_left')}
                                                    onChange={(e) => updateMeasurement('horizontal_laser_to_ceiling_left', Number(e.target.value))}
                                                    placeholder="L to Ceiling"
                                                    className={`h-9 text-xs font-bold border-red-100 focus:border-red-400 transition-all ${activeField === 'horizontal_laser_to_ceiling_left' ? 'bg-red-50 shadow-sm' : ''}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2 border-t border-slate-200/50">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Right Side Points</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    id="dim-input-floor_to_horizontal_laser_right"
                                                    value={state.measurements.floor_to_horizontal_laser_right || ''}
                                                    onFocus={() => setActiveField('floor_to_horizontal_laser_right')}
                                                    onChange={(e) => updateMeasurement('floor_to_horizontal_laser_right', Number(e.target.value))}
                                                    placeholder="Floor to L"
                                                    className={`h-9 text-xs font-bold border-red-100 focus:border-red-400 transition-all ${activeField === 'floor_to_horizontal_laser_right' ? 'bg-red-50 shadow-sm' : ''}`}
                                                />
                                                <Input
                                                    id="dim-input-horizontal_laser_to_ceiling_right"
                                                    value={state.measurements.horizontal_laser_to_ceiling_right || ''}
                                                    onFocus={() => setActiveField('horizontal_laser_to_ceiling_right')}
                                                    onChange={(e) => updateMeasurement('horizontal_laser_to_ceiling_right', Number(e.target.value))}
                                                    placeholder="L to Ceiling"
                                                    className={`h-9 text-xs font-bold border-red-100 focus:border-red-400 transition-all ${activeField === 'horizontal_laser_to_ceiling_right' ? 'bg-red-50 shadow-sm' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-6">
                    <DoorPreview
                        state={state}
                        overlays={getOverlays()}
                        onMeasurementClick={(id) => {
                            setActiveField(id);
                            const el = document.getElementById(`dim-input-${id}`);
                            el?.focus();
                        }}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Bottom Opening', value: state.derived.opening_width_bottom_mm, color: 'blue' },
                            { label: 'Top Opening', value: state.derived.opening_width_top_mm, color: 'blue' },
                            { label: 'Left Height', value: state.derived.height_left_mm, color: 'blue' },
                            { label: 'Right Height', value: state.derived.height_right_mm, color: 'blue' },
                        ].map(total => (
                            <div key={total.label} className={`p-4 bg-white border-b-4 rounded-2xl shadow-sm text-center transition-all ${total.value ? 'border-primary shadow-md' : 'border-slate-100 opacity-60'}`}>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{total.label}</span>
                                <span className={`text-xl font-black ${total.value ? 'text-slate-900' : 'text-slate-300'}`}>{total.value ? `${total.value.toFixed(0)}mm` : '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-8 border-t border-slate-200">
                <Button variant="ghost" onClick={() => setScreen('options')} className="text-slate-400 hover:text-slate-900 font-black h-12 uppercase tracking-widest text-xs">
                    Back to Config
                </Button>
                <Button onClick={() => setScreen('technical')} className="px-12 h-12 font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all rounded-full">
                    Review Technical Setup
                </Button>
            </div>
        </div>
    );

    const renderConfirmation = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Technical Specification
                            </h3>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Measurements & Rakes</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Max Opening Width</span>
                                                <span className="font-bold">{Math.max(state.derived.opening_width_bottom_mm || 0, state.derived.opening_width_top_mm || 0)}mm</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Max Opening Height</span>
                                                <span className="font-bold">{Math.max(state.derived.height_left_mm || 0, state.derived.height_right_mm || 0)}mm</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Wall Rake</span>
                                                <span className={`font-bold ${state.derived.wall_rake_mm && Math.abs(state.derived.wall_rake_mm) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                                                    {state.derived.wall_rake_mm ? `${Math.abs(state.derived.wall_rake_mm)}mm ${state.derived.wall_rake_mm > 0 ? 'Out' : 'In'}` : 'Plumb'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Options Summary</h4>
                                        <div className="space-y-2">
                                            <div className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-1 rounded inline-block">
                                                {state.door_type.toUpperCase()} DOOR
                                            </div>
                                            <div className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded inline-block ml-2">
                                                {state.height_mode.replace(/_/g, ' ').toUpperCase()}
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-2">
                                                Hardware Finish: <span className="font-bold text-slate-900 capitalize">{state.hardware_finish.replace(/_/g, ' ')}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Deductions Breakdown</h4>
                                        <div className="space-y-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-600">Hinge Side</span>
                                                <span className="font-mono font-bold">-{state.deductions.hinge_side}mm</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-600">Handle Side</span>
                                                <span className="font-mono font-bold">-{state.deductions.handle_side}mm</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-600">Bottom Gap</span>
                                                <span className="font-mono font-bold">-{state.deductions.bottom}mm</span>
                                            </div>
                                            {state.height_mode === 'floor_to_ceiling' && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-600">Ceiling Airflow</span>
                                                    <span className="font-mono font-bold">-{state.ceiling_air_gap_mm}mm</span>
                                                </div>
                                            )}
                                            <Separator className="bg-amber-200" />
                                            <div className="flex justify-between text-xs font-black text-amber-900">
                                                <span>Total Deductions</span>
                                                <span>W: -{state.deductions.total_width}mm | H: -{state.deductions.total_height}mm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold">Final Glass Size</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Width</span>
                                <div className="text-4xl font-black text-primary">
                                    {(state.derived.opening_width_bottom_mm || 0) - state.deductions.total_width}mm
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Height</span>
                                <div className="text-4xl font-black text-white">
                                    {(state.derived.height_left_mm || 0) - state.deductions.total_height}mm
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-amber-900">Double Door Rule</h4>
                                <p className="text-[10px] text-amber-800 leading-normal">
                                    Glass widths currently split 50/50. You can adjust this split once total width is confirmed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
                <Button variant="ghost" onClick={() => setScreen('technical')} className="text-slate-500 font-bold">
                    Back to Technical
                </Button>
                <Button className="px-10 font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/10">
                    Save Configuration
                </Button>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 bg-white min-h-[700px]">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Door Configurator Brain</h1>
                    <p className="text-sm text-slate-500 font-medium">Inline Hinged Door Layout</p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border">
                    {['options', 'dimensions', 'technical', 'confirmation'].map((s, i) => (
                        <div
                            key={s}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${screen === s ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                        >
                            {i + 1}. {s}
                        </div>
                    ))}
                </div>
            </div>

            {screen === 'options' && renderOptions()}
            {screen === 'dimensions' && renderDimensions()}
            {screen === 'technical' && renderTechnical()}
            {screen === 'confirmation' && renderConfirmation()}
        </div>
    );
};
