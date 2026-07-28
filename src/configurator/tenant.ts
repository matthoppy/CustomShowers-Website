/**
 * Tenant configuration.
 *
 * Everything company-specific lives here, so the configurator itself stays
 * generic. Adding a new glazier means adding an entry to TENANTS — no changes
 * to the engine, the views or the flow.
 *
 * There is deliberately no pricing: the tool captures a design and posts the
 * measurements to the glazier, who quotes it themselves.
 */

export interface HardwareFinish {
  id: string;
  label: string;
  /** Swatch colour for the picker. */
  swatch: string;
}

export interface HandleOption {
  id: string;
  label: string;
  description: string;
}

export interface TenantBrand {
  name: string;
  logoUrl?: string;
  /** CSS colour applied to primary actions and accents. */
  primary: string;
  primaryForeground: string;
}

export interface TenantConfig {
  id: string;
  brand: TenantBrand;
  /** Where completed enquiries are emailed. */
  destinationEmail: string;
  /** Reply-to shown on the enquiry, usually the customer's own address. */
  fromName: string;
  finishes: HardwareFinish[];
  handles: HandleOption[];
  glassThicknessesMm: number[];
  /**
   * Shown on the review step and repeated in the email. Spells out who is
   * responsible for the measurements being right, which matters when glass is
   * cut from them.
   */
  measurementDisclaimer: string;
  /** Optional line under the configurator heading. */
  intro?: string;
}

const DEFAULT_HANDLES: HandleOption[] = [
  { id: 'pull', label: 'Pull handle', description: 'Back-to-back bar handle, 203mm centres.' },
  { id: 'knob', label: 'Knob', description: 'Single round knob, centred at 950mm.' },
];

export const CUSTOM_SHOWERS: TenantConfig = {
  id: 'custom-showers',
  brand: {
    name: 'Custom Showers',
    primary: '#1e293b',
    primaryForeground: '#ffffff',
  },
  destinationEmail: 'enquiries@customshowers.uk',
  fromName: 'Custom Showers Design Tool',
  finishes: [
    { id: 'chrome', label: 'Polished chrome', swatch: '#c7ccd1' },
    { id: 'brushed-nickel', label: 'Brushed nickel', swatch: '#a8a29e' },
    { id: 'matte-black', label: 'Matte black', swatch: '#1c1917' },
    { id: 'brushed-brass', label: 'Brushed brass', swatch: '#b08d57' },
  ],
  handles: DEFAULT_HANDLES,
  glassThicknessesMm: [8, 10],
  measurementDisclaimer:
    'These measurements are provided by you as a guide. We will confirm all sizes on a site survey before any glass is cut — please do not treat this design as a final cutting list.',
  intro: 'Design your enclosure and send the measurements straight to our workshop.',
};

export const TENANTS: Record<string, TenantConfig> = {
  [CUSTOM_SHOWERS.id]: CUSTOM_SHOWERS,
};

export const DEFAULT_TENANT_ID = CUSTOM_SHOWERS.id;

export function getTenant(id?: string | null): TenantConfig {
  if (!id) return TENANTS[DEFAULT_TENANT_ID];
  return TENANTS[id] ?? TENANTS[DEFAULT_TENANT_ID];
}

export function finishLabel(tenant: TenantConfig, id: string): string {
  return tenant.finishes.find((f) => f.id === id)?.label ?? id;
}

export function handleLabel(tenant: TenantConfig, id: string): string {
  return tenant.handles.find((h) => h.id === id)?.label ?? id;
}
