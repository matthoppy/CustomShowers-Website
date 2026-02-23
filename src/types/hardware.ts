/**
 * Hardware Type Definitions
 */

import type { GlassThickness, HardwareFinish } from './design';

export type HardwareSupplier = 'Custom Showers';

export type HardwareCategory =
  | 'hinge'
  | 'handle'
  | 'clamp'
  | 'channel'
  | 'seal'
  | 'silicone'
  | 'other';

export interface HardwareSpecification {
  finish?: HardwareFinish;
  size?: string;
  material?: string;
  weight_capacity?: string;
  glass_thickness?: string;
  [key: string]: string | undefined;
}

export interface HardwareItem {
  id: string;
  order_id: string;
  supplier: HardwareSupplier;
  category: HardwareCategory;
  part_number: string;
  description: string;
  quantity: number;
  unit_cost: number;
  specifications: HardwareSpecification;
  created_at: string;
}

/**
 * Hardware catalog item (for selection)
 */
export interface HardwareCatalogItem {
  part_number: string;
  supplier: HardwareSupplier;
  category: HardwareCategory;
  name: string;
  description: string;
  unit_cost: number;

  // Compatibility
  compatible_glass_thickness: GlassThickness[];
  compatible_finishes: HardwareFinish[];

  // Specifications
  specifications: HardwareSpecification;

  // Images
  image_url?: string;
  thumbnail_url?: string;

  // Availability
  in_stock: boolean;
  lead_time_days?: number;
}

/**
 * Hardware selection for a design
 */
export interface HardwareSelection {
  hinges?: HardwareCatalogItem;
  hinge_quantity?: number;

  handle?: HardwareCatalogItem;

  clamps?: HardwareCatalogItem;
  clamp_quantity?: number;

  channel?: HardwareCatalogItem;
  channel_length_meters?: number;

  seals?: HardwareCatalogItem[];

  silicone?: HardwareCatalogItem;
  silicone_quantity?: number;

  other?: HardwareCatalogItem[];
}

/**
 * Calculated hardware requirements for a design
 */
export interface HardwareRequirements {
  items: Array<{
    catalog_item: HardwareCatalogItem;
    quantity: number;
    line_total: number;
  }>;
  total_cost: number;
}

/**
 * Hardware specification document data
 */
export interface HardwareSpecDocument {
  order_number: string;
  order_date: string;
  customer_name: string;

  // Grouped by supplier
  suppliers: Array<{
    supplier: HardwareSupplier;
    contact_info: {
      name: string;
      email?: string;
      phone?: string;
      website?: string;
    };
    items: HardwareItem[];
    supplier_total: number;
  }>;

  total_items: number;
  total_cost: number;

  // Installation notes
  installation_notes?: string[];
}

/**
 * Hinge type options
 */
export type HingeType =
  | 'glass-to-wall'
  | 'glass-to-glass'
  | 'pivot'
  | 'continuous';

/**
 * Handle type options
 */
export type HandleType =
  | 'pull-handle'
  | 'knob'
  | 'ladder-handle'
  | 'towel-bar';

/**
 * Channel type options
 */
export type ChannelType =
  | 'u-channel'
  | 'wall-channel'
  | 'header-channel';

/**
 * Seal type options
 */
export type SealType =
  | 'bottom-seal'
  | 'side-seal'
  | 'magnetic-seal'
  | 'corner-seal';
