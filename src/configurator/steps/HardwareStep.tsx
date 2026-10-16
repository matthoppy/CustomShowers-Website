/**
 * Hardware step — fixing method, finish, handle and glass.
 *
 * Options come from the tenant's catalog, so each glazier only offers what
 * they actually stock.
 */

import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import type { StepProps } from './types';
import type { GlassThickness } from '@/types/square';
import type { GlassType, GlassCoating } from '../types';

const GLASS_TYPES: { id: GlassType; label: string; description: string }[] = [
  { id: 'clear', label: 'Clear', description: 'Standard clear glass' },
  { id: 'low-iron', label: 'Low Iron', description: 'Ultra-clear with minimal green tint' },
  { id: 'satin', label: 'Satin / Frosted', description: 'Translucent privacy glass' },
  { id: 'bronze', label: 'Bronze Tinted', description: 'Warm bronze tint' },
  { id: 'grey', label: 'Grey Tinted', description: 'Neutral grey tint' },
];

const GLASS_THICKNESSES: { value: GlassThickness; label: string }[] = [
  { value: 8, label: '8mm' },
  { value: 10, label: '10mm' },
];

const GLASS_COATINGS: { id: GlassCoating; label: string; description: string }[] = [
  { id: 'none', label: 'None', description: 'Standard glass' },
  { id: 'easy-clean', label: 'Easy-clean coating', description: 'Protective coating that repels water and soap' },
];

export function HardwareStep({ tenant, state, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fixing method
        </Label>
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => update({ mounting: 'channel' })}
            className={`rounded-lg border p-4 text-left transition-colors ${
              state.mounting === 'channel' ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
            }`}
          >
            <div className="font-semibold">U-channel</div>
            <div className="text-sm text-muted-foreground">
              Slim profile along the wall and floor. Most popular, and the most forgiving of walls
              that are out of plumb.
            </div>
          </button>
          <button
            type="button"
            onClick={() => update({ mounting: 'clamps' })}
            className={`rounded-lg border p-4 text-left transition-colors ${
              state.mounting === 'clamps' ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
            }`}
          >
            <div className="font-semibold">Glass clamps</div>
            <div className="text-sm text-muted-foreground">
              Minimal hardware for a fully frameless look. Needs a straighter wall and a silicone
              seal down the edge.
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Finish
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tenant.finishes.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => update({ finishId: f.id })}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                state.finishId === f.id ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <span
                className="h-6 w-6 shrink-0 rounded-full border"
                style={{ background: f.swatch }}
                aria-hidden
              />
              <span className="text-sm font-medium">{f.label}</span>
              {state.finishId === f.id && <Check className="ml-auto h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Handle
        </Label>
        <div className="grid gap-2">
          {tenant.handles.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => update({ handleId: h.id })}
              className={`rounded-lg border p-3 text-left transition-colors ${
                state.handleId === h.id ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{h.label}</div>
              <div className="text-sm text-muted-foreground">{h.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Glass type
        </Label>
        <div className="grid gap-2">
          {GLASS_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => update({ glassType: type.id })}
              className={`rounded-lg border p-3 text-left transition-colors ${
                state.glassType === type.id ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{type.label}</div>
              <div className="text-sm text-muted-foreground">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Glass thickness
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {GLASS_THICKNESSES.map((thickness) => (
            <button
              key={thickness.value}
              type="button"
              onClick={() => update({ glassThicknessMm: thickness.value })}
              className={`rounded-lg border p-3 text-left transition-colors ${
                state.glassThicknessMm === thickness.value ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{thickness.label}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          All glass is toughened safety glass. 10mm is standard for doors and tall panels.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Coating
        </Label>
        <div className="grid gap-2">
          {GLASS_COATINGS.map((coating) => (
            <button
              key={coating.id}
              type="button"
              onClick={() => update({ glassCoating: coating.id })}
              className={`rounded-lg border p-3 text-left transition-colors ${
                state.glassCoating === coating.id ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{coating.label}</div>
              <div className="text-sm text-muted-foreground">{coating.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
