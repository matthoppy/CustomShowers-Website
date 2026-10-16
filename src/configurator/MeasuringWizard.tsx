/**
 * Guided measuring wizard — one measurement per screen with illustrations.
 */

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Ruler, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { ConfiguratorState, MeasuringMethod } from './types';

interface LaserGaps {
  gapTopMm: number;
  gapMiddleMm?: number;
  gapBottomMm: number;
  heightMm: number;
}

interface MeasuringResult {
  measuringMethod: MeasuringMethod;
  showerType: 'alcove' | 'corner' | 'walk-in' | 'over-bath';
  openingWidthMm: number;
  depthMm?: number;
  heightMm: number;
  floorType: 'tray' | 'wet-room' | 'over-bath';
  outOfPlumb: boolean;
  obstacles: string[];
  notSure: string[];
  laserGaps?: {
    leftWall?: LaserGaps;
    rightWall?: LaserGaps;
    backWall?: LaserGaps;
  };
}

interface MeasuringWizardProps {
  onComplete: (result: MeasuringResult) => void;
  onBack: () => void;
}

type StepId =
  | 'measuring-method'
  | 'shower-type'
  | 'opening-width'
  | 'depth'
  | 'height'
  | 'floor-type'
  | 'plumb-check'
  | 'laser-left-wall'
  | 'laser-right-wall'
  | 'laser-back-wall'
  | 'obstacles';

interface WizardStep {
  id: StepId;
  title: string;
  description: string;
  illustration: (method?: MeasuringMethod) => JSX.Element;
  tip: (method?: MeasuringMethod) => string;
  canSkip?: boolean;
}

const STEPS: WizardStep[] = [
  {
    id: 'measuring-method',
    title: 'How will you measure?',
    description: 'Choose your measuring tool',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <g transform="translate(50, 40)">
          <rect x="0" y="0" width="40" height="8" rx="2" fill="currentColor" className="text-primary/20" />
          <rect x="0" y="0" width="10" height="8" fill="currentColor" className="text-primary" />
          <rect x="12" y="0" width="10" height="8" fill="currentColor" className="text-primary" />
          <line x1="5" y1="8" x2="5" y2="15" stroke="currentColor" strokeWidth="1" className="text-primary" />
          <line x1="17" y1="8" x2="17" y2="15" stroke="currentColor" strokeWidth="1" className="text-primary" />
          <text x="20" y="30" textAnchor="middle" className="fill-muted-foreground text-xs">Tape</text>
        </g>
        <g transform="translate(110, 40)">
          <rect x="0" y="0" width="35" height="10" rx="2" fill="currentColor" className="text-primary" />
          <rect x="2" y="2" width="8" height="6" rx="1" fill="currentColor" className="text-background" />
          <line x1="35" y1="5" x2="50" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" className="text-destructive" />
          <circle cx="50" cy="5" r="2" fill="currentColor" className="text-destructive" />
          <text x="17" y="30" textAnchor="middle" className="fill-muted-foreground text-xs">Laser</text>
        </g>
      </svg>
    ),
    tip: () => 'Both work — laser measures are faster but need a spirit level to check if walls are plumb.',
  },
  {
    id: 'shower-type',
    title: 'What type of space is this?',
    description: 'This helps us understand the layout',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="20" y="30" width="160" height="90" stroke="currentColor" strokeWidth="2" fill="none" className="text-muted-foreground" />
        <line x1="20" y1="30" x2="20" y2="120" stroke="currentColor" strokeWidth="3" className="text-primary" />
        <line x1="180" y1="30" x2="180" y2="120" stroke="currentColor" strokeWidth="3" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Alcove (between two walls)</text>
      </svg>
    ),
    tip: () => 'Choose the option that best matches your bathroom layout.',
  },
  {
    id: 'opening-width',
    title: 'How wide is the opening?',
    description: 'Measure at the top, middle and bottom',
    illustration: (method) => {
      if (method === 'laser') {
        return (
          <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
            <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
            <line x1="160" y1="30" x2="160" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
            <rect x="35" y="38" width="15" height="8" rx="2" fill="currentColor" className="text-primary" />
            <line x1="50" y1="42" x2="160" y2="42" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" className="text-destructive" />
            <circle cx="160" cy="42" r="2" fill="currentColor" className="text-destructive" />
            <rect x="35" y="73" width="15" height="8" rx="2" fill="currentColor" className="text-primary" />
            <line x1="50" y1="77" x2="160" y2="77" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" className="text-destructive" />
            <circle cx="160" cy="77" r="2" fill="currentColor" className="text-destructive" />
            <rect x="35" y="108" width="15" height="8" rx="2" fill="currentColor" className="text-primary" />
            <line x1="50" y1="112" x2="160" y2="112" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" className="text-destructive" />
            <circle cx="160" cy="112" r="2" fill="currentColor" className="text-destructive" />
            <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Laser at top, middle & bottom</text>
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
          <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
          <line x1="160" y1="30" x2="160" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
          <line x1="40" y1="40" x2="160" y2="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
          <line x1="40" y1="75" x2="160" y2="75" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
          <line x1="40" y1="110" x2="160" y2="110" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
          <path d="M 40 40 L 35 45 M 40 40 L 45 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
          <path d="M 160 40 L 155 45 M 160 40 L 165 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
          <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Measure top, middle & bottom</text>
        </svg>
      );
    },
    tip: (method) =>
      method === 'laser'
        ? 'Hold the laser flat against the wall or tile and aim square at the opposite wall. Measure at three heights — we will use the smallest.'
        : 'Walls are rarely perfectly straight. Measure at three heights and we will use the smallest — glass will not fit if we use the widest.',
  },
  {
    id: 'depth',
    title: 'How deep is the space?',
    description: 'Wall to wall (for corner enclosures)',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="30" y1="30" x2="170" y2="30" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="30" y1="30" x2="30" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="30" y1="120" x2="170" y2="120" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
        <path d="M 30 120 L 35 115 M 30 120 L 35 125" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 170 120 L 165 115 M 170 120 L 165 125" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="145" textAnchor="middle" className="fill-muted-foreground text-xs">Back wall to front edge</text>
      </svg>
    ),
    tip: 'Only needed for corner enclosures. Skip this if you have an alcove or walk-in.',
    canSkip: true,
  },
  {
    id: 'height',
    title: 'How tall should the glass be?',
    description: 'From the tray or floor upwards',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="70" y="110" width="60" height="3" fill="currentColor" className="text-muted-foreground" />
        <line x1="90" y1="110" x2="90" y2="30" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="110" y1="110" x2="110" y2="30" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="85" y1="110" x2="85" y2="30" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
        <path d="M 85 30 L 80 35 M 85 30 L 90 35" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 85 110 L 80 105 M 85 110 L 90 105" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Tray/floor to top of glass</text>
      </svg>
    ),
    tip: 'Measure up to a grout line above the shower head. Most are 2000–2100mm. Bath screens are usually 1500mm.',
  },
  {
    id: 'floor-type',
    title: 'What type of floor or base?',
    description: 'This affects how the glass is sealed',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="50" y="90" width="100" height="8" fill="currentColor" className="text-primary/20" />
        <rect x="50" y="98" width="100" height="20" fill="currentColor" className="text-muted-foreground/30" />
        <line x1="80" y1="70" x2="80" y2="90" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="120" y1="70" x2="120" y2="90" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Tray, wet room, or over bath</text>
      </svg>
    ),
    tip: 'Choose the surface the glass will sit on.',
  },
  {
    id: 'plumb-check',
    title: 'Are the walls straight and vertical?',
    description: 'Optional — check with a spirit level',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="60" y1="30" x2="60" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="65" y1="40" x2="65" y2="120" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
        <rect x="50" y="65" width="30" height="10" rx="2" fill="currentColor" className="text-primary/40" stroke="currentColor" strokeWidth="1" />
        <circle cx="65" cy="70" r="2" fill="currentColor" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Hold a level against the wall</text>
      </svg>
    ),
    tip: 'If walls lean or the floor slopes, we will cut the glass to fit. Skip this and we will check on survey.',
    canSkip: true,
  },
  {
    id: 'laser-left-wall',
    title: 'Left wall: laser line to wall',
    description: 'Project a vertical laser line parallel to the wall',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="60" y1="30" x2="60" y2="120" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-destructive" />
        <line x1="60" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="50" y="38" textAnchor="middle" className="fill-primary text-xs font-semibold">Top</text>
        <line x1="60" y1="75" x2="40" y2="75" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="50" y="73" textAnchor="middle" className="fill-primary text-xs font-semibold">Mid</text>
        <line x1="60" y1="110" x2="40" y2="110" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="50" y="108" textAnchor="middle" className="fill-primary text-xs font-semibold">Bot</text>
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Laser line (red) parallel to wall, tape gaps</text>
      </svg>
    ),
    tip: () => 'Project a vertical laser line parallel to the wall. Measure the gap from the laser line to the wall at the top, middle (optional) and bottom with a tape.',
    canSkip: false,
  },
  {
    id: 'laser-right-wall',
    title: 'Right wall: laser line to wall',
    description: 'Project a vertical laser line parallel to the wall',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="160" y1="30" x2="160" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="140" y1="30" x2="140" y2="120" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-destructive" />
        <line x1="140" y1="40" x2="160" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="150" y="38" textAnchor="middle" className="fill-primary text-xs font-semibold">Top</text>
        <line x1="140" y1="75" x2="160" y2="75" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="150" y="73" textAnchor="middle" className="fill-primary text-xs font-semibold">Mid</text>
        <line x1="140" y1="110" x2="160" y2="110" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="150" y="108" textAnchor="middle" className="fill-primary text-xs font-semibold">Bot</text>
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Laser line (red) parallel to wall, tape gaps</text>
      </svg>
    ),
    tip: () => 'Project a vertical laser line parallel to the wall. Measure the gap from the laser line to the wall at the top, middle (optional) and bottom with a tape.',
    canSkip: false,
  },
  {
    id: 'laser-back-wall',
    title: 'Back wall: laser line to wall',
    description: 'For corner/walk-in enclosures',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="30" y1="40" x2="170" y2="40" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="30" y1="60" x2="170" y2="60" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-destructive" />
        <line x1="50" y1="60" x2="50" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <line x1="100" y1="60" x2="100" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <line x1="150" y1="60" x2="150" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Laser line (red) parallel to wall, tape gaps</text>
      </svg>
    ),
    tip: () => 'Project a vertical laser line parallel to the back wall. Measure gaps at top, middle (optional) and bottom.',
    canSkip: false,
  },
  {
    id: 'obstacles',
    title: 'Any obstacles in the way?',
    description: 'Windows, radiators, sloped ceiling, etc.',
    illustration: () => (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="40" y="40" width="40" height="30" stroke="currentColor" strokeWidth="2" fill="currentColor" className="text-muted-foreground/20" />
        <line x1="60" y1="40" x2="60" y2="70" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
        <line x1="40" y1="55" x2="80" y2="55" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
        <rect x="120" y="90" width="40" height="30" rx="2" fill="currentColor" className="text-muted-foreground/20" stroke="currentColor" strokeWidth="2" />
        <line x1="125" y1="95" x2="155" y2="115" stroke="currentColor" strokeWidth="1" className="text-destructive" />
        <line x1="155" y1="95" x2="125" y2="115" stroke="currentColor" strokeWidth="1" className="text-destructive" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Windows, radiators, slopes</text>
      </svg>
    ),
    tip: 'Anything that would get in the way of the glass or affect how it fits.',
    canSkip: true,
  },
];

export function MeasuringWizard({ onComplete, onBack }: MeasuringWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [measuringMethod, setMeasuringMethod] = useState<MeasuringMethod>('tape');
  const [showerType, setShowerType] = useState<'alcove' | 'corner' | 'walk-in' | 'over-bath'>('alcove');
  const [openingWidthTop, setOpeningWidthTop] = useState('');
  const [openingWidthMiddle, setOpeningWidthMiddle] = useState('');
  const [openingWidthBottom, setOpeningWidthBottom] = useState('');
  const [widthNotSure, setWidthNotSure] = useState(false);
  const [depthMm, setDepthMm] = useState('');
  const [depthNotSure, setDepthNotSure] = useState(false);
  const [heightMm, setHeightMm] = useState('2000');
  const [heightNotSure, setHeightNotSure] = useState(false);
  const [floorType, setFloorType] = useState<'tray' | 'wet-room' | 'over-bath'>('tray');
  const [outOfPlumb, setOutOfPlumb] = useState(false);
  const [plumbSkipped, setPlumbSkipped] = useState(false);
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [obstaclesSkipped, setObstaclesSkipped] = useState(false);
  
  const [laserLeftGapTop, setLaserLeftGapTop] = useState('');
  const [laserLeftGapMiddle, setLaserLeftGapMiddle] = useState('');
  const [laserLeftGapBottom, setLaserLeftGapBottom] = useState('');
  const [laserRightGapTop, setLaserRightGapTop] = useState('');
  const [laserRightGapMiddle, setLaserRightGapMiddle] = useState('');
  const [laserRightGapBottom, setLaserRightGapBottom] = useState('');
  const [laserBackGapTop, setLaserBackGapTop] = useState('');
  const [laserBackGapMiddle, setLaserBackGapMiddle] = useState('');
  const [laserBackGapBottom, setLaserBackGapBottom] = useState('');

  const currentStep = STEPS[currentStepIndex];
  const isLast = currentStepIndex === STEPS.length - 1;

  const canProceed = () => {
    switch (currentStep.id) {
      case 'shower-type':
        return true;
      case 'opening-width':
        return (
          widthNotSure ||
          (openingWidthTop.trim() !== '' &&
            openingWidthMiddle.trim() !== '' &&
            openingWidthBottom.trim() !== '')
        );
      case 'depth':
        return depthNotSure || depthMm.trim() !== '' || currentStep.canSkip;
      case 'height':
        return heightNotSure || heightMm.trim() !== '';
      case 'floor-type':
        return true;
      case 'plumb-check':
        return true;
      case 'obstacles':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep.id === 'opening-width' && showerType !== 'corner') {
      const depthStepIndex = STEPS.findIndex((s) => s.id === 'depth');
      setCurrentStepIndex(depthStepIndex + 1);
      return;
    }

    if (isLast) {
      const openingWidthMm = widthNotSure
        ? 900
        : Math.min(
            parseInt(openingWidthTop, 10) || 0,
            parseInt(openingWidthMiddle, 10) || 0,
            parseInt(openingWidthBottom, 10) || 0
          );

      const result: MeasuringResult = {
        showerType,
        openingWidthMm,
        depthMm: depthNotSure || !depthMm ? undefined : parseInt(depthMm, 10),
        heightMm: heightNotSure ? 2000 : parseInt(heightMm, 10),
        floorType,
        outOfPlumb: outOfPlumb || plumbSkipped,
        obstacles: obstaclesSkipped ? [] : obstacles,
        notSure: [
          widthNotSure ? 'opening width' : '',
          depthNotSure ? 'depth' : '',
          heightNotSure ? 'height' : '',
        ].filter(Boolean),
      };

      onComplete(result);
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex === 0) {
      onBack();
    } else {
      if (currentStep.id === 'height' && showerType !== 'corner') {
        const depthStepIndex = STEPS.findIndex((s) => s.id === 'depth');
        setCurrentStepIndex(depthStepIndex);
        return;
      }
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep.id === 'depth') {
      setDepthNotSure(true);
    } else if (currentStep.id === 'plumb-check') {
      setPlumbSkipped(true);
    } else if (currentStep.id === 'obstacles') {
      setObstaclesSkipped(true);
    }
    handleNext();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i === currentStepIndex
                    ? 'bg-primary'
                    : i < currentStepIndex
                      ? 'bg-primary/40'
                      : 'bg-muted'
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
        {currentStep.illustration()}
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
        {currentStep.id === 'shower-type' && (
          <RadioGroup value={showerType} onValueChange={(v) => setShowerType(v as typeof showerType)}>
            <div className="space-y-2">
              {[
                { value: 'alcove', label: 'Alcove (between two walls)' },
                { value: 'corner', label: 'Corner enclosure' },
                { value: 'walk-in', label: 'Walk-in (no door)' },
                { value: 'over-bath', label: 'Over a bath' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <span className="flex-1 text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}

        {currentStep.id === 'opening-width' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="width-top">Top measurement (mm)</Label>
              <Input
                id="width-top"
                type="number"
                value={openingWidthTop}
                onChange={(e) => setOpeningWidthTop(e.target.value)}
                disabled={widthNotSure}
                placeholder="e.g. 900"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width-middle">Middle measurement (mm)</Label>
              <Input
                id="width-middle"
                type="number"
                value={openingWidthMiddle}
                onChange={(e) => setOpeningWidthMiddle(e.target.value)}
                disabled={widthNotSure}
                placeholder="e.g. 895"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width-bottom">Bottom measurement (mm)</Label>
              <Input
                id="width-bottom"
                type="number"
                value={openingWidthBottom}
                onChange={(e) => setOpeningWidthBottom(e.target.value)}
                disabled={widthNotSure}
                placeholder="e.g. 898"
                className="text-base"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
              <Checkbox
                checked={widthNotSure}
                onCheckedChange={(v) => setWidthNotSure(v === true)}
              />
              <span className="flex-1 text-sm">
                I'm not sure — use a typical size and we'll confirm on survey
              </span>
            </label>
            {widthNotSure && (
              <p className="text-sm text-muted-foreground">
                We'll use 900mm as a typical alcove width. You can adjust it on the next screen.
              </p>
            )}
          </div>
        )}

        {currentStep.id === 'depth' && showerType === 'corner' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="depth">Depth from back wall to front edge (mm)</Label>
              <Input
                id="depth"
                type="number"
                value={depthMm}
                onChange={(e) => setDepthMm(e.target.value)}
                disabled={depthNotSure}
                placeholder="e.g. 800"
                className="text-base"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
              <Checkbox
                checked={depthNotSure}
                onCheckedChange={(v) => setDepthNotSure(v === true)}
              />
              <span className="flex-1 text-sm">
                I'm not sure — we'll confirm this measurement on survey
              </span>
            </label>
          </div>
        )}

        {currentStep.id === 'height' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                value={heightMm}
                onChange={(e) => setHeightMm(e.target.value)}
                disabled={heightNotSure}
                placeholder="e.g. 2000"
                className="text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1500, 1850, 2000, 2100].map((h) => (
                <Button
                  key={h}
                  size="sm"
                  variant={heightMm === String(h) ? 'default' : 'outline'}
                  onClick={() => setHeightMm(String(h))}
                  disabled={heightNotSure}
                >
                  {h}
                </Button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3">
              <Checkbox
                checked={heightNotSure}
                onCheckedChange={(v) => setHeightNotSure(v === true)}
              />
              <span className="flex-1 text-sm">
                I'm not sure — use 2000mm and we'll confirm on survey
              </span>
            </label>
          </div>
        )}

        {currentStep.id === 'floor-type' && (
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
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <span className="flex-1 text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}

        {currentStep.id === 'plumb-check' && (
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-4">
              <Checkbox
                checked={outOfPlumb}
                onCheckedChange={(v) => setOutOfPlumb(v === true)}
              />
              <span className="flex-1">
                <span className="block font-medium">Walls lean or floor slopes</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  The spirit level shows they're not perfectly straight or level
                </span>
              </span>
            </label>
            <p className="text-sm text-muted-foreground">
              If you're not sure, skip this — we check everything on survey before cutting any
              glass.
            </p>
          </div>
        )}

        {currentStep.id === 'obstacles' && (
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
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep.canSkip && (
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed()}>
            {isLast ? 'Complete' : 'Next'}
            {!isLast && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        All sizes are confirmed before any glass is cut — these measurements help us prepare an
        accurate quote.
      </p>
    </div>
  );
}
