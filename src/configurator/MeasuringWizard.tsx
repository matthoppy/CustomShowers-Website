/**
 * Guided measuring wizard — one measurement per screen with illustrations.
 * Data-driven from measurementPlans.ts.
 *
 * Written for someone who has never measured a shower: it says what to bring
 * before they start, catches the predictable slips (centimetres for
 * millimetres, a misread tape) while they are still standing in the bathroom,
 * remembers where they got to if the page closes, and shows everything back
 * before it goes into the designer.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CircleAlert,
  Pencil,
  Ruler,
  X,
  Zap,
} from 'lucide-react';
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
  type MeasurementStep,
} from './measurementPlans';
import type { MeasuringMethod } from './types';
import { WizardIllustrations } from './WizardIllustrations';
import { TapeReading } from './TapeReading';
import { groupOf, issuesForStep, type MeasurementIssue } from './measurementChecks';
import {
  clearProgress,
  hasMeaningfulProgress,
  loadPhotos,
  loadProgress,
  savePhotos,
  saveProgress,
  type WizardProgress,
} from './wizardProgress';

type FloorType = 'tray' | 'wet-room' | 'over-bath';

export interface LaserWallResult extends LaserGapMeasurements {
  wallName: string;
  description: string;
  warningMessage?: string;
}

export interface MeasuringResult {
  measuringMethod: MeasuringMethod;
  configurationId: string;
  planName: string;
  measurements: Record<string, string | number>;
  heightReference: HeightReference;
  heightToReferenceMm: number;
  showerHeadHeightMm: number;
  headClearanceWarning?: string;
  floorType?: FloorType;
  obstacles?: string[];
  plumbCheck?: string;
  /** Keyed by wall, e.g. "left-wall". */
  laserGaps?: Record<string, LaserWallResult>;
  notSure: string[];
  /** Warnings the customer saw and confirmed anyway, by step. The workshop should know. */
  confirmedWarnings: Record<string, string[]>;
  /** Photos of the tape against the wall, by step, as JPEG data URLs. */
  photos: Record<string, string>;
  /** Step titles in order, so the record reads the way the customer measured. */
  stepTitles: Record<string, string>;
}

interface MeasuringWizardProps {
  configurationId: string;
  onComplete: (result: MeasuringResult) => void;
  onBack: () => void;
}

const INTRO = -2;
const METHOD = -1;

const isWidthStep = (id: string) => /width|depth/.test(id);

/** The input keys a step writes to — what the checks and "not sure" work on. */
function inputKeys(stepId: string): string[] {
  if (stepId.startsWith('laser-')) {
    const wall = stepId.replace('laser-', '');
    return [`${wall}-gap-bottom`, `${wall}-gap-middle`, `${wall}-gap-top`];
  }
  if (stepId === 'height-measurement' || stepId === 'shower-head-height' || isWidthStep(stepId)) {
    return [stepId];
  }
  return [];
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return v !== undefined && v.trim() !== '' && Number.isFinite(n) ? n : NaN;
};

const HEIGHT_REFERENCES: { value: HeightReference; label: string; desc: string }[] = [
  { value: 'grout-line', label: 'Grout or tile line', desc: 'A horizontal grout line above the shower head' },
  { value: 'door-frame', label: 'Door frame or architrave top', desc: 'Line up with the top of the bathroom door frame' },
  { value: 'ceiling', label: 'Ceiling', desc: 'Glass all the way up to the ceiling' },
  { value: 'standard', label: 'Standard height', desc: `${DEFAULT_GLASS_HEIGHT_MM}mm — typical for most enclosures` },
];

const FLOOR_TYPES: { value: FloorType; label: string }[] = [
  { value: 'tray', label: 'Shower tray' },
  { value: 'wet-room', label: 'Wet room (tiled floor)' },
  { value: 'over-bath', label: 'Over a bath' },
];

const OBSTACLES = [
  { value: 'window', label: 'Window in the way' },
  { value: 'radiator', label: 'Radiator or towel rail' },
  { value: 'sloped-ceiling', label: 'Sloped ceiling' },
  { value: 'pipework', label: 'Exposed pipes' },
  { value: 'other', label: 'Something else' },
];

const PLUMB_OPTIONS = [
  { value: 'straight', label: 'The walls look straight', desc: 'The bubble sits in the middle on every wall' },
  { value: 'leans', label: 'A wall leans', desc: 'The bubble moves off-centre on at least one wall' },
  { value: 'not-checked', label: 'I didn’t check', desc: 'That’s fine — we’ll talk it through before anything is made' },
];

/** Shrink a phone photo to something an email can carry. */
async function compressPhoto(file: File, maxSide = 1200, quality = 0.72): Promise<string | null> {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image load failed'));
      img.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    URL.revokeObjectURL(url);
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return null;
  }
}

export function MeasuringWizard({ configurationId, onComplete, onBack }: MeasuringWizardProps) {
  const plan = getMeasurementPlan(configurationId);

  // Offer to pick up a measure the customer started earlier, in this browser.
  const [resume, setResume] = useState<WizardProgress | null>(() => {
    const saved = loadProgress(configurationId);
    return hasMeaningfulProgress(saved) ? saved : null;
  });

  const [measuringMethod, setMeasuringMethod] = useState<MeasuringMethod>('tape');
  const [stepIndex, setStepIndex] = useState(INTRO);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notSure, setNotSure] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [floorType, setFloorType] = useState<FloorType>('tray');
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [heightReference, setHeightReference] = useState<HeightReference>('grout-line');
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  /** Set when the customer jumps back from the summary to fix one thing. */
  const [returnToReview, setReturnToReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = useMemo(() => getStepsForMethod(plan, measuringMethod), [plan, measuringMethod]);
  const reviewIndex = steps.length;
  const currentStep: MeasurementStep | null = stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : null;

  // Save as they go. Skipped while the resume prompt is up so an untouched
  // fresh start can't overwrite the measure they might still want back.
  useEffect(() => {
    if (resume) return;
    if (stepIndex === INTRO && Object.keys(measurements).length === 0) return;
    saveProgress(configurationId, {
      stepIndex,
      measuringMethod,
      measurements,
      notSure: Array.from(notSure),
      confirmed: Array.from(confirmed),
      floorType,
      obstacles,
      heightReference,
      heightToReference: measurements['height-measurement'] ?? '',
      showerHeadHeight: measurements['shower-head-height'] ?? '',
    });
  }, [resume, configurationId, stepIndex, measuringMethod, measurements, notSure, confirmed, floorType, obstacles, heightReference]);

  useEffect(() => {
    if (!resume) savePhotos(configurationId, photos);
  }, [resume, configurationId, photos]);

  const continueSaved = () => {
    if (!resume) return;
    setMeasuringMethod(resume.measuringMethod);
    setMeasurements({
      ...resume.measurements,
      // Older saves kept these two apart from the rest.
      ...(resume.heightToReference ? { 'height-measurement': resume.heightToReference } : {}),
      ...(resume.showerHeadHeight ? { 'shower-head-height': resume.showerHeadHeight } : {}),
    });
    setNotSure(new Set(resume.notSure));
    setConfirmed(new Set(resume.confirmed));
    setFloorType(resume.floorType);
    setObstacles(resume.obstacles);
    setHeightReference(resume.heightReference);
    setPhotos(loadPhotos(configurationId));
    setStepIndex(resume.stepIndex);
    setResume(null);
  };

  const startAgain = () => {
    clearProgress(configurationId);
    setResume(null);
  };

  const value = (key: string) => measurements[key] ?? '';

  const setValue = (key: string, v: string) => {
    setMeasurements((m) => ({ ...m, [key]: v }));
    // A new number needs checking again.
    if (currentStep) {
      setConfirmed((c) => {
        const next = new Set(c);
        next.delete(currentStep.id);
        return next;
      });
    }
  };

  const toggleNotSure = (key: string, typical: string) => {
    const next = new Set(notSure);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      setMeasurements((m) => ({ ...m, [key]: typical }));
    }
    setNotSure(next);
  };

  /** Everything worth saying about a step's numbers, keyed so we know which input. */
  const issuesFor = (step: MeasurementStep): (MeasurementIssue & { key: string })[] => {
    const found = inputKeys(step.id)
      .filter((k) => !notSure.has(k))
      .flatMap((k) => issuesForStep(k, measurements).map((i) => ({ ...i, key: k })));

    if (step.id === 'shower-head-height') {
      const head = num(value('shower-head-height'));
      const glass = notSure.has('height-measurement') ? DEFAULT_GLASS_HEIGHT_MM : num(value('height-measurement'));
      if (head > 0 && glass > 0) {
        const clearance = glass - head;
        if (clearance < 0) {
          found.push({
            key: step.id,
            severity: 'confirm',
            message: `Your glass would finish at ${glass}mm, below the shower head at ${head}mm. Water will spray over the top. Go back and choose a higher reference, or check this measurement.`,
          });
        } else if (clearance < MIN_HEAD_CLEARANCE_MM) {
          found.push({
            key: step.id,
            severity: 'confirm',
            message: `The glass would only be ${clearance}mm above the shower head. We recommend at least ${MIN_HEAD_CLEARANCE_MM}mm so water doesn’t spray over.`,
          });
        }
      }
    }
    return found;
  };

  const stepIssues = currentStep ? issuesFor(currentStep) : [];
  const blocked = stepIssues.some((i) => i.severity === 'block');
  const needsConfirm = !blocked && stepIssues.some((i) => i.severity === 'confirm');

  const filledIn = (step: MeasurementStep): boolean => {
    const id = step.id;
    if (isWidthStep(id) || id === 'height-measurement') {
      return notSure.has(id) || num(value(id)) > 0;
    }
    if (id === 'shower-head-height') return num(value(id)) > 0;
    if (id.startsWith('laser-')) {
      const [bottom, , top] = inputKeys(id);
      return num(value(bottom)) >= 0 && num(value(top)) >= 0;
    }
    return true;
  };

  const canProceed =
    stepIndex < 0 ||
    stepIndex === reviewIndex ||
    (!!currentStep && filledIn(currentStep) && !blocked && (!needsConfirm || confirmed.has(currentStep.id)));

  const scrollTop = () => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goTo = (index: number) => {
    setStepIndex(index);
    setPhotoError(null);
    scrollTop();
  };

  const handleNext = () => {
    if (stepIndex === INTRO) return goTo(METHOD);
    if (stepIndex === METHOD) return goTo(0);
    if (stepIndex === reviewIndex) return complete();
    if (returnToReview) {
      setReturnToReview(false);
      return goTo(reviewIndex);
    }
    goTo(stepIndex + 1);
  };

  const handleBack = () => {
    if (stepIndex === INTRO) return onBack();
    if (returnToReview) {
      setReturnToReview(false);
      return goTo(reviewIndex);
    }
    goTo(stepIndex - 1);
  };

  const editStep = (index: number) => {
    setReturnToReview(true);
    goTo(index);
  };

  const glassHeightMm = notSure.has('height-measurement')
    ? DEFAULT_GLASS_HEIGHT_MM
    : num(value('height-measurement')) || DEFAULT_GLASS_HEIGHT_MM;

  const buildResult = (): MeasuringResult => {
    const showerHeadMm = num(value('shower-head-height')) || 0;
    let headClearanceWarning: string | undefined;
    if (showerHeadMm > 0) {
      const clearance = glassHeightMm - showerHeadMm;
      if (clearance < 0) {
        headClearanceWarning = `Glass top (${glassHeightMm}mm) is BELOW the shower head (${showerHeadMm}mm)`;
      } else if (clearance < MIN_HEAD_CLEARANCE_MM) {
        headClearanceWarning = `Glass top is only ${clearance}mm above the shower head (minimum ${MIN_HEAD_CLEARANCE_MM}mm recommended)`;
      }
    }

    const laserGaps: Record<string, LaserWallResult> = {};
    if (measuringMethod === 'laser') {
      for (const step of steps.filter((s) => s.id.startsWith('laser-'))) {
        const wall = step.id.replace('laser-', '');
        const [bottomKey, middleKey, topKey] = inputKeys(step.id);
        const top = num(value(topKey));
        const bottom = num(value(bottomKey));
        const middle = num(value(middleKey));
        if (Number.isNaN(top) || Number.isNaN(bottom)) continue;
        const wallName = step.title.split(':')[0].trim();
        const gaps: LaserGapMeasurements = {
          gapTopMm: top,
          gapBottomMm: bottom,
          gapMiddleMm: Number.isNaN(middle) ? undefined : middle,
          heightMm: glassHeightMm,
        };
        const rake = calculateRake(gaps, wallName);
        laserGaps[wall] = { ...gaps, wallName, description: rake.description, warningMessage: rake.warningMessage };
      }
    }

    const confirmedWarnings: Record<string, string[]> = {};
    for (const step of steps) {
      if (!confirmed.has(step.id)) continue;
      const messages = issuesFor(step).map((i) => i.message);
      if (messages.length) confirmedWarnings[step.id] = messages;
    }

    const has = (id: string) => steps.some((s) => s.id === id);

    return {
      measuringMethod,
      configurationId,
      planName: plan.name,
      measurements: Object.fromEntries(
        Object.entries(measurements).map(([k, v]) => {
          const n = num(v);
          return [k, Number.isNaN(n) ? v : n];
        })
      ),
      heightReference,
      heightToReferenceMm: glassHeightMm,
      showerHeadHeightMm: showerHeadMm,
      headClearanceWarning,
      floorType: has('floor-type') ? floorType : undefined,
      obstacles: has('obstacles') ? obstacles : undefined,
      plumbCheck: has('plumb-check') ? measurements['plumb-check'] : undefined,
      laserGaps: Object.keys(laserGaps).length > 0 ? laserGaps : undefined,
      notSure: Array.from(notSure),
      confirmedWarnings,
      photos: Object.fromEntries(Object.entries(photos).filter(([id]) => has(id))),
      stepTitles: Object.fromEntries(steps.map((s) => [s.id, s.title])),
    };
  };

  const complete = () => {
    const result = buildResult();
    clearProgress(configurationId);
    onComplete(result);
  };

  const handlePhoto = async (file: File | undefined) => {
    if (!file || !currentStep) return;
    setPhotoError(null);
    const data = await compressPhoto(file);
    if (data) {
      setPhotos((p) => ({ ...p, [currentStep.id]: data }));
    } else {
      setPhotoError('We couldn’t read that photo. Try taking it again.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------------------------------------------------------------------
  // Screens
  // ---------------------------------------------------------------------------

  if (resume) {
    const done = Object.values(resume.measurements).filter((v) => v.trim() !== '').length;
    const savedOn = new Date(resume.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return (
      <Shell>
        <div className="rounded-lg border p-6">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-2 text-muted-foreground">
            You started measuring your {plan.name.toLowerCase()} on {savedOn}
            {done > 0 ? ` and filled in ${done} measurement${done === 1 ? '' : 's'}` : ''}. Pick up where you left
            off?
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={continueSaved} className="min-h-11 flex-1">
              Continue where I left off
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={startAgain} className="min-h-11 flex-1">
              Start again
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (stepIndex === INTRO) {
    return (
      <Shell>
        <div>
          <Button variant="ghost" onClick={onBack} className="-ml-3 mb-2 min-h-11">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Before you start</h2>
          <p className="mt-2 text-muted-foreground">
            Measuring takes about 10 minutes. We’ll take you through it one measurement at a time, and your
            progress is saved on this device as you go.
          </p>
        </div>

        <section className="rounded-lg border p-4 sm:p-6">
          <h3 className="font-semibold">You’ll need</h3>
          <ul className="mt-3 space-y-3">
            {[
              { title: 'A tape measure', desc: 'A metal one, ideally 5m. A laser measure works too.' },
              { title: 'Your phone', desc: 'To enter numbers as you go, and take a photo of the tape if you want us to double-check.' },
              { title: 'A spirit level', desc: 'Optional — for checking whether the walls lean.' },
              { title: 'Someone to help', desc: 'Optional, but it’s much easier to hold a tape wall to wall with two people.' },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block font-medium">{item.title}</span>
                  <span className="block text-sm text-muted-foreground">{item.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border p-4 sm:p-6">
          <h3 className="mb-3 font-semibold">Reading the tape in millimetres</h3>
          <TapeReading />
        </section>

        <section className="rounded-lg border p-4 sm:p-6">
          <h3 className="font-semibold">Three things that make a good measure</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            <li>Measure to the finished surface — tiles, not the wall behind them.</li>
            <li>Keep the tape straight and level, not sagging or at an angle.</li>
            <li>Write down exactly what you read. Don’t round it — we’ll allow for the gaps.</li>
          </ol>
        </section>

        <Footer>
          <span />
          <Button onClick={handleNext} className="min-h-11">
            I’m ready
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Footer>
      </Shell>
    );
  }

  if (stepIndex === METHOD) {
    return (
      <Shell>
        <div>
          <h2 className="text-2xl font-bold">How will you measure?</h2>
          <p className="mt-2 text-muted-foreground">
            Most people use a tape measure. If you have a laser level, we can also check whether your walls lean.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              method: 'tape' as const,
              icon: Ruler,
              title: 'Tape measure',
              desc: 'Measure the openings, and optionally check the walls with a spirit level.',
            },
            {
              method: 'laser' as const,
              icon: Zap,
              title: 'Laser level',
              desc: 'Project a vertical line beside each wall, then measure the gap to the wall at the bottom, middle and top.',
            },
          ].map(({ method, icon: Icon, title, desc }) => (
            <button
              key={method}
              type="button"
              onClick={() => setMeasuringMethod(method)}
              aria-pressed={measuringMethod === method}
              className={`flex min-h-11 w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:border-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 ${
                measuringMethod === method ? 'border-foreground bg-muted' : ''
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <Footer>
          <Button variant="outline" onClick={handleBack} className="min-h-11">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} className="min-h-11">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Footer>
      </Shell>
    );
  }

  if (stepIndex === reviewIndex) {
    return (
      <Shell>
        <ReviewScreen
          steps={steps}
          measurements={measurements}
          notSure={notSure}
          photos={photos}
          heightReference={heightReference}
          floorType={floorType}
          obstacles={obstacles}
          glassHeightMm={glassHeightMm}
          issuesFor={issuesFor}
          onEdit={editStep}
        />
        <Footer>
          <Button variant="outline" onClick={() => goTo(steps.length - 1)} className="min-h-11">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} className="min-h-11">
            These are right
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Footer>
      </Shell>
    );
  }

  if (!currentStep) return null;

  const stepId = currentStep.id;
  const showPhoto = inputKeys(stepId).length > 0;

  return (
    <Shell>
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Measurement {stepIndex + 1} of {steps.length}
          </span>
          <div className="flex flex-1 justify-end gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 max-w-8 flex-1 rounded-full transition-colors ${
                  i === stepIndex ? 'bg-primary' : i < stepIndex ? 'bg-primary/40' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
        <h2 className="text-2xl font-bold">{currentStep.title}</h2>
        <p className="mt-1 text-muted-foreground">{currentStep.description}</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted p-4 sm:p-6">
        <WizardIllustrations illustrationId={currentStep.illustrationId} />
      </div>

      <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
        <strong className="block font-semibold">Tip</strong>
        <span className="mt-1 block">{currentStep.tip}</span>
      </div>

      <div className="space-y-4">
        {isWidthStep(stepId) && (
          <>
            <MmInput
              id={stepId}
              label="Measurement"
              value={value(stepId)}
              onChange={(v) => setValue(stepId, v)}
              disabled={notSure.has(stepId)}
              placeholder="e.g. 900"
              invalid={stepIssues.some((i) => i.key === stepId)}
            />
            {!currentStep.required && (
              <NotSureBox
                checked={notSure.has(stepId)}
                onChange={() => toggleNotSure(stepId, '900')}
                label="I can’t measure this — use a typical size and check it with me"
              />
            )}
          </>
        )}

        {stepId === 'height-reference' && (
          <RadioGroup value={heightReference} onValueChange={(v) => setHeightReference(v as HeightReference)}>
            <div className="space-y-2">
              {HEIGHT_REFERENCES.map((option) => (
                <OptionCard key={option.value} id={`ref-${option.value}`} value={option.value} label={option.label} desc={option.desc} />
              ))}
            </div>
          </RadioGroup>
        )}

        {stepId === 'height-measurement' && (
          <>
            <MmInput
              id={stepId}
              label={`Height from tray to ${HEIGHT_REFERENCES.find((r) => r.value === heightReference)?.label.toLowerCase() ?? 'reference'}`}
              value={value(stepId)}
              onChange={(v) => setValue(stepId, v)}
              disabled={notSure.has(stepId)}
              placeholder="e.g. 2000"
              invalid={stepIssues.some((i) => i.key === stepId)}
            />
            <div className="flex flex-wrap gap-2">
              {[1850, 1950, 2000, 2100].map((h) => (
                <Button
                  key={h}
                  size="sm"
                  variant={value(stepId) === String(h) ? 'default' : 'outline'}
                  onClick={() => setValue(stepId, String(h))}
                  disabled={notSure.has(stepId)}
                  className="min-h-11"
                >
                  {h}mm
                </Button>
              ))}
            </div>
            <NotSureBox
              checked={notSure.has(stepId)}
              onChange={() => toggleNotSure(stepId, String(DEFAULT_GLASS_HEIGHT_MM))}
              label={`I’m not sure — use ${DEFAULT_GLASS_HEIGHT_MM}mm and check it with me`}
            />
          </>
        )}

        {stepId === 'shower-head-height' && (
          <MmInput
            id={stepId}
            label="Shower head height from tray"
            value={value(stepId)}
            onChange={(v) => setValue(stepId, v)}
            placeholder="e.g. 1850"
            hint={`Measure to the fixed head outlet, or the top of the rail for a slider. The glass must finish at least ${MIN_HEAD_CLEARANCE_MM}mm above it.`}
            invalid={stepIssues.some((i) => i.key === stepId)}
          />
        )}

        {stepId.startsWith('laser-') && (
          <>
            {inputKeys(stepId).map((key, i) => (
              <MmInput
                key={key}
                id={key}
                label={['Gap at the bottom', 'Gap at the middle (optional)', 'Gap at the top'][i]}
                value={value(key)}
                onChange={(v) => setValue(key, v)}
                placeholder={['e.g. 48', 'e.g. 49', 'e.g. 50'][i]}
                invalid={stepIssues.some((iss) => iss.key === key)}
              />
            ))}
            <p className="text-xs text-muted-foreground">
              Measure from the laser line to the wall. We work out how much the wall leans from the difference.
            </p>
          </>
        )}

        {stepId === 'plumb-check' && (
          <RadioGroup value={value('plumb-check')} onValueChange={(v) => setValue('plumb-check', v)}>
            <p className="text-sm text-muted-foreground">
              Hold a spirit level upright against each wall where the glass will fix.
            </p>
            <div className="space-y-2">
              {PLUMB_OPTIONS.map((o) => (
                <OptionCard key={o.value} id={`plumb-${o.value}`} value={o.value} label={o.label} desc={o.desc} />
              ))}
            </div>
          </RadioGroup>
        )}

        {stepId === 'floor-type' && (
          <RadioGroup value={floorType} onValueChange={(v) => setFloorType(v as FloorType)}>
            <div className="space-y-2">
              {FLOOR_TYPES.map((o) => (
                <OptionCard key={o.value} id={`floor-${o.value}`} value={o.value} label={o.label} />
              ))}
            </div>
          </RadioGroup>
        )}

        {stepId === 'obstacles' && (
          <div className="space-y-2">
            {OBSTACLES.map((option) => (
              <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
                <Checkbox
                  checked={obstacles.includes(option.value)}
                  onCheckedChange={(v) =>
                    setObstacles((o) => (v ? [...o, option.value] : o.filter((x) => x !== option.value)))
                  }
                />
                <span className="flex-1 text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Problems with what was typed, said while they're still at the wall. */}
        {stepIssues.map((issue, i) => (
          <div
            key={`${issue.key}-${i}`}
            role="alert"
            className={`rounded-lg border p-4 text-sm ${
              issue.severity === 'block'
                ? 'border-destructive/50 bg-destructive/10 text-destructive'
                : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
            }`}
          >
            <div className="flex gap-2">
              {issue.severity === 'block' ? (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <div className="flex-1">
                <p>{issue.message}</p>
                {issue.suggestionMm !== undefined && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 min-h-11 bg-background"
                    onClick={() => setValue(issue.key, String(issue.suggestionMm))}
                  >
                    Use {issue.suggestionMm}mm
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {needsConfirm && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
            <Checkbox
              checked={confirmed.has(stepId)}
              onCheckedChange={(v) =>
                setConfirmed((c) => {
                  const next = new Set(c);
                  if (v) next.add(stepId);
                  else next.delete(stepId);
                  return next;
                })
              }
            />
            <span className="flex-1 text-sm font-medium">I’ve checked again and this is right</span>
          </label>
        )}

        {showPhoto && (
          <div className="rounded-lg border border-dashed p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
            {photos[stepId] ? (
              <div className="flex items-center gap-3">
                <img src={photos[stepId]} alt="Your photo of the tape" className="h-16 w-16 rounded object-cover" />
                <div className="flex-1 text-sm">
                  <span className="block font-medium">Photo added</span>
                  <span className="block text-muted-foreground">We’ll check it against your number.</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove photo"
                  className="min-h-11 min-w-11"
                  onClick={() =>
                    setPhotos((p) => {
                      const next = { ...p };
                      delete next[stepId];
                      return next;
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="min-h-11 w-full" onClick={() => fileInputRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" />
                Add a photo of the tape (optional)
              </Button>
            )}
            {photoError && <p className="mt-2 text-sm text-destructive">{photoError}</p>}
          </div>
        )}
      </div>

      <Footer>
        <Button variant="outline" onClick={handleBack} className="min-h-11">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} className="min-h-11">
          {returnToReview ? 'Back to summary' : stepIndex === steps.length - 1 ? 'Check my measurements' : 'Next'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Footer>

      <p className="text-center text-xs text-muted-foreground">
        Your progress is saved on this device. We go through your sizes with you before anything is made.
      </p>
    </Shell>
  );
}

// -----------------------------------------------------------------------------
// Pieces
// -----------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6">{children}</div>;
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-t pt-6">{children}</div>;
}

function MmInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  invalid?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className={`min-h-12 pr-12 text-lg ${invalid ? 'border-amber-500 focus-visible:ring-amber-500' : ''}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
          mm
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NotSureBox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="flex-1 text-sm">{label}</span>
    </label>
  );
}

function OptionCard({ id, value, label, desc }: { id: string; value: string; label: string; desc?: string }) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
    >
      <RadioGroupItem value={value} id={id} className="mt-0.5" />
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {desc && <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>}
      </span>
    </label>
  );
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------

interface ReviewProps {
  steps: MeasurementStep[];
  measurements: Record<string, string>;
  notSure: Set<string>;
  photos: Record<string, string>;
  heightReference: HeightReference;
  floorType: FloorType;
  obstacles: string[];
  glassHeightMm: number;
  issuesFor: (step: MeasurementStep) => MeasurementIssue[];
  onEdit: (index: number) => void;
}

function ReviewScreen({
  steps,
  measurements,
  notSure,
  photos,
  heightReference,
  floorType,
  obstacles,
  glassHeightMm,
  issuesFor,
  onEdit,
}: ReviewProps) {
  const display = (step: MeasurementStep): string => {
    const id = step.id;
    const v = (k: string) => measurements[k]?.trim();
    if (inputKeys(id).length === 1 && (isWidthStep(id) || id === 'height-measurement' || id === 'shower-head-height')) {
      if (notSure.has(id)) return 'Not sure — we’ll check with you';
      return v(id) ? `${v(id)}mm` : '—';
    }
    if (id.startsWith('laser-')) {
      const [b, m, t] = inputKeys(id).map(v);
      return [b && `bottom ${b}mm`, m && `middle ${m}mm`, t && `top ${t}mm`].filter(Boolean).join(', ') || '—';
    }
    if (id === 'height-reference') return HEIGHT_REFERENCES.find((r) => r.value === heightReference)?.label ?? '—';
    if (id === 'floor-type') return FLOOR_TYPES.find((f) => f.value === floorType)?.label ?? '—';
    if (id === 'obstacles') {
      return obstacles.length ? obstacles.map((o) => OBSTACLES.find((x) => x.value === o)?.label ?? o).join(', ') : 'None';
    }
    if (id === 'plumb-check') return PLUMB_OPTIONS.find((p) => p.value === v('plumb-check'))?.label ?? 'Skipped';
    return '—';
  };

  // The size we'll actually work to for each bottom/middle/top set.
  const smallest = new Map<string, { min: number; title: string }>();
  for (const step of steps) {
    const group = groupOf(step.id);
    if (!group || notSure.has(step.id)) continue;
    const n = num(measurements[step.id]);
    if (!(n > 0)) continue;
    const label = step.title.replace(/\s+at the (bottom|middle|top)$/i, '');
    const current = smallest.get(group);
    if (!current || n < current.min) smallest.set(group, { min: n, title: label });
  }

  const shown = new Set<string>();
  const front = smallest.values().next().value as { min: number; title: string } | undefined;
  const head = num(measurements['shower-head-height']);

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Check your measurements</h2>
        <p className="mt-2 text-muted-foreground">
          Have a last look before we draw your shower. Tap any measurement to change it.
        </p>
      </div>

      {front && (
        <div className="rounded-lg border bg-muted p-4">
          <SummaryDrawing widthMm={front.min} widthLabel={front.title} heightMm={glassHeightMm} headMm={head > 0 ? head : undefined} />
        </div>
      )}

      {smallest.size > 0 && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-semibold">We’ll make the glass to fit the smallest reading</p>
          <ul className="mt-2 space-y-1">
            {Array.from(smallest.values()).map((s) => (
              <li key={s.title} className="flex justify-between gap-4">
                <span>{s.title}</span>
                <span className="font-mono font-medium">{s.min}mm</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="divide-y rounded-lg border">
        {steps.map((step, i) => {
          // A bottom/middle/top difference is reported by each of the three;
          // say it once, against the first reading it applies to.
          const issues = issuesFor(step).filter((issue) => {
            if (shown.has(issue.message)) return false;
            shown.add(issue.message);
            return true;
          });
          const unsure = inputKeys(step.id).some((k) => notSure.has(k));
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="flex min-h-11 w-full items-start gap-3 p-4 text-left hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground"
              >
                <span className="flex-1">
                  <span className="block text-sm text-muted-foreground">{step.title}</span>
                  <span className="block font-medium">{display(step)}</span>
                  {issues.map((issue, j) => (
                    <span key={j} className="mt-1 flex gap-1.5 text-sm text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {issue.message}
                    </span>
                  ))}
                  {unsure && !issues.length && (
                    <span className="mt-1 block text-sm text-muted-foreground">We’ll confirm this one with you.</span>
                  )}
                </span>
                {photos[step.id] && (
                  <img src={photos[step.id]} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                )}
                <Pencil className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Change" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** A front view with the numbers on it, so a slip is obvious at a glance. */
function SummaryDrawing({
  widthMm,
  widthLabel,
  heightMm,
  headMm,
}: {
  widthMm: number;
  widthLabel: string;
  heightMm: number;
  headMm?: number;
}) {
  const W = 300;
  const H = 230;
  const left = 60;
  const right = 250;
  const floor = 200;
  const top = 30;
  const scale = (floor - top) / Math.max(heightMm, headMm ?? 0, 1);
  const glassTop = floor - heightMm * scale;
  const headY = headMm ? floor - headMm * scale : undefined;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto h-auto w-full max-w-sm"
      role="img"
      aria-label={`${widthLabel} ${widthMm}mm, glass height ${heightMm}mm${headMm ? `, shower head ${headMm}mm` : ''}`}
    >
      {/* Walls and floor */}
      <line x1={left} y1={10} x2={left} y2={floor} stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
      <line x1={right} y1={10} x2={right} y2={floor} stroke="currentColor" strokeWidth="4" className="text-muted-foreground" />
      <line x1={left - 20} y1={floor} x2={right + 20} y2={floor} stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
      {/* Glass */}
      <rect x={left + 3} y={glassTop} width={right - left - 6} height={floor - glassTop} className="fill-sky-200/50 stroke-sky-500" strokeWidth="1.5" />
      {/* Shower head */}
      {headY !== undefined && (
        <g className="text-muted-foreground">
          <line x1={right - 30} y1={headY} x2={right - 4} y2={headY} stroke="currentColor" strokeWidth="3" />
          <circle cx={right - 30} cy={headY} r="5" fill="currentColor" />
          <text x={right - 40} y={headY + 4} textAnchor="end" fontSize="11" fill="currentColor">
            head {headMm}
          </text>
        </g>
      )}
      {/* Width */}
      <g className="text-primary">
        <line x1={left + 3} y1={floor + 15} x2={right - 3} y2={floor + 15} stroke="currentColor" strokeWidth="1.5" />
        <path d={`M ${left + 3} ${floor + 10} v 10 M ${right - 3} ${floor + 10} v 10`} stroke="currentColor" strokeWidth="1.5" />
        <text x={(left + right) / 2} y={floor + 28} textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">
          {widthMm}mm
        </text>
      </g>
      {/* Height */}
      <g className="text-primary">
        <line x1={left - 25} y1={glassTop} x2={left - 25} y2={floor} stroke="currentColor" strokeWidth="1.5" />
        <path d={`M ${left - 30} ${glassTop} h 10 M ${left - 30} ${floor} h 10`} stroke="currentColor" strokeWidth="1.5" />
        <text
          x={left - 32}
          y={(glassTop + floor) / 2}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="currentColor"
          transform={`rotate(-90 ${left - 32} ${(glassTop + floor) / 2})`}
        >
          {heightMm}mm
        </text>
      </g>
    </svg>
  );
}
