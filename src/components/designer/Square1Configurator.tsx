import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PlanView } from './PlanView';
import { PerspectiveView } from './PerspectiveView';
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
} from 'lucide-react';
import { ShowerConfiguration } from './ShowerConfiguration';
import { PanelModel, JunctionModel } from '@/types/square';
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
    notches?: {
        bottom_left: boolean;
        bottom_right: boolean;
        width_mm: number;
        height_mm: number;
    };
}

export interface ChainJunction {
    angle_deg: 90 | 180;
}

interface Square1ConfiguratorProps {
    onBackToCategory: () => void;
}

export function Square1Configurator({ onBackToCategory }: Square1ConfiguratorProps) {
    const [step, setStep] = useState<Step>('LAYOUT');

    const [panels, setPanels] = useState<ChainPanel[]>([
        {
            id: 'p-door',
            type: 'door',
            width_mm: 700,
            door_properties: { hinge_side: 'right', swing_direction: 'out' }
        }
    ]);
    const [junctions, setJunctions] = useState<ChainJunction[]>([]);
    const [leftWall, setLeftWall] = useState(true);
    const [rightWall, setRightWall] = useState(true);
    const [activePanelId, setActivePanelId] = useState<string | null>('p-door');
    const [panelHeight, setPanelHeight] = useState(2000);
    const [hardwareFinish, setHardwareFinish] = useState<HardwareFinish>('chrome');
    const [mountingType, setMountingType] = useState<'channel' | 'clamps'>('channel');
    const [isFloorToCeiling, setIsFloorToCeiling] = useState(false);
    const [rakes, setRakes] = useState({
        floor: { amount_mm: 0, direction: 'none' as 'none' | 'left' | 'right' },
        leftWall: { amount_mm: 0, direction: 'none' as 'none' | 'in' | 'out' },
        rightWall: { amount_mm: 0, direction: 'none' as 'none' | 'in' | 'out' },
        floorToCeiling: { amount_mm: 0 } // For floor-to-ceiling mode
    });
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
        const newPanel: ChainPanel = { id: newId, type: 'fixed', width_mm: 600 };
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

    // Calculate total channel length (panel widths + notch heights)
    const calculateTotalChannelLength = () => {
        const totalWidth = panels.reduce((sum, p) => sum + p.width_mm, 0);
        const totalNotchHeight = panels.reduce((sum, p) => {
            if (p.notches && (p.notches.bottom_left || p.notches.bottom_right)) {
                return sum + (p.notches.height_mm || 0);
            }
            return sum;
        }, 0);
        return totalWidth + totalNotchHeight;
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
                plane: 'front', // simplified for now
                hinge_side: p.door_properties?.hinge_side || 'left',
                handle_side: p.door_properties?.hinge_side === 'left' ? 'right' : 'left',
                wall_fix: {
                    left: idx === 0 && leftWall,
                    right: idx === panels.length - 1 && rightWall
                },
                mounting_style: mountingType,
                notches: p.notches || { bottom_left: false, bottom_right: false, width_mm: null, height_mm: null },
                top_edge: { type: 'level', direction: null, drop_mm: null }
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

                    {/* Notch Configuration */}
                    <div className="space-y-3 pt-4 border-t-2 border-blue-100">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Notches</Label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="notch-bl"
                                    checked={activePanel?.notches?.bottom_left || false}
                                    onChange={(e) => {
                                        if (activePanelId) {
                                            setPanels(prev => prev.map(p => p.id === activePanelId ? {
                                                ...p,
                                                notches: { ...p.notches || { bottom_left: false, bottom_right: false, width_mm: 50, height_mm: 50 }, bottom_left: e.target.checked }
                                            } : p));
                                        }
                                    }}
                                    className="w-4 h-4 rounded"
                                />
                                <Label htmlFor="notch-bl" className="text-[8px] font-semibold text-slate-600">Bottom Left Notch</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="notch-br"
                                    checked={activePanel?.notches?.bottom_right || false}
                                    onChange={(e) => {
                                        if (activePanelId) {
                                            setPanels(prev => prev.map(p => p.id === activePanelId ? {
                                                ...p,
                                                notches: { ...p.notches || { bottom_left: false, bottom_right: false, width_mm: 50, height_mm: 50 }, bottom_right: e.target.checked }
                                            } : p));
                                        }
                                    }}
                                    className="w-4 h-4 rounded"
                                />
                                <Label htmlFor="notch-br" className="text-[8px] font-semibold text-slate-600">Bottom Right Notch</Label>
                            </div>
                        </div>

                        {(activePanel?.notches?.bottom_left || activePanel?.notches?.bottom_right) && (
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Width (mm)</Label>
                                    <Input
                                        type="number"
                                        value={activePanel?.notches?.width_mm || 50}
                                        onChange={(e) => {
                                            if (activePanelId) {
                                                setPanels(prev => prev.map(p => p.id === activePanelId ? {
                                                    ...p,
                                                    notches: { ...p.notches || { bottom_left: false, bottom_right: false, width_mm: 50, height_mm: 50 }, width_mm: parseInt(e.target.value) || 50 }
                                                } : p));
                                            }
                                        }}
                                        className="h-8 text-xs font-semibold rounded-lg border-1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Height (mm)</Label>
                                    <Input
                                        type="number"
                                        value={activePanel?.notches?.height_mm || 50}
                                        onChange={(e) => {
                                            if (activePanelId) {
                                                setPanels(prev => prev.map(p => p.id === activePanelId ? {
                                                    ...p,
                                                    notches: { ...p.notches || { bottom_left: false, bottom_right: false, width_mm: 50, height_mm: 50 }, height_mm: parseInt(e.target.value) || 50 }
                                                } : p));
                                            }
                                        }}
                                        className="h-8 text-xs font-semibold rounded-lg border-1"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
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

    const renderDimensionsStep = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Dimensions</h2>
                <p className="text-slate-500 text-sm">Set the standard height for your installation.</p>
            </div>

            <div className="p-6 bg-slate-900 rounded-[2.5rem] shadow-2xl space-y-6">
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Height (mm)</Label>
                        <span className="text-xs font-black text-blue-400">{panelHeight}mm</span>
                    </div>
                    <Input
                        type="number"
                        value={panelHeight}
                        onChange={(e) => updatePanelHeight(parseInt(e.target.value) || 2000)}
                        className="h-16 bg-slate-800 border-none text-white text-xl font-black rounded-2xl focus-visible:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[1900, 2000, 2100].map(h => (
                    <Button
                        key={h}
                        variant={panelHeight === h ? 'secondary' : 'outline'}
                        onClick={() => updatePanelHeight(h)}
                        className={`h-12 text-[10px] font-black rounded-xl border-2 ${panelHeight === h ? 'bg-white border-blue-500 shadow-md' : 'border-slate-100 opacity-60'}`}
                    >
                        {h}mm
                    </Button>
                ))}
            </div>

            {/* Floor to Ceiling Mode */}
            <div className="space-y-3">
                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Height Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant={!isFloorToCeiling ? 'default' : 'outline'}
                        onClick={() => setIsFloorToCeiling(false)}
                        className="h-10 text-[9px] font-black uppercase rounded-xl"
                    >
                        Standard
                    </Button>
                    <Button
                        variant={isFloorToCeiling ? 'default' : 'outline'}
                        onClick={() => setIsFloorToCeiling(true)}
                        className="h-10 text-[9px] font-black uppercase rounded-xl"
                    >
                        Floor to Ceiling
                    </Button>
                </div>
            </div>

            {/* Rake Measurements */}
            <div className="space-y-4 pt-4 border-t-2 border-slate-200">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Surface Rakes</Label>

                {/* Rake Visualization Diagrams */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                    {/* Floor Rake Diagram */}
                    <div className="space-y-2">
                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Floor Rake</p>
                        <svg viewBox="0 0 120 80" className="w-full h-auto border border-slate-200 rounded">
                            {/* Base line */}
                            <line x1="10" y1="60" x2="110" y2="60" stroke="#cbd5e1" strokeWidth="1" />
                            {/* Left side (higher) */}
                            <line x1="10" y1="60" x2="10" y2="30" stroke="#64748b" strokeWidth="2" />
                            {/* Right side (lower) */}
                            <line x1="110" y1="60" x2="110" y2="40" stroke="#64748b" strokeWidth="2" />
                            {/* Slope line */}
                            <line x1="10" y1="30" x2="110" y2="40" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" />
                            {/* Direction arrow for left */}
                            {rakes.floor.direction === 'left' && <path d="M 20 50 L 15 40 L 25 40" fill="#ef4444" />}
                            {/* Direction arrow for right */}
                            {rakes.floor.direction === 'right' && <path d="M 100 50 L 105 40 L 95 40" fill="#ef4444" />}
                            {/* Labels */}
                            <text x="5" y="75" className="text-[10px] font-bold fill-slate-600">Left</text>
                            <text x="100" y="75" className="text-[10px] font-bold fill-slate-600">Right</text>
                        </svg>
                    </div>

                    {/* Wall Rake Diagram */}
                    {(leftWall || rightWall) && (
                        <div className="space-y-2">
                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Wall Rake</p>
                            <svg viewBox="0 0 120 80" className="w-full h-auto border border-slate-200 rounded">
                                {/* Vertical reference */}
                                <line x1="20" y1="10" x2="20" y2="70" stroke="#cbd5e1" strokeWidth="1" />
                                {/* Wall straight (in) */}
                                {(leftWall && rakes.leftWall.direction === 'none') || (rightWall && rakes.rightWall.direction === 'none') ? (
                                    <line x1="20" y1="10" x2="20" y2="70" stroke="#64748b" strokeWidth="2" />
                                ) : null}
                                {/* Wall in */}
                                {(leftWall && rakes.leftWall.direction === 'in') || (rightWall && rakes.rightWall.direction === 'in') ? (
                                    <line x1="20" y1="10" x2="30" y2="70" stroke="#64748b" strokeWidth="2" />
                                ) : null}
                                {/* Wall out */}
                                {(leftWall && rakes.leftWall.direction === 'out') || (rightWall && rakes.rightWall.direction === 'out') ? (
                                    <line x1="20" y1="10" x2="10" y2="70" stroke="#64748b" strokeWidth="2" />
                                ) : null}
                                {/* Reference vertical */}
                                <line x1="50" y1="10" x2="50" y2="70" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
                                {/* Labels */}
                                <text x="8" y="75" className="text-[10px] font-bold fill-slate-600">Wall</text>
                                <text x="45" y="75" className="text-[10px] font-bold fill-slate-600">Plumb</text>
                            </svg>
                        </div>
                    )}
                </div>

                {/* Floor Rake */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center">
                        <Label className="text-[8px] font-semibold text-slate-600">Floor Rake (mm)</Label>
                        <span className="text-[10px] font-black text-blue-600">{rakes.floor.amount_mm}mm</span>
                    </div>
                    <Input
                        type="number"
                        value={rakes.floor.amount_mm}
                        onChange={(e) => setRakes(prev => ({ ...prev, floor: { ...prev.floor, amount_mm: parseInt(e.target.value) || 0 } }))}
                        className="h-8 text-xs font-semibold rounded-lg border-1"
                    />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {(['none', 'left', 'right'] as const).map((dir) => (
                            <Button
                                key={dir}
                                variant={rakes.floor.direction === dir ? 'default' : 'outline'}
                                onClick={() => setRakes(prev => ({ ...prev, floor: { ...prev.floor, direction: dir } }))}
                                className="h-8 text-[8px] font-bold uppercase rounded-lg"
                            >
                                {dir}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Left Wall Rake */}
                {leftWall && (
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <Label className="text-[8px] font-semibold text-slate-600">Left Wall Rake (mm)</Label>
                            <span className="text-[10px] font-black text-blue-600">{rakes.leftWall.amount_mm}mm</span>
                        </div>
                        <Input
                            type="number"
                            value={rakes.leftWall.amount_mm}
                            onChange={(e) => setRakes(prev => ({ ...prev, leftWall: { ...prev.leftWall, amount_mm: parseInt(e.target.value) || 0 } }))}
                            className="h-8 text-xs font-semibold rounded-lg border-1"
                        />
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {(['none', 'in', 'out'] as const).map((dir) => (
                                <Button
                                    key={dir}
                                    variant={rakes.leftWall.direction === dir ? 'default' : 'outline'}
                                    onClick={() => setRakes(prev => ({ ...prev, leftWall: { ...prev.leftWall, direction: dir } }))}
                                    className="h-8 text-[8px] font-bold uppercase rounded-lg"
                                >
                                    {dir}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Right Wall Rake */}
                {rightWall && (
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <Label className="text-[8px] font-semibold text-slate-600">Right Wall Rake (mm)</Label>
                            <span className="text-[10px] font-black text-blue-600">{rakes.rightWall.amount_mm}mm</span>
                        </div>
                        <Input
                            type="number"
                            value={rakes.rightWall.amount_mm}
                            onChange={(e) => setRakes(prev => ({ ...prev, rightWall: { ...prev.rightWall, amount_mm: parseInt(e.target.value) || 0 } }))}
                            className="h-8 text-xs font-semibold rounded-lg border-1"
                        />
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {(['none', 'in', 'out'] as const).map((dir) => (
                                <Button
                                    key={dir}
                                    variant={rakes.rightWall.direction === dir ? 'default' : 'outline'}
                                    onClick={() => setRakes(prev => ({ ...prev, rightWall: { ...prev.rightWall, direction: dir } }))}
                                    className="h-8 text-[8px] font-bold uppercase rounded-lg"
                                >
                                    {dir}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Floor to Ceiling Rake */}
                {isFloorToCeiling && (
                    <div className="space-y-2 p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
                        <div className="flex justify-between items-center">
                            <Label className="text-[8px] font-semibold text-amber-700">Floor to Ceiling Rake (mm)</Label>
                            <span className="text-[10px] font-black text-amber-600">{rakes.floorToCeiling.amount_mm}mm</span>
                        </div>
                        <Input
                            type="number"
                            value={rakes.floorToCeiling.amount_mm}
                            onChange={(e) => setRakes(prev => ({ ...prev, floorToCeiling: { amount_mm: parseInt(e.target.value) || 0 } }))}
                            className="h-8 text-xs font-semibold rounded-lg border-1"
                        />
                    </div>
                )}
            </div>
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

            <div className="p-6 bg-orange-500 rounded-[2rem] text-white shadow-xl">
                <h4 className="font-black uppercase tracking-widest text-[11px] mb-3">Channel Calculation</h4>
                <div className="space-y-2 text-[10px] font-bold text-orange-50">
                    <div className="flex justify-between items-center pb-2 border-b border-orange-400">
                        <span>Base channel length (panels):</span>
                        <span className="font-black text-sm">{panels.reduce((sum, p) => sum + p.width_mm, 0)}mm</span>
                    </div>
                    {panels.some(p => p.notches && (p.notches.bottom_left || p.notches.bottom_right)) && (
                        <div className="flex justify-between items-center pb-2 border-b border-orange-400">
                            <span>Notch extensions (height):</span>
                            <span className="font-black text-sm">+{panels.reduce((sum, p) => {
                                if (p.notches && (p.notches.bottom_left || p.notches.bottom_right)) {
                                    return sum + (p.notches.height_mm || 0);
                                }
                                return sum;
                            }, 0)}mm</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                        <span className="font-black text-sm">TOTAL CHANNEL REQUIRED:</span>
                        <span className="font-black text-lg">{calculateTotalChannelLength()}mm</span>
                    </div>
                </div>
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
                                {step === 'LAYOUT' ? 'Top-Down Plan' : step === 'HARDWARE' ? 'Style Preview' : '3D Perspective'}
                            </Label>
                        </div>

                        {step === 'DIMENSIONS' || step === 'HARDWARE' ? (
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
                            setPanels([{ id: 'p-door', type: 'door', width_mm: 700, door_properties: { hinge_side: 'right', swing_direction: 'out' } }]);
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
