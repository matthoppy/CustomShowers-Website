/**
 * Desktop Shower Design Tool
 * Design-only interface (no pricing)
 * 1440px desktop frame with top bar, central canvas, and right-hand panel
 */

import { useState } from 'react';
import { useDesign, DesignProvider } from '@/contexts/DesignContext';
import TemplateSelector from '@/components/designer/TemplateSelector';
import ShowerDesignCanvas from '@/components/designer/ShowerDesignCanvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Download } from 'lucide-react';
import type { HingeType } from '@/lib/constants';

type DoorSwing = 'in' | 'out' | 'in-out';
type HandleType = 'knob' | 'pull';
type ThresholdType = 'standard' | 'low-profile' | 'flush';

function DesignerDesktopContent() {
  const { design, updateTemplate, resetDesign } = useDesign();
  const [doorSwing, setDoorSwing] = useState<DoorSwing>('out');
  const [hingeType, setHingeType] = useState<HingeType>('geneva');
  const [handleType, setHandleType] = useState<HandleType>('pull');
  const [thresholdType, setThresholdType] = useState<ThresholdType>('standard');

  const handleTemplateSelect = (template: any) => {
    if (template) {
      updateTemplate(template);
    } else {
      resetDesign();
    }
  };

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900">Shower Design Tool</h1>
          {design.template && (
            <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded">
              {design.template.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={resetDesign}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Central Design Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-slate-200 overflow-auto">
          {design.template ? (
            <ShowerDesignCanvas
              template={design.template}
              doorSwing={doorSwing}
              hingeType={hingeType}
              handleType={handleType}
              thresholdType={thresholdType}
              width={900}
              height={700}
            />
          ) : (
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Select a Shower Template</h2>
              <p className="text-slate-600 mb-6">
                Choose a predefined shower design template to begin configuring your door.
              </p>
              <TemplateSelector
                onSelect={handleTemplateSelect}
                selectedTemplateId={null}
              />
            </div>
          )}
        </div>

        {/* Right-Hand Configuration Panel */}
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Door Configuration</h2>
              
              {!design.template && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-600 text-center">
                      Select a template to configure the door
                    </p>
                  </CardContent>
                </Card>
              )}

              {design.template && (
                <>
                  {/* Template Selection */}
                  <Card className="mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TemplateSelector
                        onSelect={handleTemplateSelect}
                        selectedTemplateId={design.template?.id}
                      />
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Door Swing */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Door Swing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={doorSwing} onValueChange={(value) => setDoorSwing(value as DoorSwing)}>
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
                      <p className="text-xs text-slate-500 mt-3">
                        {doorSwing === 'in-out' 
                          ? 'Door swings both directions. Bubble seal will be shown on door edge.'
                          : 'Door swings one direction. H-seal will be shown on fixed panel edge.'}
                      </p>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Hinge Type */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Hinge Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={hingeType} onValueChange={(value) => setHingeType(value as HingeType)}>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="geneva" id="hinge-geneva" />
                          <Label htmlFor="hinge-geneva" className="cursor-pointer flex-1">
                            Geneva
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="vienna" id="hinge-vienna" />
                          <Label htmlFor="hinge-vienna" className="cursor-pointer flex-1">
                            Vienna
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="bellagio" id="hinge-bellagio" />
                          <Label htmlFor="hinge-bellagio" className="cursor-pointer flex-1">
                            Bellagio
                          </Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-slate-500 mt-3">
                        Hinges are positioned 250mm from top and bottom of door edge.
                      </p>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Handle Type */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Handle Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={handleType} onValueChange={(value) => setHandleType(value as HandleType)}>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="knob" id="handle-knob" />
                          <Label htmlFor="handle-knob" className="cursor-pointer flex-1">
                            Knob
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value="pull" id="handle-pull" />
                          <Label htmlFor="handle-pull" className="cursor-pointer flex-1">
                            Pull Handle
                          </Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-slate-500 mt-3">
                        {handleType === 'knob' 
                          ? 'Knob center: 950mm from bottom'
                          : 'Pull handle: 850mm from bottom (bottom hole)'}
                      </p>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Threshold Type */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Threshold Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={thresholdType} onValueChange={(value) => setThresholdType(value as ThresholdType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="low-profile">Low Profile</SelectItem>
                          <SelectItem value="flush">Flush</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Visual Rules Info */}
                  <Card className="bg-slate-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Visual Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 space-y-2">
                      <div>• Hinges: 250mm from top/bottom</div>
                      <div>• {doorSwing === 'in-out' ? 'Bubble seal on door edge' : 'H-seal on fixed panel edge'}</div>
                      <div>• Door swing arcs shown in orange</div>
                      <div>• Fixed panels shown with dashed outline</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesignerDesktop() {
  return (
    <DesignProvider>
      <DesignerDesktopContent />
    </DesignProvider>
  );
}
