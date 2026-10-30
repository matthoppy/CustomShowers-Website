/**
 * Step-by-step measurement wizard.
 *
 * Walks the customer through one measurement at a time with the appropriate
 * diagram and input. Shows Back/Next navigation, step progress, and soft
 * warnings for shower head clearance and laser rake readouts.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { TemplateDiagram } from '../views/TemplateDiagrams';
import { getMeasureSteps, type MeasureStep } from '../measureSteps';
import type { ShowerTemplate } from '../templates';
import type { MeasureMethod, OpeningMeasurements } from '../measure';
import { wallLean } from '../measure';

interface MeasureWizardProps {
  template: ShowerTemplate;
  method: 'tape' | 'laser' | null;
  onMethodChange: (method: 'tape' | 'laser') => void;
  measurements: OpeningMeasurements;
  heightMm: number;
  onChange: (patch: Partial<OpeningMeasurements> & { heightMm?: number }) => void;
  /** Gemini-suggested values (keyed by step.id). Only prefill when field is empty. */
  geminiValues?: Record<string, number>;
}

export function MeasureWizard({
  template,
  method,
  onMethodChange,
  measurements,
  heightMm,
  onChange,
  geminiValues = {},
}: MeasureWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = getMeasureSteps(template, method);
  const step = steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLast) setCurrentStepIndex(currentStepIndex + 1);
  };

  const handleBack = () => {
    if (!isFirst) setCurrentStepIndex(currentStepIndex - 1);
  };

  // Get current value for this step
  const getCurrentValue = (): number | null => {
    if (!step) return null;

    switch (step.type) {
      case 'height':
        return heightMm;
      case 'width-floor':
        return step.runIndex !== null
          ? measurements.runs[step.runIndex]?.widthAtFloorMm ?? null
          : null;
      case 'width-top':
        return step.runIndex !== null
          ? measurements.runs[step.runIndex]?.widthAtTopCheckMm ?? null
          : null;
      case 'width-middle':
        return step.runIndex !== null
          ? measurements.runs[step.runIndex]?.widthAtTopCheckMm ?? null
          : null;
      case 'wall-start':
        return measurements.startWall.gapBottomMm;
      case 'wall-end':
        return measurements.endWall.gapBottomMm;
      case 'floor-level':
        return step.runIndex !== null
          ? measurements.runs[step.runIndex]?.floorFallMm ?? null
          : null;
      default:
        return null;
    }
  };

  const currentValue = getCurrentValue();

  // Get Gemini-suggested value if field is empty
  const geminiValue = currentValue === null || currentValue === 0 ? geminiValues[step.id] : undefined;

  const handleValueChange = (value: number | null) => {
    if (!step) return;

    switch (step.type) {
      case 'height':
        onChange({ heightMm: value ?? 0 });
        break;
      case 'width-floor':
        if (step.runIndex !== null) {
          const runs = [...measurements.runs];
          runs[step.runIndex] = {
            ...runs[step.runIndex],
            widthAtFloorMm: value ?? 0,
          };
          onChange({ runs });
        }
        break;
      case 'width-top':
        if (step.runIndex !== null) {
          const runs = [...measurements.runs];
          runs[step.runIndex] = {
            ...runs[step.runIndex],
            widthAtTopCheckMm: value,
          };
          onChange({ runs });
        }
        break;
      case 'wall-start':
        onChange({
          startWall: {
            ...measurements.startWall,
            method: 'laser',
            gapBottomMm: value,
          },
        });
        break;
      case 'wall-end':
        onChange({
          endWall: {
            ...measurements.endWall,
            method: 'laser',
            gapBottomMm: value,
          },
        });
        break;
      case 'floor-level':
        if (step.runIndex !== null) {
          const runs = [...measurements.runs];
          runs[step.runIndex] = {
            ...runs[step.runIndex],
            floorFallMm: Math.max(0, value ?? 0),
          };
          onChange({ runs });
        }
        break;
    }
  };

  // Soft warnings
  const warnings: string[] = [];

  // Shower head warning (if height < 2000mm and not a bath screen)
  if (step.type === 'height' && heightMm > 0 && heightMm < 2000 && template.id !== 'over-bath') {
    warnings.push(
      `At ${heightMm}mm, check the top edge will clear your shower head. Most need 2000mm or more.`
    );
  }

  // Laser rake readout (show computed rake when wall gaps are entered)
  if (step.type === 'wall-start' || step.type === 'wall-end') {
    const wall = step.type === 'wall-start' ? measurements.startWall : measurements.endWall;
    const lean = wallLean(wall);
    if (lean) {
      if (lean.leanMm > 0) {
        warnings.push(
          `Wall leans ${lean.direction === 'in' ? 'into' : 'away from'} the shower by ${lean.leanMm}mm at the top.`
        );
      } else {
        warnings.push('Wall is plumb.');
      }
    }
  }

  if (!step) return null;

  // Method selection (step 0 when method not chosen)
  if (step.type === 'method-select') {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold">{step.title}</h3>
        <p className="text-sm text-muted-foreground">{step.instruction}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onMethodChange('tape')}
            className="rounded border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="text-sm font-medium">Tape measure</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Measure wall gaps with a tape against a spirit level.
            </div>
          </button>
          <button
            type="button"
            onClick={() => onMethodChange('laser')}
            className="rounded border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="text-sm font-medium">Laser line</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Use a self-levelling laser for vertical reference.
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold">{step.title}</h3>

      {/* Diagram */}
      <div className="rounded bg-muted/40 p-3">
        <TemplateDiagram
          templateId={template.id}
          measurement={step.type}
          runIndex={step.runIndex ?? 0}
          className="w-full"
        />
      </div>

      {/* Instruction */}
      <p className="text-sm text-muted-foreground">{step.instruction}</p>

      {/* Input (skip for confirm step) */}
      {step.type !== 'confirm' && step.type !== 'height-reference' && step.type !== 'shower-head-check' && (
        <div className="space-y-2">
          <Label htmlFor="measurement-input" className="text-sm font-medium">
            Measurement (mm)
          </Label>
          <Input
            id="measurement-input"
            type="number"
            inputMode="numeric"
            placeholder={geminiValue ? `${geminiValue} (suggested)` : 'mm'}
            value={currentValue ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              handleValueChange(raw === '' ? null : Math.max(0, parseInt(raw, 10) || 0));
            }}
          />
        </div>
      )}

      {/* Soft warnings */}
      {warnings.length > 0 && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm">
            {warnings.map((warning, i) => (
              <p key={i} className="text-amber-800 dark:text-amber-300">
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="outline" onClick={handleBack} disabled={isFirst}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={isLast && step.required && !currentValue}>
          {isLast ? 'Done' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
