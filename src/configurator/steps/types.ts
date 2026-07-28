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

export type StepId = 'layout' | 'dimensions' | 'hardware' | 'review';

export const STEPS: { id: StepId; label: string; heading: string; blurb: string }[] = [
  {
    id: 'layout',
    label: 'Layout',
    heading: 'Design your layout',
    blurb: 'Add panels and corners until the shape matches your space. Tap a panel to edit it.',
  },
  {
    id: 'dimensions',
    label: 'Dimensions',
    heading: 'Height and out-of-square',
    blurb: 'Tell us how tall the glass needs to be, and whether the floor or walls run off true.',
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
