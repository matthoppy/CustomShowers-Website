/**
 * Dimensions step — height, and how far the room is out of true.
 *
 * Rakes matter because a screen cut square to a floor that falls 12mm across
 * the opening leaves a visible wedge of daylight at one end.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RakeDirection, WallRakeDirection } from '../types';
import type { StepProps } from './types';

const HEIGHT_PRESETS = [1850, 2000, 2100];

export function DimensionsStep({ state, update }: StepProps) {
  const setRake = (
    key: 'floor' | 'leftWall' | 'rightWall',
    patch: Partial<{ amount_mm: number; direction: string }>
  ) => {
    update({
      rakes: {
        ...state.rakes,
        [key]: { ...state.rakes[key], ...patch },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="height">Glass height (mm)</Label>
        <Input
          id="height"
          type="number"
          value={state.heightMm}
          onChange={(e) => update({ heightMm: parseInt(e.target.value, 10) || 0 })}
        />
        <div className="flex gap-2">
          {HEIGHT_PRESETS.map((h) => (
            <Button
              key={h}
              size="sm"
              variant={state.heightMm === h ? 'default' : 'outline'}
              onClick={() => update({ heightMm: h })}
            >
              {h}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Usually measured to a grout line above the shower head. Most enclosures land between
          2000mm and 2100mm.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Floor to ceiling?
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={!state.isFloorToCeiling ? 'default' : 'outline'}
            onClick={() => update({ isFloorToCeiling: false })}
          >
            Standard height
          </Button>
          <Button
            variant={state.isFloorToCeiling ? 'default' : 'outline'}
            onClick={() => update({ isFloorToCeiling: true })}
          >
            Floor to ceiling
          </Button>
        </div>
        {state.isFloorToCeiling && (
          <p className="text-xs text-muted-foreground">
            Floor-to-ceiling screens take a larger deduction top and bottom so the glass can be
            manoeuvred into the channel.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Out of square
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Leave these at zero if the floor is level and the walls are plumb.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="floor-rake" className="text-sm">
            Floor falls
          </Label>
          <div className="flex gap-2">
            <Input
              id="floor-rake"
              type="number"
              value={state.rakes.floor.amount_mm}
              onChange={(e) => setRake('floor', { amount_mm: parseInt(e.target.value, 10) || 0 })}
              className="w-24"
            />
            {(['none', 'left', 'right'] as RakeDirection[]).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={state.rakes.floor.direction === d ? 'default' : 'outline'}
                onClick={() => setRake('floor', { direction: d })}
                className="capitalize"
              >
                {d === 'none' ? 'Level' : d}
              </Button>
            ))}
          </div>
        </div>

        {(['leftWall', 'rightWall'] as const).map((key) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`${key}-rake`} className="text-sm">
              {key === 'leftWall' ? 'Left wall leans' : 'Right wall leans'}
            </Label>
            <div className="flex gap-2">
              <Input
                id={`${key}-rake`}
                type="number"
                value={state.rakes[key].amount_mm}
                onChange={(e) => setRake(key, { amount_mm: parseInt(e.target.value, 10) || 0 })}
                className="w-24"
              />
              {(['none', 'in', 'out'] as WallRakeDirection[]).map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={state.rakes[key].direction === d ? 'default' : 'outline'}
                  onClick={() => setRake(key, { direction: d })}
                  className="capitalize"
                >
                  {d === 'none' ? 'Plumb' : d}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
