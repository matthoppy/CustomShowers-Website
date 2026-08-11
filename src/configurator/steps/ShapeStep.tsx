/**
 * Shape step — pick the layout that looks like your bathroom.
 *
 * This is the whole point of the template layer: the first thing a customer
 * does is recognise a picture, not construct a geometry.
 */

import { Pencil } from 'lucide-react';
import { TEMPLATES, type ShowerTemplate } from '../templates';
import { TemplateThumbnail } from '../views/TemplateThumbnail';
import type { StepProps } from './types';

interface ShapeStepProps extends StepProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: ShowerTemplate) => void;
  onStartFromScratch: () => void;
}

export function ShapeStep({
  tenant,
  selectedTemplateId,
  onSelectTemplate,
  onStartFromScratch,
}: ShapeStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const selected = t.id === selectedTemplateId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTemplate(t)}
              aria-pressed={selected}
              // Stacked rather than side by side: beside a 132px drawing the
              // names wrap to three lines in a two-column grid.
              className={`flex flex-col rounded-lg border p-4 text-left transition-colors ${
                selected ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              <span className="mb-3 flex justify-center">
                <TemplateThumbnail
                  panels={t.panels}
                  junctions={t.junctions}
                  accent={tenant.brand.primary}
                />
              </span>
              <span className="font-semibold">{t.name}</span>
              <span className="mt-0.5 text-sm text-muted-foreground">{t.description}</span>
            </button>
          );
        })}
      </div>

      {/* The chain builder is still there for anything the presets don't cover. */}
      <button
        type="button"
        onClick={onStartFromScratch}
        aria-pressed={selectedTemplateId === null}
        className={`flex w-full items-center gap-4 rounded-lg border border-dashed p-4 text-left transition-colors ${
          selectedTemplateId === null ? 'border-foreground bg-muted' : 'hover:bg-muted/50'
        }`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
          <Pencil className="h-5 w-5 text-muted-foreground" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">Something else</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Start with a single panel and build the shape yourself. You can add panels and turn
            corners on the next step.
          </span>
        </span>
      </button>

      <p className="text-sm text-muted-foreground">
        Not sure? Pick whichever is closest — you can change every size, add panels and move the
        door on the next step.
      </p>
    </div>
  );
}
