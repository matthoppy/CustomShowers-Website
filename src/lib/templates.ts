/**
 * Shower Template Definitions
 * Pre-configured shower layouts with 3D model data
 */

import type { ConfigurationType, DoorType, DoorOpening } from '@/types';

export type MountingType = 'channel' | 'clamps';

export interface PanelDefinition {
  id: string;
  type: 'fixed' | 'door';
  /** Position relative to origin [x, y, z] in normalized units */
  position: [number, number, number];
  /** Rotation in degrees [x, y, z] */
  rotation: [number, number, number];
  /** Dimensions [width, height, depth] - width/height in % of total, depth is glass thickness */
  dimensions: [number, number, number];
  /** Wall attachment side */
  wallSide?: 'left' | 'right' | 'back' | 'none';
}

export interface HardwarePosition {
  type: 'hinge' | 'handle' | 'clamp';
  /** Panel ID this hardware is attached to */
  panelId: string;
  /** Position on panel [x, y] as percentage (0-100) */
  position: [number, number];
  /** Side of panel ('front' | 'back' | 'left' | 'right') */
  side: string;
}

export interface ShowerTemplate {
  id: string;
  name: string;
  description: string;
  category: ConfigurationType;

  /** Thumbnail preview URL */
  thumbnail?: string;

  /** Glass panels definition */
  panels: PanelDefinition[];

  /** Hardware positions */
  hardware: HardwarePosition[];

  /** Supported door types */
  supportedDoorTypes: DoorType[];

  /** Supported door openings */
  supportedDoorOpenings: DoorOpening[];

  /** Supported mounting types */
  supportedMounting: MountingType[];

  /** Default measurements (in mm) */
  defaultMeasurements: {
    width: number;
    height: number;
    depth?: number;
  };

  /** Recommended glass thickness */
  recommendedThickness: number[];

  /** Tags for filtering */
  tags: string[];
}

/**
 * Template Library
 */
export const SHOWER_TEMPLATES: ShowerTemplate[] = [
  // INLINE CONFIGURATIONS
  {
    id: 'inline-single-door',
    name: 'Inline Single Door',
    description: 'Single hinged door with optional fixed panel',
    category: 'inline',
    panels: [
      {
        id: 'panel-1',
        type: 'fixed',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [40, 100, 1],
        wallSide: 'left',
      },
      {
        id: 'door-1',
        type: 'door',
        position: [40, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [60, 100, 1],
        wallSide: 'none',
      },
    ],
    hardware: [
      { type: 'hinge', panelId: 'door-1', position: [5, 20], side: 'left' },
      { type: 'hinge', panelId: 'door-1', position: [5, 80], side: 'left' },
      { type: 'handle', panelId: 'door-1', position: [90, 50], side: 'front' },
    ],
    supportedDoorTypes: ['hinged'],
    supportedDoorOpenings: ['inward', 'outward'],
    supportedMounting: ['channel', 'clamps'],
    defaultMeasurements: { width: 900, height: 2000 },
    recommendedThickness: [8, 10],
    tags: ['simple', 'compact', 'popular'],
  },

  {
    id: 'inline-double-door',
    name: 'Inline Double Door',
    description: 'Two hinged doors opening from center',
    category: 'inline',
    panels: [
      {
        id: 'door-left',
        type: 'door',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [50, 100, 1],
        wallSide: 'left',
      },
      {
        id: 'door-right',
        type: 'door',
        position: [50, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [50, 100, 1],
        wallSide: 'right',
      },
    ],
    hardware: [
      { type: 'hinge', panelId: 'door-left', position: [5, 20], side: 'left' },
      { type: 'hinge', panelId: 'door-left', position: [5, 80], side: 'left' },
      { type: 'handle', panelId: 'door-left', position: [90, 50], side: 'front' },
      { type: 'hinge', panelId: 'door-right', position: [95, 20], side: 'right' },
      { type: 'hinge', panelId: 'door-right', position: [95, 80], side: 'right' },
      { type: 'handle', panelId: 'door-right', position: [10, 50], side: 'front' },
    ],
    supportedDoorTypes: ['hinged'],
    supportedDoorOpenings: ['both'],
    supportedMounting: ['channel', 'clamps'],
    defaultMeasurements: { width: 1200, height: 2000 },
    recommendedThickness: [8, 10],
    tags: ['double', 'wide', 'alcove'],
  },

  // CORNER CONFIGURATIONS
  {
    id: 'corner-standard',
    name: 'Corner Shower',
    description: 'L-shaped corner enclosure with door',
    category: 'corner',
    panels: [
      {
        id: 'panel-back',
        type: 'fixed',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [100, 100, 1],
        wallSide: 'back',
      },
      {
        id: 'panel-side',
        type: 'fixed',
        position: [0, 0, 0],
        rotation: [0, 90, 0],
        dimensions: [70, 100, 1],
        wallSide: 'left',
      },
      {
        id: 'door-1',
        type: 'door',
        position: [70, 0, 0],
        rotation: [0, 90, 0],
        dimensions: [30, 100, 1],
        wallSide: 'none',
      },
    ],
    hardware: [
      { type: 'hinge', panelId: 'door-1', position: [5, 20], side: 'left' },
      { type: 'hinge', panelId: 'door-1', position: [5, 80], side: 'left' },
      { type: 'handle', panelId: 'door-1', position: [90, 50], side: 'front' },
      { type: 'clamp', panelId: 'panel-back', position: [50, 95], side: 'top' },
      { type: 'clamp', panelId: 'panel-side', position: [50, 95], side: 'top' },
    ],
    supportedDoorTypes: ['hinged', 'pivot'],
    supportedDoorOpenings: ['inward', 'outward'],
    supportedMounting: ['channel', 'clamps'],
    defaultMeasurements: { width: 900, height: 2000, depth: 900 },
    recommendedThickness: [8, 10, 12],
    tags: ['corner', 'L-shaped', 'compact'],
  },

  {
    id: 'corner-neo-angle',
    name: 'Neo-Angle Corner',
    description: 'Angled corner shower with door',
    category: 'corner',
    panels: [
      {
        id: 'panel-left',
        type: 'fixed',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [45, 100, 1],
        wallSide: 'left',
      },
      {
        id: 'door-1',
        type: 'door',
        position: [45, 0, 0],
        rotation: [0, 45, 0],
        dimensions: [40, 100, 1],
        wallSide: 'none',
      },
      {
        id: 'panel-right',
        type: 'fixed',
        position: [85, 0, 0],
        rotation: [0, 90, 0],
        dimensions: [45, 100, 1],
        wallSide: 'right',
      },
    ],
    hardware: [
      { type: 'hinge', panelId: 'door-1', position: [5, 20], side: 'left' },
      { type: 'hinge', panelId: 'door-1', position: [5, 80], side: 'left' },
      { type: 'handle', panelId: 'door-1', position: [90, 50], side: 'front' },
    ],
    supportedDoorTypes: ['hinged'],
    supportedDoorOpenings: ['inward', 'outward'],
    supportedMounting: ['channel', 'clamps'],
    defaultMeasurements: { width: 900, height: 2000, depth: 900 },
    recommendedThickness: [8, 10],
    tags: ['corner', 'angled', 'space-saving'],
  },

  // WALK-IN / WETROOM CONFIGURATIONS
  {
    id: 'wetroom-single-panel',
    name: 'Walk-In Single Panel',
    description: 'Single fixed panel, no door',
    category: 'wetroom',
    panels: [
      {
        id: 'panel-1',
        type: 'fixed',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [100, 100, 1],
        wallSide: 'left',
      },
    ],
    hardware: [
      { type: 'clamp', panelId: 'panel-1', position: [10, 95], side: 'top' },
      { type: 'clamp', panelId: 'panel-1', position: [50, 95], side: 'top' },
      { type: 'clamp', panelId: 'panel-1', position: [90, 95], side: 'top' },
    ],
    supportedDoorTypes: ['fixed'],
    supportedDoorOpenings: ['inward'], // N/A for walk-in
    supportedMounting: ['clamps'],
    defaultMeasurements: { width: 1200, height: 2000 },
    recommendedThickness: [10, 12],
    tags: ['walk-in', 'wetroom', 'minimalist'],
  },

  {
    id: 'wetroom-panel-return',
    name: 'Walk-In with Return Panel',
    description: 'L-shaped walk-in with return panel',
    category: 'wetroom',
    panels: [
      {
        id: 'panel-main',
        type: 'fixed',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [70, 100, 1],
        wallSide: 'left',
      },
      {
        id: 'panel-return',
        type: 'fixed',
        position: [70, 0, 0],
        rotation: [0, 90, 0],
        dimensions: [30, 100, 1],
        wallSide: 'none',
      },
    ],
    hardware: [
      { type: 'clamp', panelId: 'panel-main', position: [50, 95], side: 'top' },
      { type: 'clamp', panelId: 'panel-return', position: [50, 95], side: 'top' },
    ],
    supportedDoorTypes: ['fixed'],
    supportedDoorOpenings: ['inward'],
    supportedMounting: ['clamps'],
    defaultMeasurements: { width: 1200, height: 2000, depth: 400 },
    recommendedThickness: [10, 12],
    tags: ['walk-in', 'wetroom', 'L-shaped', 'return'],
  },

  {
    id: 'walk-in-door-panel',
    name: 'Walk-In with Door',
    description: 'Walk-in with optional door for splash protection',
    category: 'walk-in',
    panels: [
      {
        id: 'panel-main',
        type: 'fixed',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [60, 100, 1],
        wallSide: 'left',
      },
      {
        id: 'door-1',
        type: 'door',
        position: [60, 0, 0],
        rotation: [0, 0, 0],
        dimensions: [40, 100, 1],
        wallSide: 'none',
      },
    ],
    hardware: [
      { type: 'hinge', panelId: 'door-1', position: [5, 20], side: 'left' },
      { type: 'hinge', panelId: 'door-1', position: [5, 80], side: 'left' },
      { type: 'handle', panelId: 'door-1', position: [90, 50], side: 'front' },
      { type: 'clamp', panelId: 'panel-main', position: [50, 95], side: 'top' },
    ],
    supportedDoorTypes: ['hinged', 'pivot'],
    supportedDoorOpenings: ['inward', 'outward'],
    supportedMounting: ['clamps'],
    defaultMeasurements: { width: 1200, height: 2000 },
    recommendedThickness: [10, 12],
    tags: ['walk-in', 'semi-enclosed', 'flexible'],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ConfigurationType): ShowerTemplate[] {
  return SHOWER_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ShowerTemplate | undefined {
  return SHOWER_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by tags
 */
export function getTemplatesByTags(tags: string[]): ShowerTemplate[] {
  return SHOWER_TEMPLATES.filter(template =>
    tags.some(tag => template.tags.includes(tag))
  );
}
