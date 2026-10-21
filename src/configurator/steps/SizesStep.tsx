/**
 * Layout step — how the opening is divided into panels.
 *
 * The overall size and the condition of the walls and floor are settled in the
 * Measure step before this one. What is left is the arrangement: how wide each
 * panel is, which one is the door, and which way it opens.
 *
 * The template has already set the shape, so the default view is nothing but
 * labelled width boxes. Everything that lets you change the shape itself lives
 * under "More options", where it is available without being in the way.
 */

import { useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CornerUpRight, Plus, Trash2 } from 'lucide-react';
import { derivePlanes } from '../geometry';
import { createPanel, type ConfiguratorPanel, type PanelKind } from '../types';
import type { StepProps } from './types';

/** Name a panel the way a customer would point at it, not by index. */
function panelLabels(panels: ConfiguratorPanel[], junctions: { angle_deg: 90 | 180 }[]): string[] {
  const planes = derivePlanes(panels, junctions);
  const frontFixedCount = planes.filter((p, i) => p === 'front' && panels[i].kind === 'fixed').length;
  let frontFixedSeen = 0;

  return panels.map((panel, i) => {
    const plane = planes[i];
    if (panel.kind === 'door') return 'Door';
    if (plane === 'return_left') return 'Left side panel';
    if (plane === 'return_right') return 'Right side panel';
    if (plane === 'back') return 'Back panel';
    frontFixedSeen += 1;
    return frontFixedCount > 1 ? `Fixed panel ${frontFixedSeen}` : 'Fixed panel';
  });
}

export function SizesStep({ state, update }: StepProps) {
  const labels = useMemo(
    () => panelLabels(state.panels, state.junctions),
    [state.panels, state.junctions]
  );
  const doorIndex = state.panels.findIndex((p) => p.kind === 'door');
  const doorPanel = doorIndex >= 0 ? state.panels[doorIndex] : null;

  const patchPanel = (id: string, patch: Partial<ConfiguratorPanel>) =>
    update({ panels: state.panels.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  const addPanel = (side: 'left' | 'right', kind: PanelKind) => {
    const panel = createPanel(kind, Date.now());
    update({
      panels: side === 'left' ? [panel, ...state.panels] : [...state.panels, panel],
      junctions:
        side === 'left'
          ? [{ angle_deg: 180 as const }, ...state.junctions]
          : [...state.junctions, { angle_deg: 180 as const }],
    });
  };

  const removePanel = (id: string) => {
    if (state.panels.length <= 1) return;
    const index = state.panels.findIndex((p) => p.id === id);
    const junctions = [...state.junctions];
    junctions.splice(index === 0 ? 0 : index - 1, 1);
    update({ panels: state.panels.filter((p) => p.id !== id), junctions });
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

  return (
    <div className="space-y-6">
      {/* Widths. */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Panel widths (mm)
        </Label>
        <div className="space-y-2">
          {state.panels.map((panel, i) => (
            <div key={panel.id} className="flex items-center gap-2 rounded-lg border p-2.5 sm:gap-3 sm:p-3">
              <span className="min-w-0 flex-1 text-xs font-medium sm:text-sm">{labels[i]}</span>
              <Input
                type="number"
                aria-label={`${labels[i]} width in millimetres`}
                value={panel.width_mm}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  patchPanel(panel.id, { width_mm: Number.isNaN(v) ? 0 : v });
                }}
                className="w-20 text-sm sm:w-28"
              />
              {state.panels.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removePanel(panel.id)}
                  aria-label={`Remove ${labels[i]}`}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Measure the full opening. We take off the allowances for channels and seals ourselves.
        </p>
      </div>

      {/* The door choices a customer actually cares about. */}
      {doorPanel?.door && (
        <div className="space-y-4 rounded-lg border p-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            The door
          </Label>

          <div className="space-y-2">
            <Label className="text-sm">Which side are the hinges on?</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['left', 'right'] as const).map((side) => (
                <Button
                  key={side}
                  variant={doorPanel.door!.hinge_side === side ? 'default' : 'outline'}
                  onClick={() =>
                    patchPanel(doorPanel.id, { door: { ...doorPanel.door!, hinge_side: side } })
                  }
                  className="capitalize"
                >
                  {side}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Which way does it open?</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={doorPanel.door.swing === 'out' ? 'default' : 'outline'}
                onClick={() => patchPanel(doorPanel.id, { door: { ...doorPanel.door!, swing: 'out' } })}
              >
                Outwards
              </Button>
              <Button
                variant={doorPanel.door.swing === 'both' ? 'default' : 'outline'}
                onClick={() => patchPanel(doorPanel.id, { door: { ...doorPanel.door!, swing: 'both' } })}
              >
                Both ways
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Everything that changes the shape, out of the way but not hidden. */}
      <Accordion type="multiple" className="rounded-lg border px-4">
        <AccordionItem value="layout" className="border-b-0">
          <AccordionTrigger className="text-sm">Change the shape</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => addPanel('left', 'fixed')}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Panel on the left
              </Button>
              <Button variant="outline" size="sm" onClick={() => addPanel('right', 'fixed')}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Panel on the right
              </Button>
            </div>

            {doorIndex === -1 && (
              <Button variant="secondary" size="sm" className="w-full" onClick={() => addPanel('right', 'door')}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add a door
              </Button>
            )}

            {state.junctions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Where the panels meet</Label>
                {state.junctions.map((j, i) => (
                  <div key={i} className="space-y-2">
                    <span className="text-sm font-medium">
                      {labels[i]} to {labels[i + 1]}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={j.angle_deg === 180 ? 'default' : 'outline'}
                        onClick={() => {
                          const junctions = [...state.junctions];
                          junctions[i] = { angle_deg: 180 };
                          update({ junctions });
                        }}
                      >
                        180° (In line)
                      </Button>
                      <Button
                        size="sm"
                        variant={j.angle_deg === 90 ? 'default' : 'outline'}
                        onClick={() => {
                          const junctions = [...state.junctions];
                          junctions[i] = { angle_deg: 90 };
                          update({ junctions });
                        }}
                      >
                        <CornerUpRight className="mr-1.5 h-3.5 w-3.5" />
                        90° (Corner)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ends against a wall</Label>
              <div className="flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.leftWall}
                    onCheckedChange={(v) => update({ leftWall: v === true })}
                  />
                  Left
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.rightWall}
                    onCheckedChange={(v) => update({ rightWall: v === true })}
                  />
                  Right
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notches" className="border-b-0">
          <AccordionTrigger className="text-sm">Cut-outs at the bottom</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-muted-foreground">
              For a tiled upstand, a bath edge or a step the glass has to sit around.
            </p>
            {state.panels.map((panel, i) => (
              <div key={panel.id} className="space-y-2 rounded border p-3">
                <span className="text-sm font-medium">{labels[i]}</span>
                <div className="flex items-center gap-5">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={panel.notches?.bottom_left ?? false}
                      onCheckedChange={(v) => setNotch(panel.id, { bottom_left: v === true })}
                    />
                    Bottom left
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={panel.notches?.bottom_right ?? false}
                      onCheckedChange={(v) => setNotch(panel.id, { bottom_right: v === true })}
                    />
                    Bottom right
                  </label>
                </div>
                {(panel.notches?.bottom_left || panel.notches?.bottom_right) && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Width (mm)</Label>
                      <Input
                        type="number"
                        value={panel.notches?.width_mm ?? 50}
                        onChange={(e) =>
                          setNotch(panel.id, { width_mm: parseInt(e.target.value, 10) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height (mm)</Label>
                      <Input
                        type="number"
                        value={panel.notches?.height_mm ?? 50}
                        onChange={(e) =>
                          setNotch(panel.id, { height_mm: parseInt(e.target.value, 10) || 0 })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
