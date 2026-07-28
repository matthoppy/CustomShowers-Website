/**
 * Review step — show exactly what the glazier will receive, then send it.
 *
 * Since there is no pricing, this screen is the product: if the customer can
 * see their own measurements laid out clearly here, the email that lands in
 * the workshop is trustworthy.
 */

import { useMemo } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Info } from 'lucide-react';
import { buildSpec } from '../spec';
import { finishLabel, handleLabel } from '../tenant';
import type { CustomerDetails } from '../types';
import type { StepProps } from './types';

interface ReviewStepProps extends StepProps {
  customer: CustomerDetails;
  setCustomer: (patch: Partial<CustomerDetails>) => void;
  onTurnstileToken: (token: string | null) => void;
}

export function ReviewStep({
  tenant,
  state,
  customer,
  setCustomer,
  onTurnstileToken,
}: ReviewStepProps) {
  const spec = useMemo(() => buildSpec(state), [state]);

  return (
    <div className="space-y-6">
      {/* Panel schedule. */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-4 py-3">
          <h3 className="text-sm font-semibold">Panel schedule</h3>
          <p className="text-xs text-muted-foreground">
            Cut sizes shown after {state.mounting === 'channel' ? 'channel' : 'clamp'} deductions.
          </p>
        </div>
        <div className="divide-y">
          {spec.panels.map((p) => (
            <div key={p.id} className="px-4 py-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{p.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  measured {p.tightWidthMm} × {p.tightHeightMm}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-4">
                <span className="text-muted-foreground">Cut size</span>
                <span className="font-mono font-semibold">
                  {p.cutWidthMm} × {p.cutHeightMm} mm
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
                <span>Weight</span>
                <span className="font-mono">{p.weightKg} kg</span>
              </div>

              {p.door && (
                <div className="mt-2 rounded bg-muted/50 px-3 py-2 text-xs">
                  <div className="flex justify-between">
                    <span>Hinges</span>
                    <span className="font-medium capitalize">
                      {p.door.hingeBrand} · {p.door.hingeSide} hand
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hinge offsets</span>
                    <span className="font-mono">
                      {p.door.hingePlacement.bottomHingeOffset}mm from each edge
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opens</span>
                    <span>{p.door.swing === 'both' ? 'Both ways' : 'Outwards only'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seal</span>
                    <span>{p.door.sealType}</span>
                  </div>
                </div>
              )}

              {p.notches.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Notches:{' '}
                  {p.notches
                    .map((n) => `${n.corner.toLowerCase()} ${n.widthMm}×${n.heightMm}mm`)
                    .join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Run summary. */}
      <dl className="grid overflow-hidden rounded-lg border sm:grid-cols-2">
        {[
          ['Overall run', `${spec.totalRunWidthMm}mm`],
          ['Corners', `${spec.cornerCount}`],
          ['Height', `${spec.heightMm}mm${spec.isFloorToCeiling ? ' (floor to ceiling)' : ''}`],
          ['Channel required', `${spec.totalChannelLengthMm}mm`],
          ['Glass', `${spec.glassThicknessMm}mm toughened`],
          ['Total weight', `${spec.totalGlassWeightKg}kg`],
          ['Fixing', state.mounting === 'channel' ? 'U-channel' : 'Glass clamps'],
          ['Finish', finishLabel(tenant, state.finishId)],
          ['Handle', handleLabel(tenant, state.handleId)],
        ].map(([label, value]) => (
          // Borders on the cells rather than a gap-px grid, so an odd number
          // of entries doesn't leave a bare grey square in the last slot.
          <div key={label} className="border-b border-r px-4 py-3 last:border-b-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {spec.rakeNotes.length > 0 && (
        <div className="flex gap-3 rounded-lg border bg-muted/40 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1 text-sm">
            {spec.rakeNotes.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>
        </div>
      )}

      {spec.warnings.length > 0 && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              Worth checking before we cut
            </div>
            {spec.warnings.map((w) => (
              <div key={w} className="text-amber-800 dark:text-amber-300">
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact. */}
      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Your details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cust-name">Name</Label>
            <Input
              id="cust-name"
              value={customer.name}
              onChange={(e) => setCustomer({ name: e.target.value })}
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-email">Email</Label>
            <Input
              id="cust-email"
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer({ email: e.target.value })}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-phone">Phone</Label>
            <Input
              id="cust-phone"
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer({ phone: e.target.value })}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-postcode">Postcode</Label>
            <Input
              id="cust-postcode"
              value={customer.postcode}
              onChange={(e) => setCustomer({ postcode: e.target.value })}
              autoComplete="postal-code"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cust-notes">Anything else we should know?</Label>
            <Textarea
              id="cust-notes"
              value={customer.notes}
              onChange={(e) => setCustomer({ notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Who is responsible for the measurements. */}
      <label className="flex cursor-pointer gap-3 rounded-lg border p-4">
        <Checkbox
          checked={customer.measurementsAcknowledged}
          onCheckedChange={(v) => setCustomer({ measurementsAcknowledged: v === true })}
          className="mt-0.5"
        />
        <span className="text-sm text-muted-foreground">{tenant.measurementDisclaimer}</span>
      </label>

      {tenant.turnstileSiteKey && (
        <div className="flex justify-center">
          <Turnstile
            siteKey={tenant.turnstileSiteKey}
            onSuccess={onTurnstileToken}
            onExpire={() => onTurnstileToken(null)}
            onError={() => onTurnstileToken(null)}
          />
        </div>
      )}
    </div>
  );
}
