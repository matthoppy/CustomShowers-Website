/**
 * Guided measuring wizard — one measurement per screen with illustrations.
 * Data-driven from measurementPlans.ts.
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Ruler, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { calculateRake, type LaserGapMeasurements } from './rakeCalculations';
import {
  getMeasurementPlan,
  getStepsForMethod,
  DEFAULT_GLASS_HEIGHT_MM,
  MIN_HEAD_CLEARANCE_MM,
  type HeightReference,
} from './measurementPlans';
import type { MeasuringMethod } from './types';
import { WizardIllustrations } from './WizardIllustrations';

export interface MeasuringResult {
  measuringMethod: MeasuringMethod;
  configurationId: string;
  measurements: Record<string, string | number>;
  heightReference: HeightReference;
  heightToReferenceMm: number;
  showerHeadHeightMm: number;
  headClearanceWarning?: string;
  floorType?: 'tray' | 'wet-room' | 'over-bath';
  obstacles?: string[];
  laserGaps?: {
    leftWall?: LaserGapMeasurements & { description: string; warningMessage?: string };
    rightWall?: LaserGapMeasurements & { description: string; warningMessage?: string };
    backWall?: LaserGapMeasurements & { description: string; warningMessage?: string };
  };
  notSure: string[];
}

interface MeasuringWizardProps {
  configurationId: string;
  onComplete: (result: MeasuringResult) => void;
  onBack: () => void;
}

export function MeasuringWizard({ configurationId, onComplete, onBack }: MeasuringWizardProps) {
  const plan = getMeasurementPlan(configurationId);

  const [measuringMethod, setMeasuringMethod] = useState<MeasuringMethod>('tape');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 = method choice
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notSure, setNotSure] = useState<Set<string>>(new Set());
  const [floorType, setFloorType] = useState<'tray' | 'wet-room' | 'over-bath'>('tray');
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [heightReference, setHeightReference] = useState<HeightReference>('grout-line');
  const [heightToReference, setHeightToReference] = useState('');
  const [showerHeadHeight, setShowerHeadHeight] = useState('');

  const steps = currentStepIndex === -1 ? [] : getStepsForMethod(plan, measuringMethod);
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const isLast = currentStepIndex === steps.length - 1;

  const getValue = (key: string) => measurements[key] || '';
  const setValue = (key: string, value: string) => {
    setMeasurements((m) => ({ ...m, [key]: value }));
    notSure.delete(key);
    setNotSure(new Set(notSure));
  };

  const toggleNotSure = (key: string, defaultValue: string) => {
    if (notSure.has(key)) {
      notSure.delete(key);
      setNotSure(new Set(notSure));
    } else {
      setValue(key, defaultValue);
      setNotSure(new Set(notSure.add(key)));
    }
  };

  const canProceed = useCallback(() => {
    if (currentStepIndex === -1) return true; // Method choice

    if (!currentStep) return false;

    const stepId = currentStep.id;

    // Check if this step has required inputs
    if (stepId.includes('width') || stepId.includes('depth') || stepId.includes('panel')) {
      const value = getValue(stepId);
      return notSure.has(stepId) || (value.trim() !== '' && parseInt(value, 10) > 0);
    }

    if (stepId === 'height-reference') {
      return true; // Always can proceed with a reference selected
    }

    if (stepId === 'height-measurement') {
      return notSure.has('height') || (heightToReference.trim() !== '' && parseInt(heightToReference, 10) > 0);
    }

    if (stepId === 'shower-head-height') {
      return showerHeadHeight.trim() !== '' && parseInt(showerHeadHeight, 10) > 0;
    }

    if (stepId.startsWith('laser-')) {
      const wallKey = stepId.replace('laser-', '');
      const top = getValue(`${wallKey}-gap-top`);
      const bottom = getValue(`${wallKey}-gap-bottom`);
      return top.trim() !== '' && bottom.trim() !== '' && parseInt(top, 10) >= 0 && parseInt(bottom, 10) >= 0;
    }

    if (stepId === 'floor-type') {
      return true;
    }

    if (stepId === 'plumb-check' || stepId === 'obstacles') {
      return true; // Optional steps
    }

    return true;
  }, [currentStepIndex, currentStep, measurements, notSure, heightToReference, showerHeadHeight, getValue]);

  const handleNext = () => {
    if (currentStepIndex === -1) {
      // Move from method choice to first step
      setCurrentStepIndex(0);
      return;
    }

    if (isLast) {
      // Build result
      const heightMm = notSure.has('height')
        ? DEFAULT_GLASS_HEIGHT_MM
        : parseInt(heightToReference, 10);

      const showerHeadMm = parseInt(showerHeadHeight, 10);
      let headClearanceWarning: string | undefined;

      if (showerHeadMm > 0) {
        const clearance = heightMm - showerHeadMm;
        if (clearance < 0) {
          headClearanceWarning = `Glass top (${heightMm}mm) is BELOW the shower head (${showerHeadMm}mm)`;
        } else if (clearance < MIN_HEAD_CLEARANCE_MM) {
          headClearanceWarning = `Glass top is only ${clearance}mm above the shower head (minimum ${MIN_HEAD_CLEARANCE_MM}mm recommended)`;
        }
      }

      const laserGaps: MeasuringResult['laserGaps'] = {};

      if (measuringMethod === 'laser') {
        const processWall = (wallKey: string, wallName: string) => {
          const top = parseInt(getValue(`${wallKey}-gap-top`), 10);
          const bottom = parseInt(getValue(`${wallKey}-gap-bottom`), 10);
          const middle = getValue(`${wallKey}-gap-middle`);
          const middleMm = middle ? parseInt(middle, 10) : undefined;

          if (!isNaN(top) && !isNaN(bottom)) {
            const gaps: LaserGapMeasurements = {
              gapTopMm: top,
              gapBottomMm: bottom,
              gapMiddleMm: !isNaN(middleMm!) ? middleMm : undefined,
              heightMm,
            };
            const rake = calculateRake(gaps, wallName);
            return {
              ...gaps,
              description: rake.description,
              warningMessage: rake.warningMessage,
            };
          }
          return undefined;
        };

        if (steps.some((s) => s.id === 'laser-left-wall')) {
          const left = processWall('left-wall', 'Left wall');
          if (left) laserGaps.leftWall = left;
        }
        if (steps.some((s) => s.id === 'laser-right-wall')) {
          const right = processWall('right-wall', 'Right wall');
          if (right) laserGaps.rightWall = right;
        }
        if (steps.some((s) => s.id === 'laser-back-wall' || s.id === 'laser-anchor-wall' || s.id === 'laser-return-wall' || s.id === 'laser-side-wall')) {
          const back = processWall('back-wall', 'Back wall');
          if (back) laserGaps.backWall = back;
        }
      }

      const result: MeasuringResult = {
        measuringMethod,
        configurationId,
        measurements: Object.fromEntries(
          Object.entries(measurements).map(([k, v]) => [k, parseInt(v, 10) || v])
        ),
        heightReference,
        heightToReferenceMm: heightMm,
        showerHeadHeightMm: showerHeadMm,
        headClearanceWarning,
        floorType: steps.some((s) => s.id === 'floor-type') ? floorType : undefined,
        obstacles: steps.some((s) => s.id === 'obstacles') ? obstacles : undefined,
        laserGaps: Object.keys(laserGaps).length > 0 ? laserGaps : undefined,
        notSure: Array.from(notSure),
      };

      onComplete(result);
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex === 0) {
      setCurrentStepIndex(-1);
    } else if (currentStepIndex === -1) {
      onBack();
    } else {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Method choice screen
  if (currentStepIndex === -1) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back
          </Button>
          <h2 className="text-2xl font-bold">How will you measure?</h2>
          <p className="mt-2 text-muted-foreground">
            Choose your measuring tool. Both work — laser is faster but needs a spirit level to check
            if walls are plumb.
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMeasuringMethod('tape')}
            className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:border-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 ${
              measuringMethod === 'tape' ? 'border-foreground bg-muted' : ''
            }`}
            style={{ minHeight: '44px' }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Ruler className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Tape measure</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Traditional method. Measure openings and optionally check walls with a spirit level.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMeasuringMethod('laser')}
            className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:border-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 ${
              measuringMethod === 'laser' ? 'border-foreground bg-muted' : ''
            }`}
            style={{ minHeight: '44px' }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Laser measure</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Project a vertical laser line parallel to each wall, then measure gaps with a tape to
                check if the wall is plumb.
              </p>
            </div>
          </button>
        </div>

        <div className="flex justify-end border-t pt-6">
          <Button onClick={handleNext} style={{ minHeight: '44px' }}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  const stepId = currentStep.id;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i === currentStepIndex ? 'bg-primary' : i < currentStepIndex ? 'bg-primary/40' : 'bg-muted'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
        <h2 className="text-2xl font-bold">{currentStep.title}</h2>
        <p className="mt-1 text-muted-foreground">{currentStep.description}</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted p-6">
        <WizardIllustrations illustrationId={currentStep.illustrationId} />
      </div>

      <div
        className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
        role="status"
        aria-live="polite"
      >
        <strong className="block font-semibold">Tip:</strong>
        <span className="mt-1 block">{currentStep.tip}</span>
      </div>

      <div className="space-y-4">
        {/* Width/depth/panel measurements */}
        {(stepId.includes('width') || stepId.includes('depth') || stepId.includes('panel')) && (
          <>
            <div className="space-y-2">
              <Label htmlFor={stepId}>Measurement (mm)</Label>
              <Input
                id={stepId}
                type="number"
                value={getValue(stepId)}
                onChange={(e) => setValue(stepId, e.target.value)}
                disabled={notSure.has(stepId)}
                placeholder="e.g. 900"
                className="text-base"
                style={{ minHeight: '44px' }}
              />
            </div>
            {!currentStep.required && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
                <Checkbox
                  checked={notSure.has(stepId)}
                  onCheckedChange={() => toggleNotSure(stepId, '900')}
                />
                <span className="flex-1 text-sm">
                  I'm not sure — use a typical size and confirm on survey
                </span>
              </label>
            )}
          </>
        )}

        {/* Height reference */}
        {stepId === 'height-reference' && (
          <RadioGroup value={heightReference} onValueChange={(v) => setHeightReference(v as HeightReference)}>
            <div className="space-y-2">
              {[
                { value: 'grout-line', label: 'Grout or tile line', desc: 'A horizontal grout line above the shower head' },
                { value: 'door-frame', label: 'Door frame or architrave top', desc: 'Top of a door frame or architrave' },
                { value: 'ceiling', label: 'Ceiling', desc: 'Floor to ceiling installation' },
                { value: 'standard', label: 'Standard height', desc: `${DEFAULT_GLASS_HEIGHT_MM}mm (typical for most enclosures)` },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  style={{ minHeight: '44px' }}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <span className="block font-medium">{option.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{option.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* Height measurement */}
        {stepId === 'height-measurement' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="height-to-ref">Height from tray to {heightReference.replace('-', ' ')} (mm)</Label>
              <Input
                id="height-to-ref"
                type="number"
                value={heightToReference}
                onChange={(e) => setHeightToReference(e.target.value)}
                disabled={notSure.has('height')}
                placeholder="e.g. 2000"
                className="text-base"
                style={{ minHeight: '44px' }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1500, 1850, 2000, 2100].map((h) => (
                <Button
                  key={h}
                  size="sm"
                  variant={heightToReference === String(h) ? 'default' : 'outline'}
                  onClick={() => setHeightToReference(String(h))}
                  disabled={notSure.has('height')}
                  style={{ minHeight: '44px' }}
                >
                  {h}
                </Button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
              <Checkbox
                checked={notSure.has('height')}
                onCheckedChange={() => toggleNotSure('height', String(DEFAULT_GLASS_HEIGHT_MM))}
              />
              <span className="flex-1 text-sm">
                I'm not sure — use {DEFAULT_GLASS_HEIGHT_MM}mm and confirm on survey
              </span>
            </label>
          </>
        )}

        {/* Shower head height */}
        {stepId === 'shower-head-height' && (
          <div className="space-y-2">
            <Label htmlFor="head-height">Shower head height from tray (mm)</Label>
            <Input
              id="head-height"
              type="number"
              value={showerHeadHeight}
              onChange={(e) => setShowerHeadHeight(e.target.value)}
              placeholder="e.g. 1850"
              className="text-base"
              style={{ minHeight: '44px' }}
            />
            <p className="text-xs text-muted-foreground">
              Measure to the fixed head outlet or the top of the rail for a slider. The glass must clear
              the head by at least {MIN_HEAD_CLEARANCE_MM}mm.
            </p>
          </div>
        )}

        {/* Laser wall gaps */}
        {stepId.startsWith('laser-') && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${stepId}-bottom`}>Gap at bottom (mm)</Label>
                <Input
                  id={`${stepId}-bottom`}
                  type="number"
                  value={getValue(`${stepId.replace('laser-', '')}-gap-bottom`)}
                  onChange={(e) => setValue(`${stepId.replace('laser-', '')}-gap-bottom`, e.target.value)}
                  placeholder="e.g. 48"
                  className="text-base"
                  style={{ minHeight: '44px' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${stepId}-middle`}>Gap at middle (mm) — optional</Label>
                <Input
                  id={`${stepId}-middle`}
                  type="number"
                  value={getValue(`${stepId.replace('laser-', '')}-gap-middle`)}
                  onChange={(e) => setValue(`${stepId.replace('laser-', '')}-gap-middle`, e.target.value)}
                  placeholder="e.g. 49"
                  className="text-base"
                  style={{ minHeight: '44px' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${stepId}-top`}>Gap at top (mm)</Label>
                <Input
                  id={`${stepId}-top`}
                  type="number"
                  value={getValue(`${stepId.replace('laser-', '')}-gap-top`)}
                  onChange={(e) => setValue(`${stepId.replace('laser-', '')}-gap-top`, e.target.value)}
                  placeholder="e.g. 50"
                  className="text-base"
                  style={{ minHeight: '44px' }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Measure the gap from the laser line to the wall. We calculate rake automatically (positive = leans out at top, negative = leans in).
            </p>
          </>
        )}

        {/* Floor type */}
        {stepId === 'floor-type' && (
          <RadioGroup value={floorType} onValueChange={(v) => setFloorType(v as typeof floorType)}>
            <div className="space-y-2">
              {[
                { value: 'tray', label: 'Shower tray' },
                { value: 'wet-room', label: 'Wet room (tiled floor)' },
                { value: 'over-bath', label: 'Over a bath' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  style={{ minHeight: '44px' }}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <span className="flex-1 font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* Plumb check */}
        {stepId === 'plumb-check' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Hold a spirit level vertically against each wall. If any walls lean, note it below. If you're not sure, skip this — we check on survey.
            </p>
          </div>
        )}

        {/* Obstacles */}
        {stepId === 'obstacles' && (
          <div className="space-y-2">
            {[
              { value: 'window', label: 'Window in the way' },
              { value: 'radiator', label: 'Radiator or towel rail' },
              { value: 'sloped-ceiling', label: 'Sloped ceiling' },
              { value: 'pipework', label: 'Exposed pipes' },
              { value: 'other', label: 'Something else' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3"
              >
                <Checkbox
                  checked={obstacles.includes(option.value)}
                  onCheckedChange={(v) => {
                    if (v) {
                      setObstacles([...obstacles, option.value]);
                    } else {
                      setObstacles(obstacles.filter((o) => o !== option.value));
                    }
                  }}
                />
                <span className="flex-1 text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-6">
        <Button variant="outline" onClick={handleBack} style={{ minHeight: '44px' }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button onClick={handleNext} disabled={!canProceed()} style={{ minHeight: '44px' }}>
          {isLast ? 'Complete' : 'Next'}
          {!isLast && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        All sizes are confirmed before any glass is cut — these measurements help us prepare an accurate
        quote.
      </p>
    </div>
  );
}
