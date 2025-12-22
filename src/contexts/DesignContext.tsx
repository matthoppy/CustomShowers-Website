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

export interface DesignConfiguration {
  // Template selection
  template: ShowerTemplate | null;

  // Glass specifications
  glassType: GlassType;
  glassThickness: GlassThickness;

  // Mounting and hardware
  mountingType: MountingType;
  hardwareFinish: HardwareFinish;

  // Door configuration
  doorOpening: DoorOpening;

  // Seals
  includeSeals: boolean;
  sealType?: string;

  // Measurements (in mm)
  measurements: Measurements | null;

  // Additional options
  includeInstallation: boolean;
  customerNotes?: string;
}

interface DesignContextType {
  design: DesignConfiguration;
  updateTemplate: (template: ShowerTemplate) => void;
  updateConfiguration: (config: Partial<DesignConfiguration>) => void;
  updateMeasurements: (measurements: Measurements) => void;
  resetDesign: () => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

const DEFAULT_DESIGN: DesignConfiguration = {
  template: null,
  glassType: 'clear',
  glassThickness: 10,
  mountingType: 'channel',
  hardwareFinish: 'chrome',
  doorOpening: 'inward',
  includeSeals: true,
  sealType: 'full',
  measurements: null,
  includeInstallation: false,
};

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesign] = useState<DesignConfiguration>(DEFAULT_DESIGN);

  const updateTemplate = useCallback((template: ShowerTemplate) => {
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
