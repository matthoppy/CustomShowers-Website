/**
 * Configurator model types.
 *
 * The customer builds a *chain*: an ordered run of glass panels joined by
 * junctions that are either straight (180°) or a corner (90°). That single
 * shape covers inline screens, L-returns, U-shapes and walk-ins without
 * needing a fixed template list.
 *
 * These types are tenant-neutral — no branding, no pricing, no glazier
 * specifics. Anything company-specific lives in tenant.ts.
 */

import type { GlassThickness } from '@/types/square';
import { createOpeningMeasurements, type OpeningMeasurements } from './measure';

export type { OpeningMeasurements };

export type PanelKind = 'fixed' | 'door';

export type HingeSide = 'left' | 'right';

export type DoorSwing = 'out' | 'both';

export type Mounting = 'channel' | 'clamps';

export type GlassType = 'clear' | 'low-iron' | 'satin' | 'bronze' | 'grey';

export type GlassCoating = 'none' | 'easy-clean';

export interface PanelNotch {
  bottom_left: boolean;
  bottom_right: boolean;
  width_mm: number;
  height_mm: number;
}

export interface ConfiguratorPanel {
  id: string;
  kind: PanelKind;
  width_mm: number;
  /** Present only when kind === 'door'. */
  door?: {
    hinge_side: HingeSide;
    swing: DoorSwing;
  };
  notches?: PanelNotch;
}

/** Joins panel[i] to panel[i + 1]. junctions.length === panels.length - 1. */
export interface ConfiguratorJunction {
  angle_deg: 90 | 180;
}


export interface ConfiguratorState {
  panels: ConfiguratorPanel[];
  junctions: ConfiguratorJunction[];
  /** Whether the run terminates against a wall at each end. */
  leftWall: boolean;
  rightWall: boolean;
  heightMm: number;
  isFloorToCeiling: boolean;
  mounting: Mounting;
  glassThicknessMm: GlassThickness;
  glassType: GlassType;
  glassCoating: GlassCoating;
  /** Keys into the tenant's hardware catalog. */
  finishId: string;
  handleId: string;
  /**
   * What the customer measured in their own bathroom. These are the numbers
   * the glass is cut to — there is no site survey — so they carry more weight
   * than anything else in this object. See measure.ts.
   */
  opening: OpeningMeasurements;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  postcode: string;
  notes: string;
  /** Customer has confirmed they understand who is responsible for measurements. */
  measurementsAcknowledged: boolean;
}

export function createInitialState(glassThicknessMm: GlassThickness = 10): ConfiguratorState {
  return {
    panels: [
      {
        id: 'panel-1',
        kind: 'door',
        width_mm: 650,
        door: { hinge_side: 'right', swing: 'out' },
      },
    ],
    junctions: [],
    leftWall: true,
    rightWall: true,
    heightMm: 2000,
    isFloorToCeiling: false,
    mounting: 'channel',
    glassThicknessMm,
    glassType: 'clear',
    glassCoating: 'none',
    finishId: 'chrome',
    handleId: 'pull',
    opening: createOpeningMeasurements([650]),
  };
}

export function createPanel(kind: PanelKind, index: number): ConfiguratorPanel {
  const panel: ConfiguratorPanel = {
    id: `panel-${index}`,
    kind,
    width_mm: kind === 'door' ? 650 : 600,
  };
  if (kind === 'door') {
    panel.door = { hinge_side: 'right', swing: 'out' };
  }
  return panel;
}
