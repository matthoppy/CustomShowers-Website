import {
    PanelModel,
    JunctionModel,
    PlaneType,
    PanelType,
    PanelNotches,
    PanelTopEdge,
    ParsedLayout
} from '../types/square';

const DEFAULT_NOTCHES: PanelNotches = { bottom_left: false, bottom_right: false };
const DEFAULT_TOP_EDGE: PanelTopEdge = { type: 'level', direction: null, drop_mm: null };
const DEFAULT_WALL_FIX = { left: false, right: false };

export function parseDescription(text: string): ParsedLayout {
    const panels: PanelModel[] = [];
    const junctions: JunctionModel[] = [];
    const lowerText = text.toLowerCase();

    // 1. Identify Layout Type
    const isUShape = lowerText.includes('u-shaped') || lowerText.includes('u shape') || (lowerText.includes('return') && lowerText.includes('both sides'));
    const isCorner = lowerText.includes('corner') || lowerText.includes('l-shape') || lowerText.includes('return') || lowerText.includes('90');

    if (isUShape) {
        // U-Shape: Left Return, Front, Right Return
        // Plane: return_left -> front -> return_right

        // Return Left
        panels.push({
            panel_id: 'P1',
            panel_type: 'fixed',
            plane: 'return_left',
            position_index: 1,
            notches: DEFAULT_NOTCHES,
            top_edge: DEFAULT_TOP_EDGE,
            hinge_side: null,
            handle_side: null,
            mounting_style: 'channel',
            wall_fix: DEFAULT_WALL_FIX
        });

        // Front (Fixed or Door)
        const frontType: PanelType = lowerText.includes('door in the middle') || lowerText.includes('front door') ? 'door_hinged' : 'fixed';
        panels.push({
            panel_id: frontType === 'door_hinged' ? 'D1' : 'P2',
            panel_type: frontType,
            plane: 'front',
            position_index: 2,
            notches: DEFAULT_NOTCHES,
            top_edge: DEFAULT_TOP_EDGE,
            hinge_side: frontType === 'door_hinged' ? 'left' : null,
            handle_side: frontType === 'door_hinged' ? 'right' : null,
            mounting_style: 'channel',
            wall_fix: DEFAULT_WALL_FIX
        });

        // Return Right
        panels.push({
            panel_id: 'P3',
            panel_type: 'fixed',
            plane: 'return_right',
            position_index: 3,
            notches: DEFAULT_NOTCHES,
            top_edge: DEFAULT_TOP_EDGE,
            hinge_side: null,
            handle_side: null,
            mounting_style: 'channel',
            wall_fix: DEFAULT_WALL_FIX
        });

        // Junctions
        junctions.push({
            junction_id: 'J1',
            a_panel_id: 'P1',
            a_edge: 'right',
            b_panel_id: panels[1].panel_id,
            b_edge: 'left',
            angle_deg: 90,
            junction_type: 'glass_to_glass'
        });
        junctions.push({
            junction_id: 'J2',
            a_panel_id: panels[1].panel_id,
            a_edge: 'right',
            b_panel_id: 'P3',
            b_edge: 'left',
            angle_deg: 90,
            junction_type: 'glass_to_glass'
        });

    } else {
        // Default Corner / L-Shape
        // Plane: front and ONE return

        const hasLeftReturn = lowerText.includes('left');
        const hasRightReturn = lowerText.includes('right') || !hasLeftReturn; // Default to right if not specified

        const returnPlane: PlaneType = hasLeftReturn ? 'return_left' : 'return_right';

        // Panel 1: Return
        panels.push({
            panel_id: 'P1',
            panel_type: 'fixed',
            plane: returnPlane,
            position_index: 1,
            notches: DEFAULT_NOTCHES,
            top_edge: DEFAULT_TOP_EDGE,
            hinge_side: null,
            handle_side: null,
            mounting_style: 'channel',
            wall_fix: DEFAULT_WALL_FIX
        });

        // Panel 2: Front
        const isDoor = lowerText.includes('door');
        panels.push({
            panel_id: isDoor ? 'D1' : 'P2',
            panel_type: isDoor ? 'door_hinged' : 'fixed',
            plane: 'front',
            position_index: 2,
            notches: DEFAULT_NOTCHES,
            top_edge: DEFAULT_TOP_EDGE,
            hinge_side: isDoor ? (hasLeftReturn ? 'left' : 'right') : null,
            handle_side: isDoor ? (hasLeftReturn ? 'right' : 'left') : null,
            mounting_style: 'channel',
            wall_fix: DEFAULT_WALL_FIX
        });

        // Junction
        junctions.push({
            junction_id: 'J1',
            a_panel_id: 'P1',
            a_edge: hasLeftReturn ? 'right' : 'left',
            b_panel_id: isDoor ? 'D1' : 'P2',
            b_edge: hasLeftReturn ? 'left' : 'right',
            angle_deg: 90,
            junction_type: 'glass_to_glass'
        });
    }

    return { panels, junctions, description: text };
}
