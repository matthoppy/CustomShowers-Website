import React, { useState, useEffect } from 'react';
import {
    SquareConfigOutput,
    SquareScreen,
    PanelModel,
    PanelType,
    PlaneType,
    JunctionModel
} from '@/types/square';
import { SQUARE_TEMPLATES } from '@/lib/squareTemplates';
import { ShowerConfiguration } from './ShowerConfiguration';
import { FabricationPreview } from './FabricationPreview';
import { ExplodedPanelView } from './ExplodedPanelView';
import { DimensionsInput } from './DimensionsInput';
import { GlassFabricationDiagram } from './GlassFabricationDiagram';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    LayoutGrid,
    ArrowRight,
    Plus,
    Ruler,
    FileCheck,
    ChevronLeft,
    CheckCircle2,
    ShieldCheck,
    Trash2,
    Scissors,
    Info // Added
} from 'lucide-react';

// Technical Constants for Fabrication
const CHANNEL_DEPTH_MM = 19;
const GLASS_THICKNESS_MM = 10;
const SILICONE_GAP_MM = 2;
const CHANNEL_THICKNESS_MM = 1;

interface SquareConfiguratorProps {
    onBackToCategory: () => void;
}

const INITIAL_STATE: SquareConfigOutput = {
    screen: 'template-select',
    family: 'square',
    return_angle_deg: 90,
    auto_build: false,
    description_parsed: '',
    panels: [],
    junctions: [],
    preview: {
        asset_id: null,
        hardware_colour: 'chrome',
        active_panel_id: null,
        active_junction_id: null,
        overlays: []
    },
    state: {
        baseType: 'l-left',
        doorVariant: 'right',
        mountingType: 'channel',
        mountingSide: 'left',
        height_mode: 'standard',
        seals_required: true,
        threshold_type: 'none',
        hardware_finish: 'chrome',
        ceiling_air_gap_mm: 40,
        measurements: {},
        derived: {},
        deductions: {},
        warnings: [],
        realWidthMm: 900,
        realHeightMm: 2000,
        notches: [],
        isFloorToCeiling: false,
        // Support structures
        support_panel: {
            required: false,
            thickness_mm: 6,
            strap_width_mm: 10,
            head_deduction_mm: 0,
            spans_between: {
                from_panel_id: null,
                to_panel_id: null
            },
            span_mm: null,
            notes: ''
        },
        support_bars: []
    },
    next_required_inputs: [],
    questions: []
};

// Helper to create a new panel
const createPanel = (id: string, type: PanelType, plane: PlaneType, index: number): PanelModel => ({
    panel_id: id,
    panel_type: type,
    plane: plane,
    position_index: index,
    hinge_side: type === 'door_hinged' ? 'left' : null,
    handle_side: type === 'door_hinged' ? 'right' : null,
    notches: {
        bottom_left: false,
        bottom_right: false,
        width_mm: null,
        height_mm: null
    },
    top_edge: {
        type: 'level',
        direction: null,
        drop_mm: null
    },
    mounting_style: 'channel',
    wall_fix: { left: false, right: false },
    door_swing: type === 'door_hinged' ? 'outward' : null,
    width_mm: 300,
    height_mm: 2000
});

export const SquareConfigurator: React.FC<SquareConfiguratorProps> = ({ onBackToCategory }) => {
    const [config, setConfig] = useState<SquareConfigOutput>(INITIAL_STATE);
    const [draftPanel, setDraftPanel] = useState<PanelModel | null>(null);

    const updateState = (updates: Partial<typeof config.state>) => {
        setConfig(prev => ({
            ...prev,
            state: { ...prev.state, ...updates }
        }));
    };

    const handleTemplateSelect = (baseType: string) => {
        let initialPanels: PanelModel[] = [];

        if (baseType === 'l-left') {
            initialPanels = [
                createPanel('P1', 'fixed', 'return_left', 0),
                createPanel('P2', 'door_hinged', 'front', 1)
            ];
            initialPanels[0].wall_fix.left = true;
            initialPanels[1].handle_side = 'left';
            initialPanels[1].hinge_side = 'right';
            initialPanels[1].hinge_type = 'wall-to-glass';
        } else if (baseType === 'l-right') {
            initialPanels = [
                createPanel('P1', 'door_hinged', 'front', 0),
                createPanel('P2', 'fixed', 'return_right', 1)
            ];
            initialPanels[0].handle_side = 'right';
            initialPanels[0].hinge_side = 'left';
            initialPanels[0].hinge_type = 'wall-to-glass';
            initialPanels[1].wall_fix.right = true;
        }

        // Create initial junction
        const initialJunctions: JunctionModel[] = [{
            junction_id: 'J1',
            a_panel_id: 'P1',
            a_edge: 'right',
            b_panel_id: 'P2',
            b_edge: 'left',
            angle_deg: 90, // Corner for L-shape
            junction_type: 'glass_to_glass'
        }];

        setConfig(prev => ({
            ...prev,
            panels: initialPanels,
            junctions: initialJunctions,
            state: { ...prev.state, baseType },
            screen: 'customise',
            preview: { ...prev.preview, active_panel_id: initialPanels[0].panel_id }
        }));
    };

    const getPreviewPanels = (baseType: string) => {
        if (baseType === 'l-left') {
            const p1 = createPanel('P1', 'fixed', 'return_left', 0);
            p1.wall_fix.left = true;
            const p2 = createPanel('P2', 'door_hinged', 'front', 1);
            p2.handle_side = 'left';
            p2.hinge_side = 'right';
            p2.hinge_type = 'wall-to-glass';
            return [p1, p2];
        } else if (baseType === 'l-right') {
            const p1 = createPanel('P1', 'door_hinged', 'front', 0);
            p1.handle_side = 'right';
            p1.hinge_side = 'left';
            p1.hinge_type = 'wall-to-glass';
            const p2 = createPanel('P2', 'fixed', 'return_right', 1);
            p2.wall_fix.right = true;
            return [p1, p2];
        }
        return [];
    };

    const addPanel = () => {
        const nextId = `P${config.panels.length + 1}`;
        const lastPanel = config.panels[config.panels.length - 1];
        let nextPlane: PlaneType = 'front';

        if (lastPanel.plane === 'return_left') nextPlane = 'front';
        else if (lastPanel.plane === 'front' && config.panels.length > 2) nextPlane = 'return_right';

        const newPanel = createPanel(nextId, 'fixed', nextPlane, config.panels.length);
        setConfig(prev => ({
            ...prev,
            panels: [...prev.panels, newPanel],
            preview: { ...prev.preview, active_panel_id: nextId }
        }));
    };

    const addDoor = () => {
        const nextId = `P${config.panels.length + 1}`;
        const lastPanel = config.panels[config.panels.length - 1];
        let nextPlane: PlaneType = 'front';

        if (lastPanel.plane === 'return_left') nextPlane = 'front';
        else if (lastPanel.plane === 'front' && config.panels.length > 2) nextPlane = 'return_right';

        const newDoor = createPanel(nextId, 'door_hinged', nextPlane, config.panels.length);
        newDoor.hinge_side = 'left';
        newDoor.handle_side = 'right';
        newDoor.hinge_type = 'glass-to-glass-180';

        setConfig(prev => ({
            ...prev,
            panels: [...prev.panels, newDoor],
            preview: { ...prev.preview, active_panel_id: nextId }
        }));
    };

    const removePanel = (id: string) => {
        if (config.panels.length <= 1) return;
        setConfig(prev => ({
            ...prev,
            panels: prev.panels.filter(p => p.panel_id !== id),
            preview: { ...prev.preview, active_panel_id: null }
        }));
    };

    const updatePanel = (id: string, updates: Partial<PanelModel>) => {
        setConfig(prev => ({
            ...prev,
            panels: prev.panels.map(p => p.panel_id === id ? { ...p, ...updates } : p)
        }));
    };

    const toggleNotch = (id: string, corner: 'bottom_left' | 'bottom_right') => {
        const panel = config.panels.find(p => p.panel_id === id);
        if (!panel) return;

        updatePanel(id, {
            notches: {
                ...panel.notches,
                [corner]: !panel.notches[corner]
            }
        });
    };

    // Auto-rename panels P1, P2, P3... based on position
    const renamePanels = (panels: PanelModel[]): PanelModel[] => {
        return panels
            .sort((a, b) => a.position_index - b.position_index)
            .map((p, i) => ({
                ...p,
                panel_id: `P${i + 1}`,
                position_index: i
            }));
    };

    // Create junctions between adjacent panels
    const createJunctions = (panels: PanelModel[]): JunctionModel[] => {
        const junctions: JunctionModel[] = [];
        const sortedPanels = [...panels].sort((a, b) => a.position_index - b.position_index);

        for (let i = 0; i < sortedPanels.length - 1; i++) {
            const p1 = sortedPanels[i];
            const p2 = sortedPanels[i + 1];

            // Determine default angle based on planes
            let defaultAngle = 180;
            if (p1.plane !== p2.plane) {
                defaultAngle = 90; // Corner between different planes
            }

            junctions.push({
                junction_id: `J${i + 1}`,
                a_panel_id: p1.panel_id,
                a_edge: 'right',
                b_panel_id: p2.panel_id,
                b_edge: 'left',
                angle_deg: defaultAngle,
                junction_type: 'glass_to_glass'
            });
        }

        return junctions;
    };

    // Add panel at specific index
    const addPanelAtIndex = (atIndex: number) => {
        const newPanel = createPanel('temp', 'fixed', 'front', atIndex);

        // Insert at correct position
        const newPanels = [...config.panels];
        newPanels.splice(atIndex, 0, newPanel);

        // Update position indices
        newPanels.forEach((p, i) => p.position_index = i);

        // Rename all panels
        const renamedPanels = renamePanels(newPanels);
        const newJunctions = createJunctions(renamedPanels);

        // Recalculate planes based on existing junction angles
        // This ensures new panels get the correct plane if their neighbor has a 90° junction
        const sortedPanels = [...renamedPanels].sort((a, b) => a.position_index - b.position_index);
        for (let i = 0; i < sortedPanels.length - 1; i++) {
            const p1 = sortedPanels[i];
            const p2 = sortedPanels[i + 1];
            const junction = newJunctions.find(j =>
                (j.a_panel_id === p1.panel_id && j.b_panel_id === p2.panel_id) ||
                (j.b_panel_id === p1.panel_id && j.a_panel_id === p2.panel_id)
            );

            if (junction) {
                if (junction.angle_deg === 180) {
                    p2.plane = p1.plane;
                } else if (junction.angle_deg === 90 || junction.angle_deg === 135) {
                    if (p1.plane === 'return_left') p2.plane = 'front';
                    else if (p1.plane === 'front') p2.plane = 'return_right';
                }
            }
        }

        setConfig(prev => ({
            ...prev,
            panels: sortedPanels,
            junctions: newJunctions,
            preview: { ...prev.preview, active_panel_id: sortedPanels[atIndex].panel_id }
        }));
    };

    // Delete panel and re-index
    const deletePanelById = (panelId: string) => {
        if (config.panels.length <= 2) return;

        const filteredPanels = config.panels.filter(p => p.panel_id !== panelId);
        filteredPanels.forEach((p, i) => p.position_index = i);

        const renamedPanels = renamePanels(filteredPanels);
        const newJunctions = createJunctions(renamedPanels);

        setConfig(prev => ({
            ...prev,
            panels: renamedPanels,
            junctions: newJunctions,
            preview: { ...prev.preview, active_panel_id: null }
        }));
    };

    // Update junction angle and propagate plane changes
    const updateJunctionAngle = (junctionId: string, angle: number) => {
        setConfig(prev => {
            const nextJunctions = prev.junctions.map(j =>
                j.junction_id === junctionId ? { ...j, angle_deg: angle } : j
            );

            // Re-calculate planes based on angles starting from p1
            const sortedPanels = [...prev.panels].sort((a, b) => a.position_index - b.position_index);
            const nextPanels = [...sortedPanels];

            for (let i = 0; i < nextPanels.length - 1; i++) {
                const p1 = nextPanels[i];
                const p2 = nextPanels[i + 1];
                const junction = nextJunctions.find(j =>
                    (j.a_panel_id === p1.panel_id && j.b_panel_id === p2.panel_id) ||
                    (j.b_panel_id === p1.panel_id && j.a_panel_id === p2.panel_id)
                );

                if (junction) {
                    if (junction.angle_deg === 180) {
                        // Inline - normalize to front if either is front, else follow p1
                        if (p1.plane === 'front' || p2.plane === 'front') {
                            p1.plane = 'front';
                            p2.plane = 'front';
                        } else {
                            p2.plane = p1.plane;
                        }
                    } else if (junction.angle_deg === 90 || junction.angle_deg === 135) {
                        // Turning - change plane
                        if (p1.plane === 'return_left') p2.plane = 'front';
                        else if (p1.plane === 'front') p2.plane = 'return_right';
                    }
                }
            }

            // Secondary pass to ensure all inline panels are consistent
            for (let i = 0; i < nextPanels.length - 1; i++) {
                const p1 = nextPanels[i];
                const p2 = nextPanels[i + 1];
                const junction = nextJunctions.find(j =>
                    (j.a_panel_id === p1.panel_id && j.b_panel_id === p2.panel_id) ||
                    (j.b_panel_id === p1.panel_id && j.a_panel_id === p2.panel_id)
                );
                if (junction && junction.angle_deg === 180) {
                    p2.plane = p1.plane;
                }
            }

            return {
                ...prev,
                junctions: nextJunctions,
                panels: nextPanels
            };
        });
    };

    // Select panel
    const selectPanel = (panelId: string) => {
        const panel = config.panels.find(p => p.panel_id === panelId);
        setConfig(prev => ({
            ...prev,
            preview: { ...prev.preview, active_panel_id: panelId, active_junction_id: null }
        }));

        if (panel) {
            setDraftPanel(JSON.parse(JSON.stringify(panel))); // Deep copy for draft
        } else {
            setDraftPanel(null);
        }
    };

    const updateDraftPanel = (updates: Partial<PanelModel>) => {
        setDraftPanel(prev => prev ? { ...prev, ...updates } : null);
    };

    const confirmPanel = () => {
        if (!draftPanel) return;
        updatePanel(draftPanel.panel_id, draftPanel);
        setConfig(prev => ({
            ...prev,
            preview: { ...prev.preview, active_panel_id: null }
        }));
        setDraftPanel(null);
    };

    // Select junction
    const selectJunction = (junctionId: string) => {
        setConfig(prev => ({
            ...prev,
            preview: { ...prev.preview, active_panel_id: null, active_junction_id: junctionId }
        }));
    };

    // Update panel type
    const updatePanelType = (panelId: string, type: PanelType) => {
        updatePanel(panelId, {
            panel_type: type,
            door_swing: type === 'door_hinged' ? 'outward' : null,
        });
        // Logic for wall_fix and hinge_type is handled by auto-calculations in effects or render
    };

    // Auto-calculate logic
    useEffect(() => {
        if (config.panels.length > 0) {
            const updatedPanels = config.panels.map((p, i) => {
                const isFirst = i === 0;
                const isLast = i === config.panels.length - 1;

                // End panels always have wall fix running up or clamps
                const wallFix = {
                    left: isFirst,
                    right: isLast
                };

                let hingeType = p.hinge_type;
                if (p.panel_type === 'door_hinged') {
                    if (isFirst || isLast) {
                        hingeType = 'wall-to-glass';
                    } else {
                        // Find junction angle
                        const prevPanel = config.panels[i - 1];
                        const nextPanel = config.panels[i + 1];
                        // If it's a door, we need to know which side it hangs from.
                        // For simplicity, let's assume it hangs from the previous panel if not at the start.
                        const junction = config.junctions.find(j =>
                            (j.a_panel_id === p.panel_id || j.b_panel_id === p.panel_id) &&
                            (j.a_panel_id === prevPanel.panel_id || j.b_panel_id === prevPanel.panel_id)
                        );
                        const angle = junction?.angle_deg || 180;
                        hingeType = `glass-to-glass-${angle}` as any;
                    }
                }

                return {
                    ...p,
                    wall_fix: wallFix,
                    hinge_type: hingeType,
                    mounting_style: config.state.mountingType // Global mounting style
                };
            });

            // Only update if something changed to avoid infinite loop
            const hasChanges = JSON.stringify(updatedPanels) !== JSON.stringify(config.panels);
            if (hasChanges) {
                setConfig(prev => ({ ...prev, panels: updatedPanels }));
            }
        }
    }, [config.panels.length, config.state.mountingType, config.junctions]);

    // Update a measurement value
    const updateMeasurement = (key: string, value: number) => {
        if (key === 'height') {
            updateState({ realHeightMm: value });
        } else if (key.includes('_width')) {
            // Update panel width
            const panelId = key.replace('_width', '');
            updatePanel(panelId, { width_mm: value });
        } else if (key.includes('_door_opening')) {
            // Store door opening width in measurements
            updateState({
                measurements: {
                    ...config.state.measurements,
                    [key]: value
                }
            });
        }
    };

    // Create measurements object from state
    const currentMeasurements: Record<string, number> = {
        height: config.state.realHeightMm || 2000,
        ...config.panels.reduce((acc, p) => ({
            ...acc,
            [`${p.panel_id}_width`]: p.width_mm || 0
        }), {}),
        ...config.state.measurements
    };

    const activePanel = config.panels.find(p => p.panel_id === config.preview.active_panel_id);

    const renderTemplateSelect = () => (
        <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <LayoutGrid className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">How does your shower start?</h2>
                <p className="text-slate-500 font-medium text-lg">Pick a base layout and global hardware preference.</p>
            </div>

            <div className="flex flex-col items-center gap-6 max-w-xl mx-auto mb-12">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Global Mounting Hardware</Label>
                <div className="grid grid-cols-2 gap-4 w-full">
                    {[
                        { id: 'channel', label: 'U-Channel', description: 'Clean, minimalist recessed look' },
                        { id: 'clamps', label: 'Clamps', description: 'Industrial, statement hardware' }
                    ].map((style) => (
                        <Card
                            key={style.id}
                            className={`cursor-pointer border-2 transition-all p-4 rounded-2xl flex flex-col items-center gap-2 ${config.state.mountingType === style.id ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                            onClick={() => updateState({ mountingType: style.id as any })}
                        >
                            <span className={`text-[11px] font-black uppercase tracking-widest ${config.state.mountingType === style.id ? 'text-blue-700' : 'text-slate-900'}`}>{style.label}</span>
                            <span className="text-[9px] text-slate-400 font-medium text-center">{style.description}</span>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex justify-center gap-8 max-w-4xl mx-auto">
                {SQUARE_TEMPLATES.map((template) => (

                    <Card
                        key={template.id}
                        className={`group cursor-pointer border-2 transition-all hover:shadow-2xl rounded-[2.5rem] overflow-hidden w-full md:w-[calc(50%-1rem)] max-w-sm ${config.state.baseType === template.baseType ? 'border-primary ring-4 ring-primary/5' : 'border-slate-100'}`}
                        onClick={() => handleTemplateSelect(template.baseType)}
                    >
                        <div className="aspect-square bg-slate-50 relative flex items-center justify-center p-4">
                            <ShowerConfiguration
                                category="square"
                                panels={getPreviewPanels(template.baseType)}
                                width={220}
                                height={220}
                                realWidthMm={900}
                                realHeightMm={2000}
                                scaleOverride={0.06}
                                hideDimensions={true}
                                isActive={true}
                            />
                        </div>

                        <CardContent className="p-8 text-center bg-white border-t">
                            <h3 className="font-black text-slate-900 uppercase tracking-widest mb-2">{template.name}</h3>
                            <p className="text-xs text-slate-400 font-bold leading-relaxed">{template.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-center pt-8">
                <Button
                    onClick={onBackToCategory}
                    className="h-12 px-8 bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] rounded-full shadow-sm transition-all"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Category Selection
                </Button>
            </div>
        </div>
    );

    const renderCustomise = () => (
        <div className="flex flex-col gap-10 py-4 animate-in fade-in duration-500">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
                {/* Left Column: Primary Visuals + Summary */}
                <div className="space-y-6 lg:sticky lg:top-6">
                    <div className="relative aspect-[21/10] bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                        <ShowerConfiguration
                            category="square"
                            baseType={config.state.baseType}
                            panels={config.panels}
                            junctions={config.junctions}
                            viewMode="exploded"
                            activePanelId={config.preview.active_panel_id}
                            activeJunctionId={config.preview.active_junction_id}
                            onPanelClick={(id) => setConfig(prev => ({ ...prev, preview: { ...prev.preview, active_panel_id: id } }))}
                            onJunctionSelect={(id) => setConfig(prev => ({ ...prev, preview: { ...prev.preview, active_junction_id: id } }))}
                            onAddPanel={addPanelAtIndex}
                            onUpdateJunctionAngle={updateJunctionAngle}
                            doorVariant={config.state.doorVariant}
                            mountingType={config.state.mountingType}
                            mountingSide={config.state.mountingSide}
                            realWidthMm={config.state.realWidthMm}
                            realHeightMm={config.state.realHeightMm}
                            isActive={true}
                            hideDimensions={true}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <section className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Quick Actions</Label>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {config.panels.length} Panels
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    onClick={addPanel}
                                    className="h-11 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Panel
                                </Button>
                                <Button
                                    onClick={addDoor}
                                    className="h-11 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Door
                                </Button>
                            </div>
                        </section>

                        <section className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl border border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck className="w-4 h-4 text-blue-300" />
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Live Summary</Label>
                            </div>
                            <div className="space-y-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                <div className="flex justify-between">
                                    <span>Mounting</span>
                                    <span className="text-white">{config.state.mountingType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Width</span>
                                    <span className="text-white">{config.state.realWidthMm}mm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Height</span>
                                    <span className="text-white">{config.state.realHeightMm}mm</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-6 left-6 flex items-center gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">3D Reference</Label>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                        <div className="w-96 h-96 flex items-center justify-center">
                            <ShowerConfiguration
                                category="square"
                                panels={config.panels}
                                junctions={config.junctions}
                                viewMode="3d"
                                width={400}
                                height={400}
                                realWidthMm={config.state.realWidthMm}
                                realHeightMm={config.state.realHeightMm}
                                scaleOverride={0.4}
                                hideDimensions={true}
                                isActive={true}
                                activePanelId={config.preview.active_panel_id}
                                onPanelClick={(id) => setConfig(prev => ({ ...prev, preview: { ...prev.preview, active_panel_id: id } }))}
                            />
                        </div>
                        <div className="mt-4 px-5 py-2 bg-blue-600 rounded-full shadow-lg shadow-blue-200">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Perspective</span>
                        </div>
                    </section>
                </div>

                {/* Right Column: Builder + Editors */}
                <div className="space-y-6">
                    <section className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Layout Builder</h3>
                                <p className="text-[11px] text-slate-500 font-medium">Click a panel or junction to edit. Use add buttons to extend the run.</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Step 2 of 4
                                <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full w-1/2 bg-slate-900" />
                                </div>
                            </div>
                        </div>

                        <ExplodedPanelView
                            panels={config.panels}
                            junctions={config.junctions}
                            activePanelId={config.preview.active_panel_id}
                            activeJunctionId={config.preview.active_junction_id}
                            onPanelSelect={selectPanel}
                            onJunctionSelect={selectJunction}
                            onAddPanel={addPanelAtIndex}
                            onDeletePanel={deletePanelById}
                            onUpdateJunctionAngle={updateJunctionAngle}
                            onUpdatePanelType={updatePanelType}
                            minPanels={2}
                            activeEditor={draftPanel ? (
                                <section className="space-y-6 p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                                                {draftPanel.panel_id}
                                            </div>
                                            <Label className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900">Configuring {draftPanel.panel_id}</Label>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-500 text-slate-300 transition-colors"
                                            onClick={() => deletePanelById(draftPanel.panel_id)}
                                            title="Delete Panel"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left Column: Basic Info & Door Logic */}
                                        <div className="space-y-6">
                                            {/* Wall Fixings (Read-only status) */}
                                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Wall Fixings</span>
                                                    <span className="text-[9px] font-black text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">AUTO-APPLIED</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {draftPanel.wall_fix.left && <span className="text-[8px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1.5 rounded-lg shadow-sm">Left Wall Contact</span>}
                                                    {draftPanel.wall_fix.right && <span className="text-[8px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1.5 rounded-lg shadow-sm">Right Wall Contact</span>}
                                                    {!draftPanel.wall_fix.left && !draftPanel.wall_fix.right && <span className="text-[8px] font-bold text-slate-400 italic">No wall contact detected</span>}
                                                </div>
                                            </div>

                                            {/* Panel Type Selector */}
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Panel Type</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { id: 'fixed' as PanelType, label: 'Fixed Panel' },
                                                        { id: 'door_hinged' as PanelType, label: 'Hinged Door' }
                                                    ].map((type) => (
                                                        <Button
                                                            key={type.id}
                                                            variant={draftPanel.panel_type === type.id ? 'default' : 'outline'}
                                                            onClick={() => updateDraftPanel({
                                                                panel_type: type.id,
                                                                door_swing: type.id === 'door_hinged' ? 'outward' : null
                                                            })}
                                                            className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${draftPanel.panel_type === type.id ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                        >
                                                            {type.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            {draftPanel.panel_type === 'door_hinged' && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Door Swing Direction</Label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {['inward', 'outward', 'both'].map((swing) => (
                                                                <Button
                                                                    key={swing}
                                                                    variant={draftPanel.door_swing === swing ? 'default' : 'outline'}
                                                                    onClick={() => updateDraftPanel({ door_swing: swing as any })}
                                                                    className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${draftPanel.door_swing === swing ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                                >
                                                                    {swing}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                                                        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                        <div className="space-y-1">
                                                            <span className="text-[9px] font-black text-amber-900 uppercase block tracking-wider">Note: Door Handing</span>
                                                            <p className="text-[9px] text-amber-800/70 font-medium leading-relaxed">
                                                                Handing is automatically derived from junction position.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column: Notches & Slopes */}
                                        <div className="space-y-6">
                                            {/* Bottom Notches */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bottom Notches</Label>
                                                    {draftPanel.panel_type === 'door_hinged' && draftPanel.notches.bottom_left && (
                                                        <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">Clearance Warning</span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant={draftPanel.notches.bottom_left ? 'default' : 'outline'}
                                                        onClick={() => updateDraftPanel({
                                                            notches: { ...draftPanel.notches, bottom_left: !draftPanel.notches.bottom_left }
                                                        })}
                                                        className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${draftPanel.notches.bottom_left ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                    >
                                                        Bottom Left
                                                    </Button>
                                                    <Button
                                                        variant={draftPanel.notches.bottom_right ? 'default' : 'outline'}
                                                        onClick={() => updateDraftPanel({
                                                            notches: { ...draftPanel.notches, bottom_right: !draftPanel.notches.bottom_right }
                                                        })}
                                                        className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${draftPanel.notches.bottom_right ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                    >
                                                        Bottom Right
                                                    </Button>
                                                </div>

                                                {(draftPanel.notches.bottom_left || draftPanel.notches.bottom_right) && (
                                                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] font-bold text-slate-400">Notch Width (mm)</Label>
                                                            <Input
                                                                type="number"
                                                                value={draftPanel.notches.width_mm || ''}
                                                                onChange={(e) => updateDraftPanel({ notches: { ...draftPanel.notches, width_mm: parseInt(e.target.value) || null } })}
                                                                placeholder="e.g. 50"
                                                                className="h-9 text-xs rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] font-bold text-slate-400">Notch Height (mm)</Label>
                                                            <Input
                                                                type="number"
                                                                value={draftPanel.notches.height_mm || ''}
                                                                onChange={(e) => updateDraftPanel({ notches: { ...draftPanel.notches, height_mm: parseInt(e.target.value) || null } })}
                                                                placeholder="e.g. 50"
                                                                className="h-9 text-xs rounded-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sloped Top */}
                                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sloped Ceiling</Label>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant={draftPanel.top_edge.type === 'level' ? 'default' : 'outline'}
                                                        onClick={() => updateDraftPanel({ top_edge: { type: 'level', direction: null, drop_mm: null } })}
                                                        className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${draftPanel.top_edge.type === 'level' ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                    >
                                                        Level Top
                                                    </Button>
                                                    <Button
                                                        variant={draftPanel.top_edge.type === 'sloped' ? 'default' : 'outline'}
                                                        onClick={() => updateDraftPanel({
                                                            top_edge: { ...draftPanel.top_edge, type: 'sloped', direction: draftPanel.top_edge.direction || 'left' as any }
                                                        })}
                                                        className={`h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${draftPanel.top_edge.type === 'sloped' ? 'bg-blue-600 border-blue-600 shadow-md text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                    >
                                                        Sloped Top
                                                    </Button>
                                                </div>

                                                {draftPanel.top_edge.type === 'sloped' && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                        <div className="space-y-3">
                                                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Slope Direction</Label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Button
                                                                    variant={draftPanel.top_edge.direction === 'left' ? 'secondary' : 'outline'}
                                                                    onClick={() => updateDraftPanel({ top_edge: { ...draftPanel.top_edge, direction: 'left' } })}
                                                                    className="h-9 text-[8px] font-black uppercase rounded-lg"
                                                                >
                                                                    Left High
                                                                </Button>
                                                                <Button
                                                                    variant={draftPanel.top_edge.direction === 'right' ? 'secondary' : 'outline'}
                                                                    onClick={() => updateDraftPanel({ top_edge: { ...draftPanel.top_edge, direction: 'right' } })}
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
                                                                value={draftPanel.top_edge.drop_mm || ''}
                                                                onChange={(e) => updateDraftPanel({ top_edge: { ...draftPanel.top_edge, drop_mm: parseInt(e.target.value) || null } })}
                                                                placeholder="e.g. 150"
                                                                className="h-9 text-xs rounded-lg"
                                                            />
                                                        </div>
                                                        {draftPanel.panel_type === 'door_hinged' && (
                                                            <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">
                                                                ⚠️ Confirm Handle/Hinge Clearance
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100 flex justify-end items-center gap-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setConfig(prev => ({ ...prev, preview: { ...prev.preview, active_panel_id: null } }));
                                                setDraftPanel(null);
                                            }}
                                            className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmPanel}
                                            className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
                                        >
                                            Confirm
                                            <ArrowRight className="w-4 h-4 ml-3" />
                                        </Button>
                                    </div>
                                </section>
                            ) : null}
                        />
                    </section>
                </div>
            </div>

            {/* Navigation Bar - NOW AT THE VERY BOTTOM */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mt-2">
                <Button
                    variant="ghost"
                    onClick={() => setConfig(prev => ({ ...prev, screen: 'template-select' }))}
                    className="text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px]"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Restart Layout
                </Button>
                <div className="flex items-center gap-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {config.panels.length} Panels Configured
                    </div>
                    <Button
                        onClick={() => setConfig(prev => ({ ...prev, screen: 'dimensions' }))}
                        className="px-10 h-14 bg-slate-900 border-2 border-slate-900 hover:bg-white hover:text-slate-900 transition-all text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-slate-900/20 group"
                    >
                        Next: Dimensions
                        <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderDimensions = () => (
        <div className="space-y-8 py-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4">
                <Ruler className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                <div>
                    <h4 className="font-black text-amber-900 text-sm uppercase tracking-tight mb-1">Wall Measurements (mm)</h4>
                    <p className="text-[11px] text-amber-800/70 font-medium leading-relaxed">
                        Enter the opening dimensions. We'll automatically calculate individual glass widths.
                    </p>
                </div>
            </div>

            {/* Labeled Dimension Inputs */}
            <DimensionsInput
                panels={config.panels}
                measurements={currentMeasurements}
                onMeasurementChange={updateMeasurement}
                junctions={config.junctions}
                baseType={config.state.baseType}
                realWidthMm={config.state.realWidthMm}
                realHeightMm={config.state.realHeightMm}
                mountingType={config.state.mountingType}
                mountingSide={config.state.mountingSide}
                doorVariant={config.state.doorVariant}
                ceilingRake={config.state.ceilingRake}
                onCeilingRakeChange={(rake) => updateState({ ceilingRake: rake })}
            />

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button
                    variant="ghost"
                    onClick={() => setConfig(prev => ({ ...prev, screen: 'customise' }))}
                    className="text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px]"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Layout
                </Button>
                <Button
                    onClick={() => setConfig(prev => ({ ...prev, screen: 'confirmation' }))}
                    className="px-10 h-14 bg-slate-900 border-2 border-slate-900 hover:bg-white hover:text-slate-900 transition-all text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-slate-900/20 group"
                >
                    Generate Fabrication PDF
                    <FileCheck className="w-4 h-4 ml-3" />
                </Button>
            </div>
        </div>
    );

    const renderConfirmation = () => {
        return (
            <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center border-2 border-green-100 shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Design Locked</h2>
                        <p className="text-slate-500 font-medium text-lg">Your custom configuration is ready for fabrication review.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <Card className="border-2 border-slate-100 shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-8 space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Project Breakdown</h4>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Total Panels', value: `${config.panels.length} units` },
                                        { label: 'Fixed Panels', value: `${config.panels.filter(p => p.panel_type === 'fixed').length}` },
                                        { label: 'Doors', value: `${config.panels.filter(p => p.panel_type === 'door_hinged').length}` },
                                        { label: 'Mounting', value: config.state.mountingType },
                                        { label: 'Dimensions', value: `${config.state.realWidthMm} x ${config.state.realHeightMm}mm` },
                                    ].map((spec) => (
                                        <div key={spec.label} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{spec.label}</span>
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl border-4 border-slate-800 space-y-6">
                            <div className="flex items-center gap-3">
                                <Info className="w-5 h-5 text-blue-400" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Fabrication Logic</h4>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    Calculations based on measurements from OUTSIDE of channel.
                                    Channel Depth: {CHANNEL_DEPTH_MM}mm.
                                </p>

                                <div className="space-y-2">
                                    {config.panels.map((p) => {
                                        let calcWidth = 0;
                                        // Simple logic for illustration
                                        if (p.plane === 'front') {
                                            calcWidth = config.state.realWidthMm;
                                            if (p.wall_fix.left || p.wall_fix.right) calcWidth -= CHANNEL_DEPTH_MM;
                                        } else {
                                            calcWidth = 300; // Default placeholder
                                            if (p.wall_fix.left || p.wall_fix.right) calcWidth -= CHANNEL_DEPTH_MM;
                                            calcWidth -= (GLASS_THICKNESS_MM + SILICONE_GAP_MM);
                                        }

                                        return (
                                            <div key={p.panel_id} className="flex justify-between items-center py-1">
                                                <span className="text-[10px] text-slate-500 font-black">{p.panel_id} (Width)</span>
                                                <span className="text-sm font-black italic">{Math.round(calcWidth)}mm</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="aspect-square bg-slate-50 rounded-[3rem] border-2 border-slate-100 flex items-center justify-center overflow-hidden">
                            <div className="scale-75">
                                <ShowerConfiguration
                                    category="square"
                                    panels={config.panels}
                                    realWidthMm={config.state.realWidthMm}
                                    realHeightMm={config.state.realHeightMm}
                                    isActive={true}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Button className="h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                                Finalise Design & Continue
                            </Button>
                            <Button
                                variant="outline"
                                className="h-14 font-black uppercase tracking-widest text-[10px] rounded-2xl border-2 border-slate-100 text-slate-400"
                                onClick={() => setConfig(prev => ({ ...prev, screen: 'customise' }))}
                            >
                                Edit Layout
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Fabrication Preview - Testing Only */}
                <div className="mt-8">
                    <FabricationPreview
                        panels={config.panels}
                        isFloorToCeiling={config.state.isFloorToCeiling}
                        supportPanelRequired={config.state.support_panel.required}
                        showDetails={true}
                    />
                </div>

                {/* Glass Fabrication Diagrams */}
                <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Glass Fabrication Diagrams</h3>
                            <p className="text-xs text-slate-500">Individual panel diagrams with dimensions, hinge positions, and edge treatments</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Open print dialog for diagrams
                                const printContent = document.getElementById('fabrication-diagrams');
                                if (printContent) {
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                        printWindow.document.write(`
                                            <html>
                                            <head>
                                                <title>Glass Fabrication - ${config.panels.length} Panels</title>
                                                <style>
                                                    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
                                                    .panel-page { page-break-after: always; margin-bottom: 20px; }
                                                    .panel-page:last-child { page-break-after: auto; }
                                                    svg { max-width: 100%; height: auto; }
                                                    @media print {
                                                        .panel-page { page-break-after: always; }
                                                    }
                                                </style>
                                            </head>
                                            <body>${printContent.innerHTML}</body>
                                            </html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.print();
                                    }
                                }
                            }}
                            className="h-12 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl border-2 border-slate-200"
                        >
                            🖨️ Print All Diagrams
                        </Button>
                    </div>

                    <div id="fabrication-diagrams" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {config.panels.map((panel) => (
                            <Card key={panel.panel_id} className="panel-page overflow-hidden border-2 border-slate-100 rounded-2xl">
                                <CardContent className="p-0">
                                    <GlassFabricationDiagram
                                        panel={panel}
                                        workId={`WK-${Date.now().toString(36).toUpperCase()}`}
                                        customerName="Niklas Carlen"
                                        glassType="10MM TOUGHENED"
                                        quantity={1}
                                        isFloorToCeiling={config.state.isFloorToCeiling}
                                        showHeader={true}
                                        floorRake={config.state.floorRake}
                                        wallRake={config.state.wallRake}
                                        ceilingRake={config.state.ceilingRake}
                                        notches={config.state.notches}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 bg-white min-h-[800px] animate-in fade-in duration-500">
            {/* Header with improved stepper */}
            <div className="mb-12 flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Square Shower <span className="text-primary not-italic">Designer</span></h1>
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Custom Fabrication Logic</p>
                </div>

                <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-full border border-slate-100">
                    {(['template-select', 'customise', 'dimensions', 'confirmation'] as SquareScreen[]).map((s, i) => (
                        <button
                            key={s}
                            onClick={() => setConfig(prev => ({ ...prev, screen: s }))}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${config.screen === s ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                            <span className="opacity-50 mr-2">{i + 1}</span>
                            {s === 'template-select' ? 'Base' : s}
                        </button>
                    ))}
                </div>

            </div>

            {/* Step Content */}
            {config.screen === 'template-select' && renderTemplateSelect()}
            {config.screen === 'customise' && renderCustomise()}
            {config.screen === 'dimensions' && renderDimensions()}
            {config.screen === 'confirmation' && renderConfirmation()}
        </div>
    );
};
