/**
 * Design Context
 * Global state management for shower design tool
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  GlassType,
  GlassThickness,
  HardwareFinish,
  DoorOpening,
  Measurements,
} from '@/types';
import type { ShowerTemplate, MountingType } from '@/lib/templates';
import type { MeasurementPoint } from '@/lib/measurements';
import { DEFAULT_INLINE_MEASUREMENTS, DEFAULT_CORNER_MEASUREMENTS } from '@/lib/measurements';
import type { HingeType, HandleType } from '@/lib/constants';
import { STANDARD_GLASS_THICKNESS } from '@/lib/constants';

export interface DesignConfiguration {
  // Template selection
  template: ShowerTemplate | null;

  // Glass specifications
  glassType: GlassType;
  glassThickness: GlassThickness;

  // Mounting and hardware
  mountingType: MountingType;
  hardwareFinish: HardwareFinish;
  hingeType: HingeType;
  handleType: HandleType;

  // Door configuration
  doorOpening: DoorOpening;

  // Seals
  includeSeals: boolean;
  sealType?: string;

  // Measurements (in mm)
  measurements: Measurements | null;
  measurementPoints: MeasurementPoint[];

  // Additional options
  includeInstallation: boolean;
  customerNotes?: string;
}

interface DesignContextType {
  design: DesignConfiguration;
  updateTemplate: (template: ShowerTemplate) => void;
  updateConfiguration: (config: Partial<DesignConfiguration>) => void;
  updateMeasurements: (measurements: Measurements) => void;
  updateMeasurementPoint: (point: MeasurementPoint) => void;
  resetDesign: () => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

const DEFAULT_DESIGN: DesignConfiguration = {
  template: null,
  glassType: 'clear',
  glassThickness: STANDARD_GLASS_THICKNESS,
  mountingType: 'channel',
  hardwareFinish: 'chrome',
  hingeType: 'geneva',
  handleType: 'circular-8inch',
  doorOpening: 'inward',
  includeSeals: true,
  sealType: 'full',
  measurements: null,
  measurementPoints: [],
  includeInstallation: false,
};

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesign] = useState<DesignConfiguration>(DEFAULT_DESIGN);

  const updateTemplate = useCallback((template: ShowerTemplate) => {
    // Get default measurement points based on template category
    let defaultPoints: MeasurementPoint[];
    if (template.category === 'corner') {
      defaultPoints = DEFAULT_CORNER_MEASUREMENTS;
    } else {
      defaultPoints = DEFAULT_INLINE_MEASUREMENTS;
    }

    setDesign((prev) => ({
      ...prev,
      template,
      // Update defaults based on template
      mountingType: template.supportedMounting[0],
      doorOpening: template.supportedDoorOpenings[0],
      glassThickness: template.recommendedThickness[template.recommendedThickness.length - 1] as GlassThickness,
      measurements: {
        width: template.defaultMeasurements.width,
        height: template.defaultMeasurements.height,
        depth: template.defaultMeasurements.depth,
        wall_to_wall: false,
      },
      measurementPoints: defaultPoints,
    }));
  }, []);

  const updateConfiguration = useCallback(
    (config: Partial<DesignConfiguration>) => {
      setDesign((prev) => ({ ...prev, ...config }));
    },
    []
  );

  const updateMeasurements = useCallback((measurements: Measurements) => {
    setDesign((prev) => ({ ...prev, measurements }));
  }, []);

  const updateMeasurementPoint = useCallback((point: MeasurementPoint) => {
    setDesign((prev) => ({
      ...prev,
      measurementPoints: prev.measurementPoints.map((p) =>
        p.id === point.id ? point : p
      ),
    }));
  }, []);

  const resetDesign = useCallback(() => {
    setDesign(DEFAULT_DESIGN);
  }, []);

  return (
    <DesignContext.Provider
      value={{
        design,
        updateTemplate,
        updateConfiguration,
        updateMeasurements,
        updateMeasurementPoint,
        resetDesign,
      }}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
}
