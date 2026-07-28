/**
 * Layout step — build the run.
 *
 * The customer adds panels to either end, turns junctions into corners, and
 * edits whichever panel is selected. Everything is reflected live in the plan.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, CornerUpRight } from 'lucide-react';
import { createPanel, type ConfiguratorPanel, type PanelKind } from '../types';
import type { StepProps } from './types';

export function LayoutStep({ state, update, activePanelId, setActivePanelId }: StepProps) {
  const active = state.panels.find((p) => p.id === activePanelId) ?? state.panels[0];

  const patchPanel = (id: string, patch: Partial<ConfiguratorPanel>) => {
    update({ panels: state.panels.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  };

  const addPanel = (side: 'left' | 'right', kind: PanelKind) => {
    const panel = createPanel(kind, Date.now());
    const panels = side === 'left' ? [panel, ...state.panels] : [...state.panels, panel];
    const junctions =
      side === 'left'
        ? [{ angle_deg: 180 as const }, ...state.junctions]
        : [...state.junctions, { angle_deg: 180 as const }];
    update({ panels, junctions });
    setActivePanelId(panel.id);
  };

  const removePanel = (id: string) => {
    if (state.panels.length <= 1) return;
    const index = state.panels.findIndex((p) => p.id === id);
    const panels = state.panels.filter((p) => p.id !== id);
    // Drop the junction that joined this panel to the rest of the run.
    const junctions = [...state.junctions];
    junctions.splice(index === 0 ? 0 : index - 1, 1);
    update({ panels, junctions });
    setActivePanelId(panels[Math.max(0, index - 1)].id);
  };

  const setNotch = (id: string, patch: Partial<NonNullable<ConfiguratorPanel['notches']>>) => {
    const panel = state.panels.find((p) => p.id === id);
    if (!panel) return;
    const base = panel.notches ?? {
      bottom_left: false,
      bottom_right: false,
      width_mm: 50,
      height_mm: 50,
    };
    patchPanel(id, { notches: { ...base, ...patch } });
  };

  const doorCount = state.panels.filter((p) => p.kind === 'door').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => addPanel('left', 'fixed')} className="justify-start">
          <Plus className="w-4 h-4 mr-2" />
          Panel left
        </Button>
        <Button variant="outline" onClick={() => addPanel('right', 'fixed')} className="justify-start">
          <Plus className="w-4 h-4 mr-2" />
          Panel right
        </Button>
      </div>

      {doorCount === 0 && (
        <Button variant="secondary" onClick={() => addPanel('right', 'door')} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add a door
        </Button>
      )}

      {/* Wall contact at each end. */}
      <div className="space-y-3 rounded-lg border p-4">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ends against a wall
        </Label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={state.leftWall}
              onCheckedChange={(v) => update({ leftWall: v === true })}
            />
            Left
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={state.rightWall}
              onCheckedChange={(v) => update({ rightWall: v === true })}
            />
            Right
          </label>
        </div>
      </div>

      {/* Corners. */}
      {state.junctions.length > 0 && (
        <div className="space-y-3 rounded-lg border p-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Corners
          </Label>
          <div className="space-y-2">
            {state.junctions.map((j, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Between panel {i + 1} and {i + 2}
                </span>
                <Button
                  size="sm"
                  variant={j.angle_deg === 90 ? 'default' : 'outline'}
                  onClick={() => {
                    const junctions = [...state.junctions];
                    junctions[i] = { angle_deg: j.angle_deg === 90 ? 180 : 90 };
                    update({ junctions });
                  }}
                >
                  <CornerUpRight className="w-3.5 h-3.5 mr-1.5" />
                  {j.angle_deg === 90 ? 'Corner' : 'Straight'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected panel. */}
      {active && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Panel {state.panels.indexOf(active) + 1} — {active.kind === 'door' ? 'Door' : 'Fixed'}
            </Label>
            {state.panels.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removePanel(active.id)}
                aria-label="Remove this panel"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-width">Width (mm)</Label>
            <Input
              id="panel-width"
              type="number"
              value={active.width_mm}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                patchPanel(active.id, { width_mm: Number.isNaN(v) ? 0 : v });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Panel type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={active.kind === 'fixed' ? 'default' : 'outline'}
                onClick={() => patchPanel(active.id, { kind: 'fixed', door: undefined })}
              >
                Fixed
              </Button>
              <Button
                variant={active.kind === 'door' ? 'default' : 'outline'}
                onClick={() =>
                  patchPanel(active.id, {
                    kind: 'door',
                    door: active.door ?? { hinge_side: 'right', swing: 'out' },
                  })
                }
              >
                Door
              </Button>
            </div>
          </div>

          {active.kind === 'door' && active.door && (
            <>
              <div className="space-y-2">
                <Label>Hinges on</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['left', 'right'] as const).map((side) => (
                    <Button
                      key={side}
                      variant={active.door!.hinge_side === side ? 'default' : 'outline'}
                      onClick={() =>
                        patchPanel(active.id, { door: { ...active.door!, hinge_side: side } })
                      }
                      className="capitalize"
                    >
                      {side}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Opens</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={active.door.swing === 'out' ? 'default' : 'outline'}
                    onClick={() => patchPanel(active.id, { door: { ...active.door!, swing: 'out' } })}
                  >
                    Outwards
                  </Button>
                  <Button
                    variant={active.door.swing === 'both' ? 'default' : 'outline'}
                    onClick={() => patchPanel(active.id, { door: { ...active.door!, swing: 'both' } })}
                  >
                    Both ways
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Notches — cut-outs for a tiled upstand or bath edge. */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notches
            </Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={active.notches?.bottom_left ?? false}
                  onCheckedChange={(v) => setNotch(active.id, { bottom_left: v === true })}
                />
                Bottom left
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={active.notches?.bottom_right ?? false}
                  onCheckedChange={(v) => setNotch(active.id, { bottom_right: v === true })}
                />
                Bottom right
              </label>
            </div>

            {(active.notches?.bottom_left || active.notches?.bottom_right) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="notch-w" className="text-xs">
                    Width (mm)
                  </Label>
                  <Input
                    id="notch-w"
                    type="number"
                    value={active.notches?.width_mm ?? 50}
                    onChange={(e) =>
                      setNotch(active.id, { width_mm: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notch-h" className="text-xs">
                    Height (mm)
                  </Label>
                  <Input
                    id="notch-h"
                    type="number"
                    value={active.notches?.height_mm ?? 50}
                    onChange={(e) =>
                      setNotch(active.id, { height_mm: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
