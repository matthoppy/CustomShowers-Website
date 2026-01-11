/**
 * Measurement Point Component
 * Interactive measurement label with rake type indicator
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import type { MeasurementPoint as MeasurementPointType, RakeType } from '@/lib/measurements';
import { RAKE_TYPE_NAMES, RAKE_TYPE_DESCRIPTIONS } from '@/lib/measurements';

interface MeasurementPointProps {
  measurement: MeasurementPointType;
  onUpdate: (measurement: MeasurementPointType) => void;
  /** Position on canvas [x, y] as percentage */
  position: [number, number];
}

/**
 * Rake type diagram icons (simple SVG representations)
 */
function RakeDiagram({ type }: { type: RakeType }) {
  const diagrams = {
    plumb: (
      <svg viewBox="0 0 40 60" className="w-12 h-16">
        <line x1="20" y1="5" x2="20" y2="55" stroke="currentColor" strokeWidth="2" />
        <line x1="15" y1="30" x2="25" y2="30" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
        <text x="30" y="33" fontSize="10" fill="currentColor">90°</text>
      </svg>
    ),
    level: (
      <svg viewBox="0 0 60 40" className="w-16 h-12">
        <line x1="5" y1="20" x2="55" y2="20" stroke="currentColor" strokeWidth="2" />
        <line x1="30" y1="15" x2="30" y2="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
        <text x="25" y="12" fontSize="10" fill="currentColor">0°</text>
      </svg>
    ),
    out: (
      <svg viewBox="0 0 60 60" className="w-16 h-16">
        <line x1="20" y1="5" x2="30" y2="55" stroke="currentColor" strokeWidth="2" />
        <line x1="20" y1="5" x2="20" y2="55" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
        <path d="M 20 30 Q 22 30 25 40" stroke="currentColor" strokeWidth="1" fill="none" />
        <text x="32" y="33" fontSize="10" fill="currentColor">→</text>
      </svg>
    ),
    in: (
      <svg viewBox="0 0 60 60" className="w-16 h-16">
        <line x1="30" y1="5" x2="20" y2="55" stroke="currentColor" strokeWidth="2" />
        <line x1="20" y1="5" x2="20" y2="55" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
        <path d="M 20 30 Q 18 30 15 40" stroke="currentColor" strokeWidth="1" fill="none" />
        <text x="8" y="33" fontSize="10" fill="currentColor">←</text>
      </svg>
    ),
    rise: (
      <svg viewBox="0 0 60 40" className="w-16 h-12">
        <line x1="5" y1="30" x2="55" y2="15" stroke="currentColor" strokeWidth="2" />
        <line x1="5" y1="30" x2="55" y2="30" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
        <path d="M 30 30 Q 30 28 40 20" stroke="currentColor" strokeWidth="1" fill="none" />
        <text x="35" y="25" fontSize="10" fill="currentColor">↗</text>
      </svg>
    ),
  };

  return diagrams[type];
}

export default function MeasurementPoint({
  measurement,
  onUpdate,
  position,
}: MeasurementPointProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedValue, setEditedValue] = useState(measurement.value.toString());
  const [editedRake, setEditedRake] = useState(measurement.rakeType);

  const handleSave = () => {
    const newValue = parseInt(editedValue, 10);
    if (!isNaN(newValue) && newValue > 0) {
      onUpdate({
        ...measurement,
        value: newValue,
        rakeType: editedRake,
      });
      setIsOpen(false);
    }
  };

  const rakeColor = {
    plumb: 'bg-orange-500',
    level: 'bg-orange-500',
    out: 'bg-orange-500',
    in: 'bg-orange-500',
    rise: 'bg-orange-500',
  }[measurement.rakeType];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="absolute cursor-pointer hover:scale-110 transition-transform"
          style={{
            left: `${position[0]}%`,
            top: `${position[1]}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Measurement value */}
          <div className="text-sm font-medium text-foreground mb-1">
            {measurement.value}
          </div>

          {/* Rake indicator badge */}
          <Badge className={`${rakeColor} text-white hover:${rakeColor} text-xs px-2 py-0.5`}>
            {RAKE_TYPE_NAMES[measurement.rakeType]}
          </Badge>

          {/* Optional rake angle indicator */}
          {measurement.rakeAngle && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {measurement.rakeAngle}°
            </div>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Measurement: {measurement.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Measurement value input */}
          <div className="space-y-2">
            <Label htmlFor="value">Measurement (mm)</Label>
            <Input
              id="value"
              type="number"
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              placeholder="Enter measurement in mm"
            />
            <p className="text-sm text-muted-foreground">
              Enter the measurement in millimeters
            </p>
          </div>

          {/* Rake type selection */}
          <div className="space-y-3">
            <Label>Rake Type</Label>
            <RadioGroup value={editedRake} onValueChange={(v) => setEditedRake(v as RakeType)}>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(RAKE_TYPE_NAMES) as RakeType[]).map((rakeType) => (
                  <div
                    key={rakeType}
                    className={`flex items-start space-x-2 p-3 rounded-lg border-2 transition-colors ${
                      editedRake === rakeType
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={rakeType} id={rakeType} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={rakeType} className="cursor-pointer flex flex-col gap-2">
                        <span className="font-semibold">{RAKE_TYPE_NAMES[rakeType]}</span>
                        <div className="flex items-center justify-center bg-muted rounded p-2">
                          <RakeDiagram type={rakeType} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {RAKE_TYPE_DESCRIPTIONS[rakeType]}
                        </span>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Rake angle input (for non-plumb/level) */}
          {(editedRake === 'out' || editedRake === 'in' || editedRake === 'rise') && (
            <div className="space-y-2">
              <Label htmlFor="angle">Rake Angle (degrees)</Label>
              <Input
                id="angle"
                type="number"
                min="1"
                max="45"
                defaultValue={measurement.rakeAngle || 5}
                placeholder="Enter angle in degrees"
              />
              <p className="text-sm text-muted-foreground">
                Angle from vertical (for walls) or horizontal (for floor)
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Measurement</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
