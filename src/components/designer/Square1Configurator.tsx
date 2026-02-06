import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PlanView } from './PlanView';
import { PerspectiveView } from './PerspectiveView';
import { ExplodedPanelView } from './ExplodedPanelView';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    CheckCircle2,
    Trash2,
    RotateCcw,
    Info,
} from 'lucide-react';
import { ShowerConfiguration } from './ShowerConfiguration';
import { PanelModel, JunctionModel, PanelNotches, PanelTopEdge } from '@/types/square';
import { HardwareFinish } from './Hinge';

type Step = 'LAYOUT' | 'DIMENSIONS' | 'HARDWARE' | 'ELEVATION';

export interface ChainPanel {
    id: string;
    type: 'fixed' | 'door';
    width_mm: number;
    door_properties?: {
        hinge_side: 'left' | 'right';
        swing_direction: 'out' | 'both';
    };
    notches: PanelNotches;
    top_edge: PanelTopEdge;
}

export interface ChainJunction {
    angle_deg: 90 | 180;
}

interface Square1ConfiguratorProps {
    onBackToCategory: () => void;
}

export function Square1Configurator({ onBackToCategory }: Square1ConfiguratorProps) {
    const [step, setStep] = useState<Step>('LAYOUT');

    const defaultNotches: PanelNotches = { bottom_left: false, bottom_right: false, width_mm: null, height_mm: null };
    const defaultTopEdge: PanelTopEdge = { type: 'level', direction: null, drop_mm: null };

    const [panels, setPanels] = useState<ChainPanel[]>([
        {
            id: 'p-door',
            type: 'door',
            width_mm: 700,
            door_properties: { hinge_side: 'right', swing_direction: 'out' },
            notches: { ...defaultNotches },
            top_edge: { ...defaultTopEdge }
        }
    ]);
    const [junctions, setJunctions] = useState<ChainJunction[]>([]);
    const [leftWall, setLeftWall] = useState(true);
    const [rightWall, setRightWall] = useState(true);
    const [activePanelId, setActivePanelId] = useState<string | null>('p-door');
    const [panelHeight, setPanelHeight] = useState(2000);
    const [hardwareFinish, setHardwareFinish] = useState<HardwareFinish>('chrome');
    const [mountingType, setMountingType] = useState<'channel' | 'clamps'>('channel');
    const [tempWidth, setTempWidth] = useState<string>('');
    const widthInputRef = useRef<HTMLInputElement>(null);

    const activePanel = panels.find(p => p.id === activePanelId);

    // Sync temp width when active panel changes
    useEffect(() => {
        if (activePanel) {
            setTempWidth(activePanel.width_mm.toString());
        }
    }, [activePanelId]);

    const handlePanelFocus = (id: string) => {
        setActivePanelId(id);
        // Small timeout to ensure the component is rendered/active
        setTimeout(() => widthInputRef.current?.focus(), 10);
    };

    // Helpers
    const insertPanel = (index: number, position: 'before' | 'after') => {
        const newId = `p-${Date.now()}`;
        const newPanel: ChainPanel = { id: newId, type: 'fixed', width_mm: 600, notches: { ...defaultNotches }, top_edge: { ...defaultTopEdge } };
        const insertIndex = position === 'before' ? index : index + 1;

        setPanels(prev => {
            const next = [...prev];
            next.splice(insertIndex, 0, newPanel);
            return next;
        });

        setJunctions(prev => {
            const next = [...prev];
            const junctionIdx = position === 'before' ? Math.max(0, index - 1) : index;
            next.splice(junctionIdx, 0, { angle_deg: 180 });
            return next;
        });

        setActivePanelId(newId);
    };

    const addPanelRight = () => insertPanel(panels.length - 1, 'after');
    const addPanelLeft = () => insertPanel(0, 'before');

    const removePanel = (id: string) => {
        if (panels.length <= 1) return;
        const index = panels.findIndex(p => p.id === id);
        setPanels(prev => prev.filter(p => p.id !== id));
        setJunctions(prev => {
            const next = [...prev];
            const junctionIdx = index === 0 ? 0 : index - 1;
            next.splice(junctionIdx, 1);
            return next;
        });
        setActivePanelId(panels[index === 0 ? 1 : index - 1].id);
    };

    const updateJunctionAngle = (index: number, angle: 90 | 180) => {
        setJunctions(prev => {
            const next = [...prev];
            next[index] = { ...next[index], angle_deg: angle };
            return next;
        });
    };

    const updatePanelHeight = (val: number) => {
        setPanelHeight(val);
    };

    // Derived model for the ShowerConfiguration component
    const derivedModel = useMemo(() => {
        const mappedPanels: PanelModel[] = panels.map((p, idx) => {
            return {
                panel_id: p.id,
                panel_type: p.type === 'door' ? 'door_hinged' : 'fixed',
                width_mm: p.width_mm,
                height_mm: panelHeight,
                position_index: idx,
                plane: 'front' as const,
                hinge_side: p.door_properties?.hinge_side || 'left',
                handle_side: p.door_properties?.hinge_side === 'left' ? 'right' : 'left',
                wall_fix: {
                    left: idx === 0 && leftWall,
                    right: idx === panels.length - 1 && rightWall
                },
                mounting_style: mountingType,
                notches: p.notches || { bottom_left: false, bottom_right: false, width_mm: null, height_mm: null },
                top_edge: p.top_edge || { type: 'level' as const, direction: null, drop_mm: null }
            };
        });

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
    }, [panels, junctions, panelHeight, leftWall, rightWall, mountingType]);

    const renderLayoutStep = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Layout Designer</h2>
                <p className="text-slate-500 text-sm">Design your shower shape by adding panels and corners.</p>
            </div>

            <div className="space-y-6">
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 px-1">Selected: {activePanel?.id}</Label>
                    <div className="space-y-3">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Panel Width (mm)</Label>
                        <Input
                            ref={widthInputRef}
                            type="number"
                            value={tempWidth}
                            onChange={(e) => {
                                setTempWidth(e.target.value);
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && activePanelId) {
                                    setPanels(prev => prev.map(p => p.id === activePanelId ? { ...p, width_mm: val } : p));
                                }
                            }}
                            className="h-14 text-lg font-black rounded-2xl border-2 focus-visible:ring-blue-500 border-white bg-white/50"
                        />
                    </div>
                    {activePanel?.type === 'door' && (
                        <div className="space-y-3 pt-2">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Hinge Side</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={activePanel.door_properties?.hinge_side === 'left' ? 'default' : 'outline'}
                                    onClick={() => setPanels(prev => prev.map(p => p.id === activePanelId ? { ...p, door_properties: { ...p.door_properties!, hinge_side: 'left' } } : p))}
                                    className="h-10 text-[9px] font-black uppercase rounded-xl"
                                >
                                    Left
                                </Button>
                                <Button
                                    variant={activePanel.door_properties?.hinge_side === 'right' ? 'default' : 'outline'}
                                    onClick={() => setPanels(prev => prev.map(p => p.id === activePanelId ? { ...p, door_properties: { ...p.door_properties!, hinge_side: 'right' } } : p))}
                                    className="h-10 text-[9px] font-black uppercase rounded-xl"
                                >
                                    Right
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        variant="ghost"
                        className="justify-between h-14 px-6 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 group"
                        onClick={addPanelLeft}
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">Add Panel Left</span>
                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:rotate-90 transition-all" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="justify-between h-14 px-6 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 group"
                        onClick={addPanelRight}
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">Add Panel Right</span>
                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:rotate-90 transition-all" />
                    </Button>
                </div>

                {activePanelId && panels.length > 1 && (
                    <Button
                        variant="ghost"
                        onClick={() => removePanel(activePanelId)}
                        className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-50 font-black uppercase text-[9px] tracking-widest rounded-xl transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Active Panel
                    </Button>
                )}
            </div>
        </div>
    );

    // Update a specific panel's properties
    const updateChainPanel = (id: string, updates: Partial<ChainPanel>) => {
        setPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const updatePanelNotches = (id: string, updates: Partial<PanelNotches>) => {
        setPanels(prev => prev.map(p => {
            if (p.id !== id) return p;
            return { ...p, notches: { ...p.notches, ...updates } };
        }));
    };

    const updatePanelTopEdge = (id: string, updates: Partial<PanelTopEdge>) => {
        setPanels(prev => prev.map(p => {
            if (p.id !== id) return p;
            return { ...p, top_edge: { ...p.top_edge, ...updates } };
        }));
    };

    // Map ExplodedPanelView junction callbacks (junction_id like "j-0" -> index 0)
    const handleExplodedJunctionAngle = (junctionId: string, angle: number) => {
        const idx = parseInt(junctionId.replace('j-', ''));
        if (!isNaN(idx)) {
            updateJunctionAngle(idx, angle as 90 | 180);
        }
    };

    const renderDimensionsStep = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Dimensions & Details</h2>
                <p className="text-slate-500 text-sm">Click a panel to edit its dimensions, notches and slopes.</p>
            </div>

            {/* Global Height */}
            <div className="p-5 bg-slate-900 rounded-[2rem] shadow-2xl space-y-4">
                <div className="flex justify-between items-center px-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Height (mm)</Label>
                    <span className="text-xs font-black text-blue-400">{panelHeight}mm</span>
                </div>
                <Input
                    type="number"
                    value={panelHeight}
                    onChange={(e) => updatePanelHeight(parseInt(e.target.value) || 2000)}
                    className="h-14 bg-slate-800 border-none text-white text-lg font-black rounded-2xl focus-visible:ring-blue-500"
                />
                <div className="grid grid-cols-3 gap-2">
                    {[1900, 2000, 2100].map(h => (
                        <Button
                            key={h}
                            variant={panelHeight === h ? 'secondary' : 'outline'}
                            onClick={() => updatePanelHeight(h)}
                            className={`h-10 text-[10px] font-black rounded-xl border-2 ${panelHeight === h ? 'bg-white border-blue-500 shadow-md' : 'border-slate-700 text-slate-400 hover:text-white opacity-60'}`}
                        >
                            {h}mm
                        </Button>
                    ))}
                </div>
            </div>

            {/* Per-panel editor - shown when a panel is selected */}
            {activePanelId && activePanel && (
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                            {activePanelId.replace('p-', '').charAt(0).toUpperCase()}
                        </div>
                        <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">
                            {activePanel.type === 'door' ? 'Door Panel' : 'Fixed Panel'} — {activePanelId}
                        </Label>
                    </div>

                    {/* Panel Width */}
                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Panel Width (mm)</Label>
                        <Input
                            ref={widthInputRef}
                            type="number"
                            value={tempWidth}
                            onChange={(e) => {
                                setTempWidth(e.target.value);
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && activePanelId) {
                                    setPanels(prev => prev.map(p => p.id === activePanelId ? { ...p, width_mm: val } : p));
                                }
                            }}
                            className="h-12 text-lg font-black rounded-xl border-2 border-blue-200 bg-white focus-visible:ring-blue-500"
                        />
                    </div>

                    {/* Door-specific: Hinge Side */}
                    {activePanel.type === 'door' && (
                        <div className="space-y-2">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hinge Side</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={activePanel.door_properties?.hinge_side === 'left' ? 'default' : 'outline'}
                                    onClick={() => setPanels(prev => prev.map(p => p.id === activePanelId ? { ...p, door_properties: { ...p.door_properties!, hinge_side: 'left' } } : p))}
                                    className="h-10 text-[9px] font-black uppercase rounded-xl"
                                >
                                    Left
                                </Button>
                                <Button
                                    variant={activePanel.door_properties?.hinge_side === 'right' ? 'default' : 'outline'}
                                    onClick={() => setPanels(prev => prev.map(p => p.id === activePanelId ? { ...p, door_properties: { ...p.door_properties!, hinge_side: 'right' } } : p))}
                                    className="h-10 text-[9px] font-black uppercase rounded-xl"
                                >
                                    Right
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Bottom Notches */}
                    <div className="space-y-3 pt-3 border-t border-blue-200">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bottom Notches</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={activePanel.notches.bottom_left ? 'default' : 'outline'}
                                onClick={() => updatePanelNotches(activePanelId, { bottom_left: !activePanel.notches.bottom_left })}
                                className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activePanel.notches.bottom_left ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                            >
                                Bottom Left
                            </Button>
                            <Button
                                variant={activePanel.notches.bottom_right ? 'default' : 'outline'}
                                onClick={() => updatePanelNotches(activePanelId, { bottom_right: !activePanel.notches.bottom_right })}
                                className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activePanel.notches.bottom_right ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                            >
                                Bottom Right
                            </Button>
                        </div>

                        {(activePanel.notches.bottom_left || activePanel.notches.bottom_right) && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold text-slate-400">Notch Width (mm)</Label>
                                    <Input
                                        type="number"
                                        value={activePanel.notches.width_mm || ''}
                                        onChange={(e) => updatePanelNotches(activePanelId, { width_mm: parseInt(e.target.value) || null })}
                                        placeholder="e.g. 50"
                                        className="h-9 text-xs rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold text-slate-400">Notch Height (mm)</Label>
                                    <Input
                                        type="number"
                                        value={activePanel.notches.height_mm || ''}
                                        onChange={(e) => updatePanelNotches(activePanelId, { height_mm: parseInt(e.target.value) || null })}
                                        placeholder="e.g. 50"
                                        className="h-9 text-xs rounded-lg"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sloped Ceiling / Top Edge */}
                    <div className="space-y-3 pt-3 border-t border-blue-200">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Top Edge (Sloped Ceiling)</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={activePanel.top_edge.type === 'level' ? 'default' : 'outline'}
                                onClick={() => updatePanelTopEdge(activePanelId, { type: 'level', direction: null, drop_mm: null })}
                                className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activePanel.top_edge.type === 'level' ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                            >
                                Level Top
                            </Button>
                            <Button
                                variant={activePanel.top_edge.type === 'sloped' ? 'default' : 'outline'}
                                onClick={() => updatePanelTopEdge(activePanelId, { type: 'sloped', direction: activePanel.top_edge.direction || 'left' })}
                                className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activePanel.top_edge.type === 'sloped' ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                            >
                                Sloped Top
                            </Button>
                        </div>

                        {activePanel.top_edge.type === 'sloped' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Slope Direction</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={activePanel.top_edge.direction === 'left' ? 'secondary' : 'outline'}
                                            onClick={() => updatePanelTopEdge(activePanelId, { direction: 'left' })}
                                            className="h-9 text-[8px] font-black uppercase rounded-lg"
                                        >
                                            Left High
                                        </Button>
                                        <Button
                                            variant={activePanel.top_edge.direction === 'right' ? 'secondary' : 'outline'}
                                            onClick={() => updatePanelTopEdge(activePanelId, { direction: 'right' })}
                                            className="h-9 text-[8px] font-black uppercase rounded-lg"
                                        >
                                            Right High
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold text-slate-400">Total Drop (mm)</Label>
                                    <Input
                                        type="number"
                                        value={activePanel.top_edge.drop_mm || ''}
                                        onChange={(e) => updatePanelTopEdge(activePanelId, { drop_mm: parseInt(e.target.value) || null })}
                                        placeholder="e.g. 150"
                                        className="h-9 text-xs rounded-lg"
                                    />
                                </div>
                                {activePanel.type === 'door' && (
                                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                                        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-amber-800 font-bold uppercase tracking-wider">
                                            Confirm handle/hinge clearance with sloped top
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!activePanelId && (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-[1.5rem] text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Click a panel in the diagram to edit its details
                    </p>
                </div>
            )}
        </div>
    );

    const renderHardwareStep = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Style & Selection</h2>
                <p className="text-slate-500 text-sm">Choose your hardware finish and mounting style.</p>
            </div>

            <div className="space-y-6">
                {/* Finishing */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hardware Finish</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['chrome', 'matte-black', 'brushed-brass', 'satin-brass'] as HardwareFinish[]).map((finish) => (
                            <Button
                                key={finish}
                                variant={hardwareFinish === finish ? 'default' : 'outline'}
                                onClick={() => setHardwareFinish(finish)}
                                className={`h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${hardwareFinish === finish ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                            >
                                {finish.replace('-', ' ')}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Mounting */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mounting Style</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'channel', label: 'U-Channel' },
                            { id: 'clamps', label: 'Clamps' }
                        ].map((m) => (
                            <Button
                                key={m.id}
                                variant={mountingType === m.id ? 'default' : 'outline'}
                                onClick={() => setMountingType(m.id as any)}
                                className={`h-12 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mountingType === m.id ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                            >
                                {m.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-[1.5rem] border border-amber-100">
                    <p className="text-[9px] text-amber-800 font-bold leading-relaxed uppercase tracking-wider">
                        💡 All hardware will use the same finish across your design for consistent styling.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderElevationStep = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Final Preview</h2>
                <p className="text-slate-500 text-sm">Review your custom shower configured from the plan.</p>
            </div>
            <div className="p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl">
                <h4 className="font-black uppercase tracking-widest text-[11px] mb-2">Technical Summary</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                        <span className="text-[8px] uppercase font-black text-blue-300 opacity-80">Mounting</span>
                        <p className="text-[10px] font-black uppercase">{mountingType}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[8px] uppercase font-black text-blue-300 opacity-80">Finish</span>
                        <p className="text-[10px] font-black uppercase">{hardwareFinish.replace('-', ' ')}</p>
                    </div>
                </div>
                <ul className="space-y-2 text-[10px] font-bold text-blue-100">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-300" /> {panels.length} Glass Panels</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-300" /> {junctions.filter(j => j.angle_deg === 90).length} Corners (90°)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-300" /> Total width: {panels.reduce((sum, p) => sum + p.width_mm, 0)}mm</li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50/50">
            <div className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b">
                <Button variant="ghost" onClick={onBackToCategory} className="h-10 px-0 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Categories
                </Button>
                <div className="flex items-center gap-8">
                    {(['LAYOUT', 'DIMENSIONS', 'HARDWARE', 'ELEVATION'] as Step[]).map((s, i) => (
                        <div key={s} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${step === s ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                {i + 1}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] hidden md:block ${step === s ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
                        </div>
                    ))}
                </div>
                <div className="w-32" />
            </div>

            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Sidebar (Left) */}
                <div className="w-[380px] border-r bg-white/50 backdrop-blur-sm p-6 overflow-y-auto order-1">
                    {step === 'LAYOUT' && renderLayoutStep()}
                    {step === 'DIMENSIONS' && renderDimensionsStep()}
                    {step === 'HARDWARE' && renderHardwareStep()}
                    {step === 'ELEVATION' && renderElevationStep()}
                </div>

                {/* Visual Canvas (Right) */}
                <div className="flex-1 flex flex-col p-6 min-w-0 order-2">
                    <div className="relative flex-1 bg-white rounded-[3rem] shadow-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                        <div className="absolute top-8 left-10 flex items-center gap-3 z-10">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                                {step === 'LAYOUT' ? 'Top-Down Plan' : step === 'DIMENSIONS' ? 'Exploded View' : step === 'HARDWARE' ? 'Style Preview' : '3D Perspective'}
                            </Label>
                        </div>

                        {step === 'DIMENSIONS' ? (
                            <div className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
                                <ExplodedPanelView
                                    panels={derivedModel.panels}
                                    junctions={derivedModel.junctions}
                                    activePanelId={activePanelId}
                                    activeJunctionId={null}
                                    onPanelSelect={handlePanelFocus}
                                    onJunctionSelect={() => {}}
                                    onAddPanel={() => {}}
                                    onDeletePanel={() => {}}
                                    onUpdateJunctionAngle={handleExplodedJunctionAngle}
                                    onUpdatePanelType={() => {}}
                                    minPanels={999}
                                    readOnly={true}
                                    hardwareFinish={hardwareFinish}
                                />
                            </div>
                        ) : step === 'HARDWARE' ? (
                            <div className="w-full h-full animate-in zoom-in-95 duration-500">
                                <PerspectiveView
                                    panels={panels}
                                    junctions={junctions}
                                    width={1200}
                                    height={800}
                                    panelHeight={panelHeight}
                                    activePanelId={activePanelId}
                                    onPanelClick={handlePanelFocus}
                                    hardwareFinish={hardwareFinish}
                                    mountingType={mountingType}
                                />
                            </div>
                        ) : step === 'ELEVATION' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8 animate-in zoom-in-95 duration-500">
                                <div className="w-full flex-1 min-h-0 bg-slate-50/30 rounded-[2.5rem] p-6 border border-slate-50">
                                    <ShowerConfiguration
                                        category="square"
                                        panels={derivedModel.panels}
                                        junctions={derivedModel.junctions}
                                        viewMode="exploded"
                                        width={800}
                                        height={350}
                                        scaleOverride={0.15}
                                        isActive={true}
                                        mountingType={mountingType}
                                        hardwareFinish={hardwareFinish}
                                    />
                                </div>
                                <div className="w-full h-40 bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl">
                                    <ShowerConfiguration
                                        category="square"
                                        panels={derivedModel.panels}
                                        junctions={derivedModel.junctions}
                                        viewMode="3d"
                                        width={800}
                                        height={140}
                                        scaleOverride={0.18}
                                        isActive={true}
                                        mountingType={mountingType}
                                        hardwareFinish={hardwareFinish}
                                    />
                                </div>
                            </div>
                        ) : (
                            <PlanView
                                panels={panels}
                                junctions={junctions}
                                leftWall={leftWall}
                                rightWall={rightWall}
                                activePanelId={activePanelId}
                                onPanelClick={handlePanelFocus}
                                onAddLeft={(idx) => insertPanel(idx, 'before')}
                                onAddRight={(idx) => insertPanel(idx, 'after')}
                                onUpdateJunctionAngle={updateJunctionAngle}
                                onToggleWall={(side) => side === 'left' ? setLeftWall(!leftWall) : setRightWall(!rightWall)}
                            />
                        )}
                    </div>

                    {/* Bottom Nav */}
                    <div className="mt-6 flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-2xl border">
                        <Button variant="outline" onClick={() => {
                            setPanels([{ id: 'p-door', type: 'door', width_mm: 700, door_properties: { hinge_side: 'right', swing_direction: 'out' }, notches: { ...defaultNotches }, top_edge: { ...defaultTopEdge } }]);
                            setJunctions([]);
                            setLeftWall(true);
                            setRightWall(true);
                            setActivePanelId('p-door');
                        }} className="h-11 px-6 text-[10px] font-black rounded-xl border-2">
                            <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reset
                        </Button>
                        <div className="flex gap-3">
                            <Button variant="ghost" disabled={step === 'LAYOUT'} onClick={() => {
                                const steps: Step[] = ['LAYOUT', 'DIMENSIONS', 'HARDWARE', 'ELEVATION'];
                                setStep(steps[steps.indexOf(step) - 1]);
                            }} className="h-11 px-6 text-[10px] font-black">
                                <ChevronLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button disabled={step === 'ELEVATION'} onClick={() => {
                                const steps: Step[] = ['LAYOUT', 'DIMENSIONS', 'HARDWARE', 'ELEVATION'];
                                setStep(steps[steps.indexOf(step) + 1]);
                            }} className="h-11 px-10 bg-slate-900 text-white text-[10px] font-black rounded-xl shadow-xl shadow-slate-900/20">
                                Next Step <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
