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
  'polished-brass': 'Polished Brass',
  'oil-rubbed-bronze': 'Oil Rubbed Bronze',
  'brushed-bronze': 'Brushed Bronze',
  'gun-metal': 'Gun Metal',
  'polished-nickel': 'Polished Nickel',
  'satin-brass': 'Satin Brass',
  'unlacquered-brass': 'Unlacquered Brass',
  'antic-brass': 'Antic Brass',
  'satin-chrome': 'Satin Chrome',
  'satin-nickel': 'Satin Nickel',
};

/**
 * Hinge Types
 */
export type HingeType = 'geneva-044' | 'geneva-544' | 'geneva-180' | 'geneva-580' | 'geneva-90' | 'vienna' | 'bellagio' | 'bellagio-180' | 'bellagio-90';

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
  door_cutout?: {
    width: number;
    height: number;
    corner_radius?: number;
    mouse_ear?: number;
    notes?: string;
  };
  fixed_cutout?: {
    width?: number;
    height?: number;
    diameter?: number; // For holes
    count?: number; // Number of holes
    spacing?: number; // Spacing between holes
    edge_distance?: number;
    mouse_ear?: number;
    notes?: string;
  };
  technical_drawing_url?: string;
}

/**
 * Hinge selection catalog
 * Automatically selected based on door size and weight
 */
export const HINGE_OPTIONS: HingeOption[] = [
  {
    type: 'geneva-544',
    name: 'Geneva 544 Series',
    description: '5° Pre-Set Wall Mount Hinge (Open Out Only)',
    part_number_base: 'GEN544',
    unit_cost: 38.16,
    max_door_width: 711, // 28" (711mm) per specs
    max_door_weight: 36, // 80lbs (36kg) per 2 hinges
    premium: false,
    seal_type: 'h-seal',
    door_cutout: {
      width: 44,
      height: 63,
      mouse_ear: 57, // Distance between hole centers often called out, but here 63 is total. 
      // Drawing says "2-1/2 (63mm)" total height. 
      // Inner straight edge is "2-1/4 (57mm)"? No, 57mm is labeled as the vertical dim between centers? 
      // Let's use 63mm total height and note the mouse ears.
      corner_radius: 8, // 16mm diameter = 8mm radius
      notes: 'Mouse ears are 5/8" (16mm) diameter holes. Width 44mm from glass edge.'
    },
    technical_drawing_url: '/src/assets/technical-drawings/GEN544_tech_drawing.png'
  },
  {
    type: 'geneva-044',
    name: 'Geneva 044 Series',
    description: 'Standard Wall Mount Hinge (Reversible 5° Pin)',
    part_number_base: 'GEN044',
    unit_cost: 38.29,
    max_door_width: 711,
    max_door_weight: 36,
    premium: false,
    seal_type: 'h-seal',
    // Assuming same cutout as 544? Usually same series shares cutout. 
    // Checking domain knowledge... standard Geneva cutout is usually consistent.
    door_cutout: {
      width: 44,
      height: 63,
      mouse_ear: 57,
      corner_radius: 8,
      notes: 'Standard Geneva Cutout (Identical to GEN544)'
    },
    technical_drawing_url: '/src/assets/technical-drawings/GEN044_tech_drawing.png'
  },
  {
    type: 'geneva-180',
    name: 'Geneva 180° Series',
    description: 'Standard 180° Glass-to-Glass Hinge',
    part_number_base: 'GEN180',
    unit_cost: 51.69,
    max_door_width: 711,
    max_door_weight: 36,
    premium: false,
    seal_type: 'h-seal',
    // Geneva 180 cutout is typically essentially the same style as 044/544 but on both panels
    door_cutout: {
      width: 44,
      height: 63,
      mouse_ear: 57,
      corner_radius: 8,
      notes: 'Standard Geneva Cutout'
    },
    fixed_cutout: {
      width: 44,
      height: 63,
      mouse_ear: 57,
      notes: 'Standard Geneva Cutout (Fixed Side)'
    },
    technical_drawing_url: '/src/assets/technical-drawings/GEN180_tech_drawing.png'
  },
  {
    type: 'geneva-90',
    name: 'Geneva 90° Series',
    description: 'Standard 90° Glass-to-Glass Hinge',
    part_number_base: 'GEN092',
    unit_cost: 105.86,
    max_door_width: 711,
    max_door_weight: 36,
    premium: false,
    seal_type: 'h-seal',
    door_cutout: {
      width: 44,
      height: 63,
      mouse_ear: 57,
      corner_radius: 8,
      notes: 'Standard Geneva Cutout'
    },
    fixed_cutout: {
      diameter: 16, // 5/8" holes
      count: 2,
      spacing: 57, // 2-1/4" spacing
      edge_distance: 36, // 1-7/16" from edge
      notes: 'Two 16mm holes on fixed panel'
    },
    technical_drawing_url: '/src/assets/technical-drawings/GEN092_tech_drawing.png'
  },
  {
    type: 'geneva-580',
    name: 'Geneva 580 Series',
    description: '5° Pre-Set 180° Glass-to-Glass Hinge',
    part_number_base: 'GEN580',
    unit_cost: 51.61,
    max_door_width: 711,
    max_door_weight: 36,
    premium: false,
    seal_type: 'h-seal',
    // Assuming same cutout as 180
    door_cutout: {
      width: 44,
      height: 63,
      mouse_ear: 57, // Distance between hole centers
      corner_radius: 8,
      notes: 'Standard Geneva Cutout'
    },
    fixed_cutout: {
      width: 44,
      height: 63,
      mouse_ear: 57,
      notes: 'Standard Geneva Cutout (Fixed Side)'
    }
  },
  {
    type: 'vienna',
    name: 'Vienna 044 Series',
    description: 'Standard Wall Mount Hinge',
    part_number_base: 'V1E044',
    unit_cost: 60.29,
    max_door_width: 864, // 34" (864mm) per specs
    max_door_weight: 45, // 100lbs (45kg) per 2 hinges
    premium: false,
    seal_type: 'h-seal',
    // Vienna 044 spec sheet mentions "Cutout Required", typical Vienna is Mouse Ear.
    door_cutout: {
      width: 44,
      height: 63,
      mouse_ear: 57,
      corner_radius: 8,
      notes: 'Standard Vienna Cutout'
    },
    technical_drawing_url: '/src/assets/technical-drawings/V1E044_tech_drawing.png'
  },
  {
    type: 'bellagio',
    name: 'Bellagio Series',
    description: 'Premium hinge for large/heavy doors (Adjustable 90° Glass-to-Wall)',
    part_number_base: 'BEL344',
    unit_cost: 67.75,
    max_door_width: 1000,
    max_door_weight: 50,
    premium: true,
    seal_type: 'bubble-seal',
    door_cutout: {
      width: 47,
      height: 58,
      mouse_ear: 46,
      corner_radius: 6,
      notes: 'Standard Bellagio Mouse Ear'
    },
    technical_drawing_url: '/src/assets/technical-drawings/BEL344_tech_drawing.png'
  },
  {
    type: 'bellagio-180',
    name: 'Bellagio 180° Series',
    description: 'Premium glass-to-glass hinge (Adjustable 180°)',
    part_number_base: 'BEL380',
    unit_cost: 60.16,
    max_door_width: 1000,
    max_door_weight: 50,
    premium: true,
    seal_type: 'bubble-seal',
    door_cutout: {
      width: 47,
      height: 58,
      mouse_ear: 46,
      corner_radius: 6
    },
    fixed_cutout: {
      width: 33,
      height: 52,
      mouse_ear: 40,
      notes: 'Smaller mouse ear for fixed side'
    },
    technical_drawing_url: '/src/assets/technical-drawings/BEL380_tech_drawing.png'
  },
  {
    type: 'bellagio-90',
    name: 'Bellagio 90° Series',
    description: 'Premium glass-to-glass hinge (Adjustable 90°)',
    part_number_base: 'BEL392',
    unit_cost: 96.43,
    max_door_width: 1000,
    max_door_weight: 50,
    premium: true,
    seal_type: 'bubble-seal',
    door_cutout: {
      width: 47,
      height: 58,
      mouse_ear: 46,
      corner_radius: 6
    },
    fixed_cutout: {
      diameter: 16,
      count: 2,
      spacing: 50,
      edge_distance: 33,
      notes: 'Two 16mm holes for return panel'
    },
    technical_drawing_url: '/src/assets/technical-drawings/BEL392_tech_drawing.png'
  },
];

/**
 * Handle Types
 */
export type HandleType = 'knob' | 'pull' | 'sph8' | 'victorian' | 'sq8' | 'bowtie' | 'paddle' | 'crescent' | 'ez-grip';

export interface HandleOption {
  type: HandleType;
  name: string;
  description: string;
  part_number_base: string;
  unit_cost: number;
  requires_cutout: boolean;
  default_height_mm: number;
}

/**
 * Handle options (4 types)
 */
export const HANDLE_OPTIONS: HandleOption[] = [
  {
    type: 'pull',
    name: 'Standard Pull Handle',
    description: '6" Standard D-Handle',
    part_number_base: 'BM6',
    unit_cost: 32.00,
    requires_cutout: true,
    default_height_mm: 850,
  },
  {
    type: 'sph8',
    name: '8" Back-to-Back Pull (SPH8)',
    description: 'Solid Brass, 8" (203mm) Center-to-Center, 12mm Holes',
    part_number_base: 'SPH8',
    unit_cost: 39.27,
    requires_cutout: true,
    default_height_mm: 850,
  },
  {
    type: 'knob',
    name: 'Knob Handle',
    description: 'Compact knob style handle',
    part_number_base: 'CRL-KNOB',
    unit_cost: 45.0,
    requires_cutout: true,
    default_height_mm: 950,
  },
  {
    type: 'victorian',
    name: '8" Victorian Pull Handle',
    description: 'Elegant Victorian style, 8" (203mm) Center-to-Center, distinct knuckles',
    part_number_base: 'V1C8X8',
    unit_cost: 59.20,
    requires_cutout: true,
    default_height_mm: 850,
  },
  {
    type: 'sq8',
    name: '8" SQ Series Square Corner Handle',
    description: 'Sharp, clean, traditional look. 8" (203mm) C-to-C. Complements Geneva/Vienna.',
    part_number_base: 'SQ8X8',
    unit_cost: 55.96,
    requires_cutout: true,
    default_height_mm: 850,
  },
  {
    type: 'bowtie',
    name: 'CRL Bow-Tie Knobs',
    description: 'Back-to-Back Bow-Tie Style Knobs',
    part_number_base: 'SDK109',
    unit_cost: 18.36,
    requires_cutout: true,
    default_height_mm: 950,
  },
  {
    type: 'paddle',
    name: 'CRL Paddle Knobs',
    description: 'Back-to-Back Paddle Style Knobs',
    part_number_base: 'SDK180',
    unit_cost: 64.85,
    requires_cutout: true,
    default_height_mm: 950,
  },
  {
    type: 'crescent',
    name: 'CRL Crescent Grip Knob',
    description: 'Back-to-Back Crescent Grip Style Knob',
    part_number_base: 'SDK', // Assuming SDK prefix like others
    unit_cost: 14.41,
    requires_cutout: true,
    default_height_mm: 950,
  },
  {
    type: 'ez-grip',
    name: 'CRL E-Z Grip Knobs',
    description: 'Back-to-Back E-Z Grip Style Knobs',
    part_number_base: 'SDK140',
    unit_cost: 18.36,
    requires_cutout: true,
    default_height_mm: 950,
  },
];

/**
 * Seal Types
 */
export type SealType = 'drip' | 'soft-fin-h' | 'bubble' | 'h-seal' | 'threshold' | 'magnetic' | 'v-seal' | 'l-seal' | 'bulb';

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
    name: 'Bottom Wipe with Drip Rail',
    description: 'CRL Clear Co-Extruded Bottom Wipe with Drip Rail (P990WS)',
    part_number: 'P990WS',
    unit_cost: 9.33,
    location: 'door-bottom',
  },
  {
    type: 'threshold',
    name: 'Half-Round Threshold',
    description: 'CRL Half-Round Shower Threshold',
    part_number: 'CRL-THRES',
    unit_cost: 14.12,
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
  {
    type: 'magnetic',
    name: 'Magnetic Seal Set (180°)',
    description: 'PMA10 In-line Magnetic Profile (11mm Gap)',
    part_number: 'PMA10-SET',
    unit_cost: 35.0, // Placeholder
    location: 'door-hinge-side', // Strike side usually
  },
  {
    type: 'bulb',
    name: 'Translucent Bulb Seal',
    description: 'SDTJ Vinyl Bulb Seal (4-6mm Gap)',
    part_number: 'SDTJ',
    unit_cost: 16.0,
    location: 'door-hinge-side',
  },
  {
    type: 'v-seal',
    name: 'Translucent V Seal',
    description: 'SDJS V-Seal for out-swinging doors (5-6mm Gap)',
    part_number: 'SDTS',
    unit_cost: 16.0,
    location: 'door-hinge-side',
  },
  {
    type: 'l-seal',
    name: 'L Seal',
    description: 'SDTL L-Seal for hinge/strike jambs',
    part_number: 'SDTL',
    unit_cost: 14.0,
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
  // 'both' is a valid DoorOpening in types/design.ts but might need casting here if the import is stale
  if (doorOpening === ('both' as DoorOpening)) {
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
  // U-Channel for 10mm (Standard 2.41m)
  {
    part_number: 'SDCD38', // Base part
    supplier: 'CRL',
    category: 'channel',
    name: 'Deep U-Channel (2.41m)',
    description: 'Brite Anodized/Chrome/Nickel/Black available',
    unit_cost: 17.37,
    compatible_glass_thickness: [10],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'Aluminum',
      length: '2410mm',
      finish_type: 'Various',
    },
    in_stock: true,
  },
  // U-Channel for 10mm (Long 3.66m)
  {
    part_number: 'SDCD3812', // Base part
    supplier: 'CRL',
    category: 'channel',
    name: 'Deep U-Channel (3.66m)',
    description: 'Long length for floor-to-ceiling',
    unit_cost: 30.40,
    compatible_glass_thickness: [10],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'Aluminum',
      length: '3660mm',
      finish_type: 'Various',
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
