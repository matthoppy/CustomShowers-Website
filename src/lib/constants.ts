/**
 * BFS Website Constants - SIMPLIFIED SYSTEM
 * Pricing, hardware catalog, and business configuration
 * Focused on 10mm glass with specific hardware options
 */

import type {
  GlassType,
  GlassThickness,
  HardwareFinish,
  HardwareCatalogItem,
  DoorOpening,
} from '@/types';

/**
 * SIMPLIFIED: 10mm glass only
 */
export const STANDARD_GLASS_THICKNESS: GlassThickness = 10;

/**
 * UK VAT Rate (20%)
 */
export const VAT_RATE = 0.20;

/**
 * Quote validity period (days)
 */
export const QUOTE_VALIDITY_DAYS = 30;

/**
 * Glass pricing per square meter (in GBP) - 10mm only
 */
export const GLASS_PRICING_10MM: Record<GlassType, number> = {
  clear: 180,
  frosted: 200,
  tinted: 210,
};

/**
 * Installation rate per square meter (optional service)
 */
export const INSTALLATION_RATE_PER_SQM = 85;

/**
 * Hardware finish display names
 */
export const HARDWARE_FINISH_NAMES: Record<HardwareFinish, string> = {
  chrome: 'Polished Chrome',
  'brushed-nickel': 'Brushed Nickel',
  'matte-black': 'Matte Black',
  gold: 'Brushed Gold',
};

/**
 * Hinge Types
 */
export type HingeType = 'geneva' | 'vienna' | 'bellagio';

export interface HingeOption {
  type: HingeType;
  name: string;
  description: string;
  part_number_base: string;
  unit_cost: number;
  max_door_width: number; // mm
  max_door_weight: number; // kg
  premium: boolean;
  seal_type: 'h-seal' | 'bubble-seal';
}

/**
 * Hinge selection catalog
 * Automatically selected based on door size and weight
 */
export const HINGE_OPTIONS: HingeOption[] = [
  {
    type: 'geneva',
    name: 'Geneva Series',
    description: 'Standard hinge for smaller doors',
    part_number_base: 'CRL-GENEVA',
    unit_cost: 45.0,
    max_door_width: 800, // Up to 800mm wide
    max_door_weight: 40, // Up to 40kg
    premium: false,
    seal_type: 'h-seal',
  },
  {
    type: 'vienna',
    name: 'Vienna Series',
    description: 'Mid-range hinge for standard doors',
    part_number_base: 'CRL-VIENNA',
    unit_cost: 55.0,
    max_door_width: 1000, // Up to 1000mm wide
    max_door_weight: 50, // Up to 50kg
    premium: false,
    seal_type: 'h-seal',
  },
  {
    type: 'bellagio',
    name: 'Bellagio Series',
    description: 'Premium hinge for large/heavy doors',
    part_number_base: 'CRL-BELLAGIO',
    unit_cost: 75.0,
    max_door_width: 1200, // Up to 1200mm wide
    max_door_weight: 65, // Up to 65kg
    premium: true,
    seal_type: 'bubble-seal',
  },
];

/**
 * Handle Types
 */
export type HandleType = 'circular-8inch' | 'square-d' | 'knob' | 'cutout-50mm';

export interface HandleOption {
  type: HandleType;
  name: string;
  description: string;
  part_number_base: string;
  unit_cost: number;
  requires_cutout: boolean;
}

/**
 * Handle options (4 types)
 */
export const HANDLE_OPTIONS: HandleOption[] = [
  {
    type: 'circular-8inch',
    name: '8" Circular Handle',
    description: 'Round pull handle, 8 inch length',
    part_number_base: 'CRL-CIRC-8',
    unit_cost: 58.0,
    requires_cutout: false,
  },
  {
    type: 'square-d',
    name: 'Square D Handle',
    description: 'Square profile D-shaped handle',
    part_number_base: 'CRL-SQRD',
    unit_cost: 65.0,
    requires_cutout: false,
  },
  {
    type: 'knob',
    name: 'Knob Handle',
    description: 'Compact knob style handle',
    part_number_base: 'CRL-KNOB',
    unit_cost: 45.0,
    requires_cutout: false,
  },
  {
    type: 'cutout-50mm',
    name: '50mm Glass Cutout Handle',
    description: 'Handle with 50mm glass cutout',
    part_number_base: 'CRL-CUT-50',
    unit_cost: 72.0,
    requires_cutout: true,
  },
];

/**
 * Seal Types
 */
export type SealType = 'drip' | 'soft-fin-h' | 'bubble' | 'h-seal';

export interface SealOption {
  type: SealType;
  name: string;
  description: string;
  part_number: string;
  unit_cost: number;
  location: 'door-bottom' | 'fixed-panel' | 'door-hinge-side';
}

/**
 * Seal options
 */
export const SEAL_OPTIONS: SealOption[] = [
  {
    type: 'drip',
    name: 'Drip Seal',
    description: 'Bottom drip seal for door',
    part_number: 'CRL-DRIP-10',
    unit_cost: 18.0,
    location: 'door-bottom',
  },
  {
    type: 'soft-fin-h',
    name: 'Soft Fin H Seal',
    description: 'H seal for fixed panel (outward opening doors)',
    part_number: 'CRL-FIN-H',
    unit_cost: 22.0,
    location: 'fixed-panel',
  },
  {
    type: 'bubble',
    name: 'Bubble Seal',
    description: 'Bubble seal for door (both ways opening)',
    part_number: 'CRL-BUBBLE',
    unit_cost: 24.0,
    location: 'door-hinge-side',
  },
  {
    type: 'h-seal',
    name: 'H Seal',
    description: 'Standard H seal for door (Geneva/Vienna hinges)',
    part_number: 'CRL-HSEAL',
    unit_cost: 20.0,
    location: 'door-hinge-side',
  },
];

/**
 * Automatically determine required seals based on door opening and hinge type
 */
export function getRequiredSeals(
  doorOpening: DoorOpening,
  hingeType: HingeType
): SealOption[] {
  const seals: SealOption[] = [];

  // 1. Drip seal below door (ALWAYS)
  seals.push(SEAL_OPTIONS.find((s) => s.type === 'drip')!);

  // 2. Soft fin H seal on fixed panel (if door opens OUTWARD only)
  if (doorOpening === 'outward') {
    seals.push(SEAL_OPTIONS.find((s) => s.type === 'soft-fin-h')!);
  }

  // 3. Bubble seal on door (if door opens BOTH ways)
  if (doorOpening === 'both') {
    seals.push(SEAL_OPTIONS.find((s) => s.type === 'bubble')!);
  }

  // 4. Hinge-side seal based on hinge type
  if (hingeType === 'bellagio') {
    // Bellagio uses bubble seal on hinge side
    seals.push(SEAL_OPTIONS.find((s) => s.type === 'bubble')!);
  } else {
    // Geneva and Vienna use H seal on door
    seals.push(SEAL_OPTIONS.find((s) => s.type === 'h-seal')!);
  }

  return seals;
}

/**
 * Automatically select hinge type based on door dimensions
 */
export function selectHingeType(
  doorWidth: number, // mm
  doorHeight: number, // mm
  preferPremium: boolean = false
): HingeType {
  // Calculate door weight (approximate)
  // 10mm glass = ~25kg per m²
  const doorArea = (doorWidth * doorHeight) / 1_000_000; // Convert to m²
  const doorWeight = doorArea * 25;

  if (preferPremium) {
    // User wants premium option
    return 'bellagio';
  }

  // Auto-select based on size/weight
  for (const hinge of HINGE_OPTIONS) {
    if (doorWidth <= hinge.max_door_width && doorWeight <= hinge.max_door_weight) {
      return hinge.type;
    }
  }

  // Fallback to Bellagio for large/heavy doors
  return 'bellagio';
}

/**
 * Get hinge option by type
 */
export function getHingeOption(type: HingeType): HingeOption {
  return HINGE_OPTIONS.find((h) => h.type === type)!;
}

/**
 * Get handle option by type
 */
export function getHandleOption(type: HandleType): HandleOption {
  return HANDLE_OPTIONS.find((h) => h.type === type)!;
}

/**
 * Hardware catalog for 10mm glass - simplified
 */
export const HARDWARE_CATALOG_10MM: HardwareCatalogItem[] = [
  // U-Channel for 10mm
  {
    part_number: 'CRL-UC10CH',
    supplier: 'CRL',
    category: 'channel',
    name: 'U-Channel for 10mm Glass',
    description: 'Aluminum U-channel, 2.5m length',
    unit_cost: 32.0,
    compatible_glass_thickness: [10],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'Aluminum',
      length: '2500mm',
      finish_type: 'Anodized',
    },
    in_stock: true,
  },

  // Glass Clamps
  {
    part_number: 'GP-CLAMP-10',
    supplier: 'Glass Parts UK',
    category: 'clamp',
    name: 'Glass Panel Clamp - 10mm',
    description: 'Wall mounting clamp for 10mm fixed panels',
    unit_cost: 32.0,
    compatible_glass_thickness: [10],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'Brass',
      type: 'Wall-to-glass',
      glass_thickness: '10mm',
    },
    in_stock: true,
  },

  // Silicone
  {
    part_number: 'CRL-SIL-CLEAR',
    supplier: 'CRL',
    category: 'silicone',
    name: 'Clear Silicone Sealant',
    description: 'Premium bathroom silicone, 310ml',
    unit_cost: 12.0,
    compatible_glass_thickness: [10],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      volume: '310ml',
      color: 'Clear',
      type: 'Neutral cure',
    },
    in_stock: true,
  },
];

/**
 * Supplier contact information
 */
export const SUPPLIER_CONTACTS = {
  CRL: {
    name: 'CRL (C.R. Laurence)',
    email: 'sales@crlaurence.co.uk',
    phone: '+44 (0)20 8676 9222',
    website: 'https://www.crlaurence.co.uk',
  },
  'Glass Parts UK': {
    name: 'Glass Parts UK',
    email: 'info@glassparts.co.uk',
    phone: '+44 (0)1234 567890',
    website: 'https://www.glassparts.co.uk',
  },
} as const;

/**
 * Business contact information
 */
export const BUSINESS_CONTACT = {
  name: 'Custom Showers Website',
  email: 'sales@bespokeframelessshowers.co.uk',
  phone: '+44 (0)20 1234 5678',
  address: {
    line1: 'Unit 5, Industrial Estate',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: 'United Kingdom',
  },
} as const;

/**
 * Payment configuration
 */
export const PAYMENT_CONFIG = {
  currency: 'GBP',
  locale: 'en-GB',
  stripe: {
    public_key: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  },
} as const;
