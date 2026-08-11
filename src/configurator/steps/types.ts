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

export type StepId = 'shape' | 'sizes' | 'hardware' | 'review';

export const STEPS: { id: StepId; label: string; heading: string; blurb: string }[] = [
  {
    id: 'shape',
    label: 'Shape',
    heading: 'Which one looks like your shower?',
    blurb: 'Pick the closest match. You can change every size and move things around next.',
  },
  {
    id: 'sizes',
    label: 'Sizes',
    heading: 'Your measurements',
    blurb: 'Measure the opening and tell us how tall you want the glass.',
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
