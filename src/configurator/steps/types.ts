import type { ConfiguratorState } from '../types';
import type { TenantConfig } from '../tenant';

export interface StepProps {
  tenant: TenantConfig;
  state: ConfiguratorState;
  update: (patch: Partial<ConfiguratorState>) => void;
  activePanelId: string | null;
  setActivePanelId: (id: string | null) => void;
  /** Drawing box the step should render its view into. */
  canvasWidth: number;
  canvasHeight: number;
}

export type StepId = 'shape' | 'measure' | 'sizes' | 'hardware' | 'review';

export const STEPS: { id: StepId; label: string; heading: string; blurb: string }[] = [
  {
    id: 'shape',
    label: 'Shape',
    heading: 'Which one looks like your shower?',
    blurb: 'Pick the closest match. You can change every size and move things around next.',
  },
  {
    id: 'measure',
    label: 'Measure',
    heading: 'Measuring your opening',
    blurb: 'We cut the glass to these numbers, so this is the part worth getting right. Follow the pictures and it takes about ten minutes.',
  },
  {
    id: 'sizes',
    label: 'Layout',
    heading: 'How the glass is arranged',
    blurb: 'Split the opening into panels, and say where the door goes.',
  },
  {
    id: 'hardware',
    label: 'Hardware',
    heading: 'Hardware and glass',
    blurb: 'Choose how the glass is fixed and which finish you want.',
  },
  {
    id: 'review',
    label: 'Review',
    heading: 'Check and send',
    blurb: 'Here is what we will receive. Add your details and send it over.',
  },
];
