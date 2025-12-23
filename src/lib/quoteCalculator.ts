/**
 * Quote Calculator
 * Calculates pricing for shower enclosures based on design configuration
 */

import type { DesignConfiguration } from '@/contexts/DesignContext';
import {
  GLASS_PRICING_10MM,
  VAT_RATE,
  INSTALLATION_RATE_PER_SQM,
  HINGE_OPTIONS,
  HANDLE_OPTIONS,
  getRequiredSeals,
  selectHingeType,
} from './constants';

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category: 'glass' | 'hardware' | 'seals' | 'installation' | 'other';
}

export interface QuoteBreakdown {
  lineItems: QuoteLineItem[];
  subtotal: number;
  vat: number;
  total: number;
  validUntil: Date;
}

/**
 * Calculate glass area in square meters
 */
function calculateGlassArea(design: DesignConfiguration): number {
  if (!design.template || !design.measurements) {
    return 0;
  }

  const { width, height } = design.measurements;

  // Convert mm to meters
  const widthM = width / 1000;
  const heightM = height / 1000;

  // Calculate total glass area based on template panels
  // For now, simplified calculation - can be enhanced based on template
  const panelCount = design.template.panels.length;
  const areaPerPanel = widthM * heightM;

  return panelCount * areaPerPanel;
}

/**
 * Calculate door dimensions from measurements
 */
function calculateDoorDimensions(design: DesignConfiguration): { width: number; height: number } {
  if (!design.measurements) {
    return { width: 800, height: 2000 }; // Default values
  }

  // Find door panel from template
  const doorPanel = design.template?.panels.find(p => p.type === 'door');

  if (doorPanel && design.measurements.width) {
    // Calculate door width as percentage of total width
    const totalWidth = design.measurements.width;
    const doorWidth = totalWidth * 0.5; // Simplified: assume door is 50% of width

    return {
      width: doorWidth,
      height: design.measurements.height,
    };
  }

  return { width: 800, height: 2000 };
}

/**
 * Generate a detailed quote for the shower design
 */
export function generateQuote(design: DesignConfiguration): QuoteBreakdown {
  const lineItems: QuoteLineItem[] = [];

  // 1. Glass Cost
  const glassArea = calculateGlassArea(design);
  const glassPricePerSqm = GLASS_PRICING_10MM[design.glassType];
  const glassCost = glassArea * glassPricePerSqm;

  lineItems.push({
    description: `${design.glassType.charAt(0).toUpperCase() + design.glassType.slice(1)} Glass (10mm)`,
    quantity: glassArea,
    unit: 'm²',
    unitPrice: glassPricePerSqm,
    totalPrice: glassCost,
    category: 'glass',
  });

  // 2. Hinges (automatic selection based on door size)
  const doorDimensions = calculateDoorDimensions(design);
  const selectedHingeType = selectHingeType(doorDimensions.width, doorDimensions.height);
  const hingeOption = HINGE_OPTIONS.find(h => h.type === selectedHingeType)!;

  // Typically need 2-3 hinges per door
  const hingeCount = doorDimensions.height > 2000 ? 3 : 2;

  lineItems.push({
    description: `${hingeOption.name} Hinges`,
    quantity: hingeCount,
    unit: 'units',
    unitPrice: hingeOption.unit_cost,
    totalPrice: hingeCount * hingeOption.unit_cost,
    category: 'hardware',
  });

  // 3. Handle
  const handleOption = HANDLE_OPTIONS.find(h => h.type === design.handleType)!;

  if (handleOption.unit_cost > 0) {
    lineItems.push({
      description: handleOption.name,
      quantity: 1,
      unit: 'unit',
      unitPrice: handleOption.unit_cost,
      totalPrice: handleOption.unit_cost,
      category: 'hardware',
    });
  }

  // 4. Mounting Hardware (U-Channel or Clamps)
  const mountingCostPerMeter = design.mountingType === 'channel' ? 35 : 45;
  const perimeterMeters = design.measurements
    ? ((design.measurements.width + design.measurements.height * 2) / 1000)
    : 4;

  lineItems.push({
    description: `${design.mountingType === 'channel' ? 'U-Channel' : 'Glass Clamps'} (${design.hardwareFinish})`,
    quantity: perimeterMeters,
    unit: 'm',
    unitPrice: mountingCostPerMeter,
    totalPrice: perimeterMeters * mountingCostPerMeter,
    category: 'hardware',
  });

  // 5. Seals (if included)
  if (design.includeSeals) {
    const requiredSeals = getRequiredSeals(design.doorOpening, selectedHingeType);

    requiredSeals.forEach(seal => {
      // Calculate linear meters needed (simplified: height + width)
      const linearMeters = design.measurements
        ? ((design.measurements.height + design.measurements.width) / 1000)
        : 3;

      lineItems.push({
        description: seal.name,
        quantity: linearMeters,
        unit: 'm',
        unitPrice: seal.unit_cost,
        totalPrice: linearMeters * seal.unit_cost,
        category: 'seals',
      });
    });
  }

  // 6. Installation (if included)
  if (design.includeInstallation) {
    const installationCost = glassArea * INSTALLATION_RATE_PER_SQM;

    lineItems.push({
      description: 'Professional Installation',
      quantity: glassArea,
      unit: 'm²',
      unitPrice: INSTALLATION_RATE_PER_SQM,
      totalPrice: installationCost,
      category: 'installation',
    });
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  // Quote valid for 30 days
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  return {
    lineItems,
    subtotal,
    vat,
    total,
    validUntil,
  };
}

/**
 * Format currency in GBP
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

/**
 * Format date for quote validity
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
