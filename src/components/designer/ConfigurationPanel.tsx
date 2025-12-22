/**
 * Configuration Panel Component
 * Allows users to customize their shower design
 */

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { HardwareFinish, DoorOpening, GlassType, GlassThickness } from '@/types';
import type { MountingType, ShowerTemplate } from '@/lib/templates';
import { HARDWARE_FINISH_NAMES } from '@/lib/constants';

interface ConfigurationPanelProps {
  template: ShowerTemplate;
  configuration: {
    mountingType: MountingType;
    doorOpening: DoorOpening;
    hardwareFinish: HardwareFinish;
    glassType: GlassType;
    glassThickness: GlassThickness;
    includeSeals: boolean;
    sealType?: string;
  };
  onChange: (config: Partial<ConfigurationPanelProps['configuration']>) => void;
}

export default function ConfigurationPanel({
  template,
  configuration,
  onChange,
}: ConfigurationPanelProps) {
  const {
    mountingType,
    doorOpening,
    hardwareFinish,
    glassType,
    glassThickness,
    includeSeals,
    sealType,
  } = configuration;

  return (
    <div className="space-y-6">
      {/* Glass Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Glass Specification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Glass Type */}
          <div className="space-y-2">
            <Label>Glass Type</Label>
            <RadioGroup
              value={glassType}
              onValueChange={(value) => onChange({ glassType: value as GlassType })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clear" id="glass-clear" />
                <Label htmlFor="glass-clear" className="cursor-pointer">
                  Clear
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="frosted" id="glass-frosted" />
                <Label htmlFor="glass-frosted" className="cursor-pointer">
                  Frosted
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tinted" id="glass-tinted" />
                <Label htmlFor="glass-tinted" className="cursor-pointer">
                  Tinted
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Glass Thickness */}
          <div className="space-y-2">
            <Label>Glass Thickness</Label>
            <RadioGroup
              value={glassThickness.toString()}
              onValueChange={(value) =>
                onChange({ glassThickness: parseInt(value) as GlassThickness })
              }
            >
              {template.recommendedThickness.map((thickness) => (
                <div key={thickness} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={thickness.toString()}
                    id={`thickness-${thickness}`}
                  />
                  <Label
                    htmlFor={`thickness-${thickness}`}
                    className="cursor-pointer"
                  >
                    {thickness}mm
                    {template.recommendedThickness.length > 1 &&
                      thickness === Math.max(...template.recommendedThickness) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Recommended
                        </Badge>
                      )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Mounting Type */}
      {template.supportedMounting.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mounting System</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={mountingType}
              onValueChange={(value) =>
                onChange({ mountingType: value as MountingType })
              }
            >
              {template.supportedMounting.includes('channel') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="channel" id="mount-channel" />
                  <div className="flex-1">
                    <Label htmlFor="mount-channel" className="cursor-pointer">
                      U-Channel
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Wall/ceiling mounted channel for secure installation
                    </p>
                  </div>
                </div>
              )}
              {template.supportedMounting.includes('clamps') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="clamps" id="mount-clamps" />
                  <div className="flex-1">
                    <Label htmlFor="mount-clamps" className="cursor-pointer">
                      Glass Clamps
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Minimalist clamps for a clean, modern look
                    </p>
                  </div>
                </div>
              )}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Door Opening Direction */}
      {template.supportedDoorOpenings.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Door Opening</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={doorOpening}
              onValueChange={(value) =>
                onChange({ doorOpening: value as DoorOpening })
              }
            >
              {template.supportedDoorOpenings.includes('inward') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inward" id="door-inward" />
                  <Label htmlFor="door-inward" className="cursor-pointer">
                    Opens Inward
                  </Label>
                </div>
              )}
              {template.supportedDoorOpenings.includes('outward') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outward" id="door-outward" />
                  <Label htmlFor="door-outward" className="cursor-pointer">
                    Opens Outward
                  </Label>
                </div>
              )}
              {template.supportedDoorOpenings.includes('both') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="door-both" />
                  <Label htmlFor="door-both" className="cursor-pointer">
                    Opens Both Ways
                  </Label>
                </div>
              )}
              {template.supportedDoorOpenings.includes('left') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="door-left" />
                  <Label htmlFor="door-left" className="cursor-pointer">
                    Opens to the Left
                  </Label>
                </div>
              )}
              {template.supportedDoorOpenings.includes('right') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="door-right" />
                  <Label htmlFor="door-right" className="cursor-pointer">
                    Opens to the Right
                  </Label>
                </div>
              )}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Hardware Finish */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hardware Finish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(HARDWARE_FINISH_NAMES) as HardwareFinish[]).map(
              (finish) => (
                <button
                  key={finish}
                  onClick={() => onChange({ hardwareFinish: finish })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    hardwareFinish === finish
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full ${
                        finish === 'chrome'
                          ? 'bg-gradient-to-br from-gray-300 to-gray-100'
                          : finish === 'brushed-nickel'
                          ? 'bg-gradient-to-br from-gray-400 to-gray-300'
                          : finish === 'matte-black'
                          ? 'bg-gradient-to-br from-gray-900 to-gray-700'
                          : 'bg-gradient-to-br from-yellow-600 to-yellow-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-center">
                      {HARDWARE_FINISH_NAMES[finish]}
                    </span>
                  </div>
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Door Seals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="include-seals"
              checked={includeSeals}
              onChange={(e) => onChange({ includeSeals: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="include-seals" className="cursor-pointer">
              Include door seals
            </Label>
          </div>

          {includeSeals && (
            <div className="space-y-2">
              <Label htmlFor="seal-type">Seal Type</Label>
              <Select
                value={sealType}
                onValueChange={(value) => onChange({ sealType: value })}
              >
                <SelectTrigger id="seal-type">
                  <SelectValue placeholder="Select seal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">Bottom Seal Only</SelectItem>
                  <SelectItem value="side">Side Seals Only</SelectItem>
                  <SelectItem value="magnetic">Magnetic Seal</SelectItem>
                  <SelectItem value="full">Full Seal Package</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Seals help prevent water leakage and improve door closure
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
