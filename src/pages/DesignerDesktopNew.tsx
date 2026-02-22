/**
 * Desktop Shower Design Tool (New)
 * Design-only interface using ShowerConfiguration component
 * 1440px desktop frame with top bar, central canvas, and right-hand panel
 */

import { useState } from 'react';
import { ShowerConfiguration, type ShowerTemplateType } from '@/components/designer/ShowerConfiguration';
import { ShowerConfigurationWithDimensions } from '@/components/designer/ShowerConfigurationWithDimensions';
import ShowerTemplateSelector from '@/components/designer/ShowerTemplateSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Download, Save, ArrowLeft, ArrowRight } from 'lucide-react';

type DoorSwing = 'in' | 'out' | 'in-out';
type HandleType = 'knob' | 'pull' | 'sph8' | 'victorian' | 'sq8' | 'bowtie' | 'paddle' | 'crescent' | 'ez-grip';
type ThresholdType = 'standard' | 'low-profile' | 'flush' | 'half-round';
type FloorRakeDirection = 'none' | 'left' | 'right';
type WallRakeDirection = 'none' | 'in' | 'out';

type DesignStep = 'template' | 'configure';

interface DesignState {
  templateType: ShowerTemplateType | null;
  doorSwing: DoorSwing;
  handleType: HandleType;
  mountingType: 'channel' | 'clamps';
  thresholdType: ThresholdType;
  width: number;
  height: number;
  floorRake: number;
  floorRakeDirection: FloorRakeDirection;
  leftWallRake: number;
  leftWallRakeDirection: WallRakeDirection;
  showNotch: boolean;
  notchWidth: number;
  notchHeight: number;
}

export default function DesignerDesktopNew() {
  const [step, setStep] = useState<DesignStep>('template');
  const [design, setDesign] = useState<DesignState>({
    templateType: null,
    doorSwing: 'out',
    handleType: 'sph8', // Default to the new handle
    mountingType: 'channel',
    thresholdType: 'standard',
    width: 900,
    height: 2000,
    floorRake: 0,
    floorRakeDirection: 'none',
    leftWallRake: 0,
    leftWallRakeDirection: 'none',
    showNotch: false,
    notchWidth: 60,
    notchHeight: 40,
  });

  // Default dimensions based on template type
  const getDefaultDimensions = (type: ShowerTemplateType) => {
    switch (type) {
      case 'single-door':
        return { width: 900, height: 2000 };
      case 'double-door':
        return { width: 1200, height: 2000 };
      case 'left-panel':
      case 'right-panel':
        return { width: 1100, height: 2000 };
      case 'three-panel':
        return { width: 1500, height: 2000 };
      case 'corner-left':
      case 'corner-right':
        return { width: 1400, height: 2000 };
      case '90-return':
      case '90-return-left':
      case '90-return-right':
        return { width: 1000, height: 2000 };
      case 'angled-ceiling':
        return { width: 1000, height: 2000 };
      default:
        return { width: 900, height: 2000 };
    }
  };

  const [designHistory, setDesignHistory] = useState<DesignState[]>([]);

  const handleTemplateSelect = (type: ShowerTemplateType) => {
    const defaultDims = getDefaultDimensions(type);
    const newDesign = {
      ...design,
      templateType: type,
      width: defaultDims.width,
      height: defaultDims.height,
    };
    setDesign(newDesign);
    setDesignHistory([...designHistory, newDesign]);
    // Move to configuration step after template selection
    setStep('configure');
  };

  const handleDesignChange = (updates: Partial<DesignState>) => {
    const newDesign = { ...design, ...updates };
    setDesign(newDesign);
    setDesignHistory([...designHistory, newDesign]);
  };

  const resetDesign = () => {
    if (design.templateType) {
      // Reset to default dimensions for current template
      const defaultDims = getDefaultDimensions(design.templateType);
      setDesign({
        ...design,
        doorSwing: 'out',
        handleType: 'pull',
        mountingType: 'channel',
        thresholdType: 'standard',
        width: defaultDims.width,
        height: defaultDims.height,
        floorRake: 0,
        floorRakeDirection: 'none',
        leftWallRake: 0,
        leftWallRakeDirection: 'none',
        showNotch: false,
        notchWidth: 60,
        notchHeight: 40,
      });
    } else {
      // Reset everything and go back to template selection
      setDesign({
        templateType: null,
        doorSwing: 'out',
        handleType: 'pull',
        mountingType: 'channel',
        thresholdType: 'standard',
        width: 900,
        height: 2000,
        floorRake: 0,
        floorRakeDirection: 'none',
        leftWallRake: 0,
        leftWallRakeDirection: 'none',
        showNotch: false,
        notchWidth: 60,
        notchHeight: 40,
      });
      setStep('template');
    }
    setDesignHistory([]);
  };

  const saveDesign = () => {
    // TODO: Implement save functionality
    console.log('Saving design:', design);
  };

  const exportDesign = () => {
    // TODO: Implement export functionality
    console.log('Exporting design:', design);
  };

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900">Shower Design Tool</h1>
          {design.templateType && (
            <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded">
              {design.templateType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={resetDesign}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          {design.templateType && (
            <Button variant="outline" size="sm" onClick={saveDesign}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportDesign}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Central Design Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-slate-200 overflow-auto">
          {step === 'template' && (
            <div className="text-center max-w-2xl w-full">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Select a Shower Template</h2>
              <p className="text-lg text-slate-600 mb-8">
                Choose a predefined shower design template to begin configuring your shower enclosure.
                You can alter dimensions and configurations until you have your final design.
              </p>
              <ShowerTemplateSelector
                onSelect={handleTemplateSelect}
                selectedType={design.templateType}
              />
            </div>
          )}

          {step === 'configure' && design.templateType && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg p-4 mb-4 w-full max-w-6xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Configure Your Design</h2>
                  <Button variant="outline" size="sm" onClick={() => setStep('template')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Change Template
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center bg-white rounded-lg shadow-lg p-8 w-full max-w-6xl">
                <div className="w-full flex justify-center">
                  <div style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
                    <ShowerConfigurationWithDimensions
                      type={design.templateType}
                      width={design.width}
                      height={design.height}
                      mountingType={design.mountingType}
                      doorSwing={design.doorSwing}
                      floorRake={design.floorRake}
                      floorRakeDirection={design.floorRakeDirection}
                      leftWallRake={design.leftWallRake}
                      leftWallRakeDirection={design.leftWallRakeDirection}
                      notches={design.showNotch ? [{
                        panel: 'panel-door', // defaulting to door for this simple toggle
                        corner: 'bottom-left', // defaulting to bottom-left
                        widthMm: design.notchWidth,
                        heightMm: design.notchHeight
                      }] : []}
                      onDimensionsChange={(width, height) => {
                        handleDesignChange({ width, height });
                      }}
                      onDoorSwingChange={(swing) => {
                        handleDesignChange({ doorSwing: swing });
                      }}
                      editable={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right-Hand Configuration Panel */}
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Design Configuration</h2>

              {!design.templateType && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-600 text-center">
                      Select a template to begin configuring your design
                    </p>
                  </CardContent>
                </Card>
              )}

              {step === 'configure' && design.templateType && (
                <>
                  {/* Door Direction/Swing - Prominent */}
                  <Card className="mb-4 border-2 border-primary/20">
                    <CardHeader className="pb-3 bg-primary/5">
                      <CardTitle className="text-sm font-semibold">Door Direction</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <RadioGroup
                        value={design.doorSwing}
                        onValueChange={(value) => handleDesignChange({ doorSwing: value as DoorSwing })}
                      >
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="in" id="swing-in" />
                          <Label htmlFor="swing-in" className="cursor-pointer flex-1">
                            Swing In
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="out" id="swing-out" />
                          <Label htmlFor="swing-out" className="cursor-pointer flex-1">
                            Swing Out
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="in-out" id="swing-in-out" />
                          <Label htmlFor="swing-in-out" className="cursor-pointer flex-1">
                            Swing In + Out (180°)
                          </Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-slate-500 mt-3">
                        {design.doorSwing === 'in-out'
                          ? 'Door swings both directions. Bubble seal will be shown on door edge.'
                          : 'Door swings one direction. H-seal will be shown on fixed panel edge.'}
                      </p>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Dimensions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Dimensions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="width" className="text-xs text-slate-600">
                          Width (mm)
                        </Label>
                        <input
                          id="width"
                          type="number"
                          value={design.width}
                          onChange={(e) => handleDesignChange({ width: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                          min="200"
                          max="2000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height" className="text-xs text-slate-600">
                          Height (mm)
                        </Label>
                        <input
                          id="height"
                          type="number"
                          value={design.height}
                          onChange={(e) => handleDesignChange({ height: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                          min="1500"
                          max="3000"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Mounting Type */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Mounting Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={design.mountingType}
                        onValueChange={(value) => handleDesignChange({ mountingType: value as 'channel' | 'clamps' })}
                      >
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="channel" id="mount-channel" />
                          <div className="flex-1">
                            <Label htmlFor="mount-channel" className="cursor-pointer font-medium">
                              U-Channel
                            </Label>
                            <p className="text-xs text-slate-500">
                              Adjustable wall profile (Standard)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="clamps" id="mount-clamps" />
                          <div className="flex-1">
                            <Label htmlFor="mount-clamps" className="cursor-pointer font-medium">
                              Clamps
                            </Label>
                            <p className="text-xs text-slate-500">
                              Minimalist clips (Premium)
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Mounting Type */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Mounting Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={design.mountingType}
                        onValueChange={(value) => handleDesignChange({ mountingType: value as 'channel' | 'clamps' })}
                      >
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="channel" id="mount-channel" />
                          <div className="flex-1">
                            <Label htmlFor="mount-channel" className="cursor-pointer font-medium">
                              U-Channel
                            </Label>
                            <p className="text-xs text-slate-500">
                              Adjustable wall profile (Standard)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="clamps" id="mount-clamps" />
                          <div className="flex-1">
                            <Label htmlFor="mount-clamps" className="cursor-pointer font-medium">
                              Clamps
                            </Label>
                            <p className="text-xs text-slate-500">
                              Minimalist clips (Premium)
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Door Swing */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Door Swing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={design.doorSwing}
                        onValueChange={(value) => handleDesignChange({ doorSwing: value as DoorSwing })}
                      >
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="in" id="swing-in" />
                          <Label htmlFor="swing-in" className="cursor-pointer flex-1">
                            In
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="out" id="swing-out" />
                          <Label htmlFor="swing-out" className="cursor-pointer flex-1">
                            Out
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="in-out" id="swing-in-out" />
                          <Label htmlFor="swing-in-out" className="cursor-pointer flex-1">
                            In + Out (180°)
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Handle Type */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Handle Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={design.handleType}
                        onValueChange={(value) => handleDesignChange({ handleType: value as HandleType })}
                      >
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="knob" id="handle-knob" />
                          <Label htmlFor="handle-knob" className="cursor-pointer flex-1">
                            Knob
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="pull" id="handle-pull" />
                          <Label htmlFor="handle-pull" className="cursor-pointer flex-1">
                            Standard Pull
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="sph8" id="handle-sph8" />
                          <Label htmlFor="handle-sph8" className="cursor-pointer flex-1">
                            8" Solid Pull (SPH8)
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Threshold Type */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Threshold Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <select
                        value={design.thresholdType}
                        onChange={(e) => handleDesignChange({ thresholdType: e.target.value as ThresholdType })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      >
                        <option value="standard">Standard</option>
                        <option value="low-profile">Low Profile</option>
                        <option value="flush">Flush</option>
                        <option value="half-round">Half-Round (£14.12)</option>
                      </select>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Floor Rake */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Floor Rake</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="floorRake" className="text-xs text-slate-600">
                          Floor rake (mm)
                        </Label>
                        <input
                          id="floorRake"
                          type="number"
                          value={design.floorRake}
                          onChange={(e) => handleDesignChange({ floorRake: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="floorRakeDirection" className="text-xs text-slate-600">
                          Floor rake direction
                        </Label>
                        <select
                          id="floorRakeDirection"
                          value={design.floorRakeDirection}
                          onChange={(e) => handleDesignChange({ floorRakeDirection: e.target.value as FloorRakeDirection })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                        >
                          <option value="none">None</option>
                          <option value="left">Down left</option>
                          <option value="right">Down right</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Left Wall Rake */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Left Wall Rake</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="leftWallRake" className="text-xs text-slate-600">
                          Left wall rake (mm)
                        </Label>
                        <input
                          id="leftWallRake"
                          type="number"
                          value={design.leftWallRake}
                          onChange={(e) => handleDesignChange({ leftWallRake: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="leftWallRakeDirection" className="text-xs text-slate-600">
                          Left wall direction
                        </Label>
                        <select
                          id="leftWallRakeDirection"
                          value={design.leftWallRakeDirection}
                          onChange={(e) => handleDesignChange({ leftWallRakeDirection: e.target.value as WallRakeDirection })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                        >
                          <option value="none">None</option>
                          <option value="in">Leans in at top</option>
                          <option value="out">Leans out at top</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Notch */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Notch</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="showNotch" className="text-xs text-slate-600">
                          Show notch
                        </Label>
                        <select
                          id="showNotch"
                          value={design.showNotch ? 'yes' : 'no'}
                          onChange={(e) => handleDesignChange({ showNotch: e.target.value === 'yes' })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                      {design.showNotch && (
                        <>
                          <div>
                            <Label htmlFor="notchWidth" className="text-xs text-slate-600">
                              Notch width (mm)
                            </Label>
                            <input
                              id="notchWidth"
                              type="number"
                              value={design.notchWidth}
                              onChange={(e) => handleDesignChange({ notchWidth: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                              min="10"
                              max="200"
                            />
                          </div>
                          <div>
                            <Label htmlFor="notchHeight" className="text-xs text-slate-600">
                              Notch height (mm)
                            </Label>
                            <input
                              id="notchHeight"
                              type="number"
                              value={design.notchHeight}
                              onChange={(e) => handleDesignChange({ notchHeight: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                              min="10"
                              max="200"
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Design History */}
                  {designHistory.length > 0 && (
                    <>
                      <Separator />
                      <Card className="bg-slate-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Design History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-slate-600">
                            {designHistory.length} change{designHistory.length !== 1 ? 's' : ''} made
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
