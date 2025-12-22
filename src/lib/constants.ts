/**
 * BFS Website Constants
 * Pricing, hardware catalog, and business configuration
 */

import type {
  GlassType,
  GlassThickness,
  HardwareFinish,
  HardwareCatalogItem,
} from '@/types';

/**
 * UK VAT Rate (20%)
 */
export const VAT_RATE = 0.20;

/**
 * Quote validity period (days)
 */
export const QUOTE_VALIDITY_DAYS = 30;

/**
 * Glass pricing per square meter (in GBP)
 * Base prices before complexity multipliers
 */
export const GLASS_PRICING: Record<
  GlassType,
  Record<GlassThickness, number>
> = {
  clear: {
    8: 150,
    10: 180,
    12: 220,
  },
  frosted: {
    8: 170,
    10: 200,
    12: 240,
  },
  tinted: {
    8: 180,
    10: 210,
    12: 250,
  },
};

/**
 * Installation rate per square meter (optional service)
 */
export const INSTALLATION_RATE_PER_SQM = 85;

/**
 * Complexity multipliers for design configurations
 */
export const COMPLEXITY_FACTORS = {
  standard: 1.0,
  angled: 1.15, // Non-90° angles
  curved: 1.30, // Curved glass
  custom: 1.25, // Custom cuts or unusual shapes
} as const;

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
 * Hardware catalog - CRL Products
 */
export const CRL_HARDWARE_CATALOG: HardwareCatalogItem[] = [
  // Hinges
  {
    part_number: 'CRL-GENEVA037CH',
    supplier: 'CRL',
    category: 'hinge',
    name: 'Geneva 037 Series Hinge',
    description: 'Glass-to-wall hinge for 8-10mm glass',
    unit_cost: 45.0,
    compatible_glass_thickness: [8, 10],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black'],
    specifications: {
      material: 'Brass',
      weight_capacity: '50kg per pair',
      opening_angle: '90°',
    },
    in_stock: true,
  },
  {
    part_number: 'CRL-COLOGNE044CH',
    supplier: 'CRL',
    category: 'hinge',
    name: 'Cologne 044 Series Hinge',
    description: 'Heavy-duty glass-to-wall hinge for 10-12mm glass',
    unit_cost: 52.0,
    compatible_glass_thickness: [10, 12],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'Stainless Steel',
      weight_capacity: '70kg per pair',
      opening_angle: '90°',
    },
    in_stock: true,
  },

  // Handles
  {
    part_number: 'CRL-BTB12CH',
    supplier: 'CRL',
    category: 'handle',
    name: 'Back-to-Back Tubular Handle - 12"',
    description: '12" tubular ladder handle',
    unit_cost: 65.0,
    compatible_glass_thickness: [8, 10, 12],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black'],
    specifications: {
      material: 'Stainless Steel',
      diameter: '25mm',
      length: '300mm',
    },
    in_stock: true,
  },
  {
    part_number: 'CRL-BTB18CH',
    supplier: 'CRL',
    category: 'handle',
    name: 'Back-to-Back Tubular Handle - 18"',
    description: '18" tubular ladder handle',
    unit_cost: 75.0,
    compatible_glass_thickness: [8, 10, 12],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'Stainless Steel',
      diameter: '25mm',
      length: '450mm',
    },
    in_stock: true,
  },

  // U-Channel
  {
    part_number: 'CRL-UC8CH',
    supplier: 'CRL',
    category: 'channel',
    name: 'U-Channel for 8mm Glass',
    description: 'Aluminum U-channel, 2.5m length',
    unit_cost: 28.0,
    compatible_glass_thickness: [8],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black'],
    specifications: {
      material: 'Aluminum',
      length: '2500mm',
      finish_type: 'Anodized',
    },
    in_stock: true,
  },
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
  {
    part_number: 'CRL-UC12CH',
    supplier: 'CRL',
    category: 'channel',
    name: 'U-Channel for 12mm Glass',
    description: 'Aluminum U-channel, 2.5m length',
    unit_cost: 36.0,
    compatible_glass_thickness: [12],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'Aluminum',
      length: '2500mm',
      finish_type: 'Anodized',
    },
    in_stock: true,
  },

  // Seals
  {
    part_number: 'CRL-DS4180',
    supplier: 'CRL',
    category: 'seal',
    name: 'Bottom Door Seal',
    description: 'Flexible vinyl door bottom seal',
    unit_cost: 18.0,
    compatible_glass_thickness: [8, 10, 12],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'PVC',
      length: '2200mm',
      type: 'Wipe seal',
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
    compatible_glass_thickness: [8, 10, 12],
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
 * Hardware catalog - Glass Parts UK Products
 */
export const GLASS_PARTS_UK_CATALOG: HardwareCatalogItem[] = [
  // Hinges
  {
    part_number: 'GP-MINI-HINGE-CH',
    supplier: 'Glass Parts UK',
    category: 'hinge',
    name: 'Mini Shower Hinge',
    description: 'Compact glass-to-wall hinge for 8mm glass',
    unit_cost: 38.0,
    compatible_glass_thickness: [8],
    compatible_finishes: ['chrome', 'brushed-nickel'],
    specifications: {
      material: 'Brass',
      weight_capacity: '40kg per pair',
      opening_angle: '90°',
    },
    in_stock: true,
  },
  {
    part_number: 'GP-STD-HINGE-CH',
    supplier: 'Glass Parts UK',
    category: 'hinge',
    name: 'Standard Shower Hinge',
    description: 'Standard glass-to-wall hinge for 10mm glass',
    unit_cost: 42.0,
    compatible_glass_thickness: [10],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black'],
    specifications: {
      material: 'Brass',
      weight_capacity: '55kg per pair',
      opening_angle: '90°',
    },
    in_stock: true,
  },
  {
    part_number: 'GP-HD-HINGE-CH',
    supplier: 'Glass Parts UK',
    category: 'hinge',
    name: 'Heavy Duty Shower Hinge',
    description: 'Heavy-duty glass-to-wall hinge for 12mm glass',
    unit_cost: 48.0,
    compatible_glass_thickness: [12],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black', 'gold'],
    specifications: {
      material: 'Stainless Steel',
      weight_capacity: '75kg per pair',
      opening_angle: '90°',
    },
    in_stock: true,
  },

  // Handles
  {
    part_number: 'GP-PULL-300-CH',
    supplier: 'Glass Parts UK',
    category: 'handle',
    name: 'Pull Handle 300mm',
    description: 'Straight pull handle for shower doors',
    unit_cost: 58.0,
    compatible_glass_thickness: [8, 10, 12],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black'],
    specifications: {
      material: 'Stainless Steel',
      length: '300mm',
      diameter: '19mm',
    },
    in_stock: true,
  },

  // Clamps
  {
    part_number: 'GP-CLAMP-CH',
    supplier: 'Glass Parts UK',
    category: 'clamp',
    name: 'Glass Panel Clamp',
    description: 'Wall mounting clamp for fixed panels',
    unit_cost: 32.0,
    compatible_glass_thickness: [8, 10, 12],
    compatible_finishes: ['chrome', 'brushed-nickel', 'matte-black'],
    specifications: {
      material: 'Brass',
      type: 'Wall-to-glass',
    },
    in_stock: true,
  },
];

/**
 * Combined hardware catalog
 */
export const HARDWARE_CATALOG: HardwareCatalogItem[] = [
  ...CRL_HARDWARE_CATALOG,
  ...GLASS_PARTS_UK_CATALOG,
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
 * Measurement units
 */
export const UNITS = {
  metric: {
    length: 'mm',
    area: 'm²',
  },
  imperial: {
    length: 'in',
    area: 'ft²',
  },
} as const;

/**
 * Conversion factors
 */
export const CONVERSIONS = {
  MM_TO_INCHES: 0.0393701,
  INCHES_TO_MM: 25.4,
  SQM_TO_SQFT: 10.7639,
} as const;

/**
 * Business contact information
 */
export const BUSINESS_CONTACT = {
  name: 'Bespoke Frameless Showers',
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
