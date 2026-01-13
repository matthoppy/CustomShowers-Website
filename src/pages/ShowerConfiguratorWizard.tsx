/**
 * Shower Configurator Wizard
 * Step-by-step process following the user question flow specification
 * All existing templates are preserved and mapped to new layout options
 */

import { useState } from 'react';
import { ShowerConfiguration, type ShowerTemplateType } from '@/components/designer/ShowerConfiguration';
import { ShowerConfigurationWithDimensions } from '@/components/designer/ShowerConfigurationWithDimensions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

// Use all existing templates directly
const TEMPLATE_LABELS: Record<ShowerTemplateType, string> = {
  'single-door': 'Single Door',
  'double-door': 'Door with Sidelight',
  'left-panel': 'Door with Short Sidelight',
  'right-panel': 'Fixed Panel Notch',
  'three-panel': 'Three Panel',
  'corner-left': 'Centre Door Short Sidelights',
  'corner-right': 'Centre Door Notched Sidelights',
  '90-return': '90° Return with Sidelight',
  '90-return-left': '90° Return Left',
  '90-return-right': '90° Return Right',
  'angled-ceiling': 'Angled Ceiling',
};

const ALL_TEMPLATES: ShowerTemplateType[] = [
  'single-door',
  'double-door',
  'left-panel',
  'right-panel',
  'three-panel',
  'corner-left',
  'corner-right',
  '90-return',
  '90-return-left',
  '90-return-right',
  'angled-ceiling',
];

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface DesignData {
  layout: ShowerTemplateType | null;
  widthMm: number;
  heightMm: number;
  customization: {
    door: {
      opens: 'out' | 'in';
      hingeSide: 'left' | 'right';
      swingDeg: number;
    };
    panels: {
      addInlineFixed: boolean;
      inlineFixedSide: 'left' | 'right';
      inlineFixedWidthMm: number;
      addReturn: boolean;
      returnSide: 'left' | 'right';
      returnWidthMm: number;
    };
    notches: Array<{
      panel: 'panel-door' | 'panel-fixed' | 'panel-return';
      corner: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
      widthMm: number;
      heightMm: number;
    }>;
    rakes: {
      floor: { amountMm: number; direction: 'none' | 'left' | 'right' | 'front' | 'back' };
      wallLeft: { amountMm: number; direction: 'none' | 'in' | 'out' };
      wallRight: { amountMm: number; direction: 'none' | 'in' | 'out' };
      wallBack: { amountMm: number; direction: 'none' | 'in' | 'out' };
    };
  };
  glass: 'standard' | 'ultra-clear';
  finish: 'chrome' | 'brushed-nickel' | 'matte-black' | 'brushed-brass';
  handle: 'standard' | 'premium';
  hinges: 'standard' | 'premium';
  customer: {
    name: string;
    email: string;
    phone: string;
    postcode: string;
    notes: string;
  };
}

const INITIAL_DATA: DesignData = {
  layout: null,
  widthMm: 1200,
  heightMm: 2000,
  customization: {
    door: {
      opens: 'out',
      hingeSide: 'left',
      swingDeg: 90,
    },
    panels: {
      addInlineFixed: false,
      inlineFixedSide: 'left',
      inlineFixedWidthMm: 0,
      addReturn: false,
      returnSide: 'left',
      returnWidthMm: 0,
    },
    notches: [],
    rakes: {
      floor: { amountMm: 0, direction: 'none' },
      wallLeft: { amountMm: 0, direction: 'none' },
      wallRight: { amountMm: 0, direction: 'none' },
      wallBack: { amountMm: 0, direction: 'none' },
    },
  },
  glass: 'standard',
  finish: 'chrome',
  handle: 'standard',
  hinges: 'standard',
  customer: {
    name: '',
    email: '',
    phone: '',
    postcode: '',
    notes: '',
  },
};

export default function ShowerConfiguratorWizard() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<DesignData>(INITIAL_DATA);

  const updateData = (updates: Partial<DesignData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const updateCustomization = (updates: Partial<DesignData['customization']>) => {
    setData((prev) => ({
      ...prev,
      customization: { ...prev.customization, ...updates },
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.layout !== null;
      case 2:
        return data.widthMm > 0 && data.heightMm > 0;
      case 9:
        return (
          data.customer.name.trim() !== '' &&
          data.customer.email.trim() !== '' &&
          data.customer.phone.trim() !== '' &&
          data.customer.postcode.trim() !== ''
        );
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < 9) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const getTemplateType = (): ShowerTemplateType => {
    if (!data.layout) return 'single-door';
    return data.layout;
  };

  const getDoorSwing = (): 'in' | 'out' | 'in-out' => {
    return data.customization.door.opens === 'in' ? 'in' : 'out';
  };

  // Step 1: Choose shower layout
  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose your shower layout</h2>
      <p className="text-lg text-slate-600 mb-8">Select the layout that best matches your space.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ALL_TEMPLATES.map((template) => (
          <Card
            key={template}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              data.layout === template ? 'ring-2 ring-primary border-primary' : ''
            }`}
            onClick={() => updateData({ layout: template })}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4 bg-slate-50 rounded-lg p-4 h-48">
                <ShowerConfiguration
                  type={template}
                  width={200}
                  height={300}
                />
              </div>
              <h3 className="text-lg font-semibold text-center">{TEMPLATE_LABELS[template]}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Step 2: Enter opening size
  const renderStep2 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Enter your opening size</h2>
      <p className="text-lg text-slate-600 mb-4">
        Measure the full width and height of the opening where the shower will be installed.
      </p>
      <p className="text-sm text-slate-500 mb-8">
        Typical shower height is 2000–2100mm. If unsure, enter your best estimate — we'll confirm during site measure.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <Label htmlFor="width" className="text-base font-medium">
              Width (mm)
            </Label>
            <Input
              id="width"
              type="number"
              value={data.widthMm}
              onChange={(e) => updateData({ widthMm: Number(e.target.value) })}
              placeholder="1200"
              className="mt-2"
              min="200"
              max="3000"
            />
          </div>
          <div>
            <Label htmlFor="height" className="text-base font-medium">
              Height (mm)
            </Label>
            <Input
              id="height"
              type="number"
              value={data.heightMm}
              onChange={(e) => updateData({ heightMm: Number(e.target.value) })}
              placeholder="2000"
              className="mt-2"
              min="1500"
              max="3000"
            />
            {(data.heightMm < 2000 || data.heightMm > 2100) && data.heightMm > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                Note: Height is outside typical range (2000–2100mm)
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center bg-white rounded-lg shadow p-8">
          {data.layout && (
            <ShowerConfigurationWithDimensions
              type={getTemplateType()}
              width={data.widthMm}
              height={data.heightMm}
              doorSwing={getDoorSwing()}
              editable={true}
              interactive={true}
              onDimensionsChange={(width, height) => updateData({ widthMm: width, heightMm: height })}
              onDoorSwingChange={(swing) => {
                updateCustomization({
                  door: { ...data.customization.door, opens: swing === 'in' ? 'in' : 'out' },
                });
              }}
              onNotchClick={(idx) => {
                // Remove notch on click
                const newNotches = [...data.customization.notches];
                newNotches.splice(idx, 1);
                updateCustomization({ notches: newNotches });
              }}
              onNotchAdd={(notch) => {
                if (data.customization.notches.length < 2) {
                  updateCustomization({
                    notches: [...data.customization.notches, notch],
                  });
                }
              }}
              notches={data.customization.notches}
            />
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: Customize layout
  const renderStep3 = () => (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Customize your layout</h2>
      <p className="text-lg text-slate-600 mb-4">
        Most showers don't need changes. If your space has a slope, notch, or extra panel, add it here.
      </p>
      <p className="text-sm text-slate-500 mb-8">
        💡 Tip: Click on the door arc to change swing direction, or click on the panel to add notches.
      </p>

      {/* Interactive Preview */}
      <div className="mb-8 flex items-center justify-center bg-white rounded-lg shadow-lg p-8">
        {data.layout && (
          <ShowerConfigurationWithDimensions
            type={getTemplateType()}
            width={data.widthMm}
            height={data.heightMm}
            doorSwing={getDoorSwing()}
            floorRake={data.customization.rakes.floor.amountMm}
            floorRakeDirection={data.customization.rakes.floor.direction}
            leftWallRake={data.customization.rakes.wallLeft.amountMm}
            leftWallRakeDirection={data.customization.rakes.wallLeft.direction}
            notches={data.customization.notches}
            editable={true}
            interactive={true}
            onDimensionsChange={(width, height) => updateData({ widthMm: width, heightMm: height })}
            onDoorSwingChange={(swing) => {
              updateCustomization({
                door: { ...data.customization.door, opens: swing === 'in' ? 'in' : 'out' },
              });
            }}
            onNotchClick={(idx) => {
              const newNotches = [...data.customization.notches];
              newNotches.splice(idx, 1);
              updateCustomization({ notches: newNotches });
            }}
            onNotchAdd={(notch) => {
              if (data.customization.notches.length < 2) {
                updateCustomization({
                  notches: [...data.customization.notches, notch],
                });
              }
            }}
          />
        )}
      </div>

      {/* 3A: Door opening */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Door opening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>How should the door open?</Label>
            <RadioGroup
              value={data.customization.door.opens}
              onValueChange={(value) =>
                updateCustomization({
                  door: { ...data.customization.door, opens: value as 'out' | 'in' },
                })
              }
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="out" id="door-out" />
                <Label htmlFor="door-out">Out</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in" id="door-in" />
                <Label htmlFor="door-in">In</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label>Hinge side</Label>
            <RadioGroup
              value={data.customization.door.hingeSide}
              onValueChange={(value) =>
                updateCustomization({
                  door: { ...data.customization.door, hingeSide: value as 'left' | 'right' },
                })
              }
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="left" id="hinge-left" />
                <Label htmlFor="hinge-left">Left</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="right" id="hinge-right" />
                <Label htmlFor="hinge-right">Right</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* 3B: Extra panels */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Extra panels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="addInlineFixed"
              checked={data.customization.panels.addInlineFixed}
              onChange={(e) =>
                updateCustomization({
                  panels: {
                    ...data.customization.panels,
                    addInlineFixed: e.target.checked,
                  },
                })
              }
            />
            <Label htmlFor="addInlineFixed">Add inline fixed panel</Label>
          </div>
          {data.customization.panels.addInlineFixed && (
            <div className="ml-6 space-y-4">
              <div>
                <Label>Side</Label>
                <RadioGroup
                  value={data.customization.panels.inlineFixedSide}
                  onValueChange={(value) =>
                    updateCustomization({
                      panels: {
                        ...data.customization.panels,
                        inlineFixedSide: value as 'left' | 'right',
                      },
                    })
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="left" id="inline-left" />
                    <Label htmlFor="inline-left">Left</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="right" id="inline-right" />
                    <Label htmlFor="inline-right">Right</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="inlineWidth">Panel width (mm)</Label>
                <Input
                  id="inlineWidth"
                  type="number"
                  value={data.customization.panels.inlineFixedWidthMm}
                  onChange={(e) =>
                    updateCustomization({
                      panels: {
                        ...data.customization.panels,
                        inlineFixedWidthMm: Number(e.target.value),
                      },
                    })
                  }
                  className="mt-2"
                  min="100"
                  max="1000"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3C: Notches */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notches / cut-outs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="addNotch"
              checked={data.customization.notches.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  updateCustomization({
                    notches: [
                      {
                        panel: 'panel-door',
                        corner: 'bottom-left',
                        widthMm: 60,
                        heightMm: 40,
                      },
                    ],
                  });
                } else {
                  updateCustomization({ notches: [] });
                }
              }}
            />
            <Label htmlFor="addNotch">Add a notch</Label>
          </div>
          {data.customization.notches.length > 0 && (
            <div className="ml-6 space-y-4">
              {data.customization.notches.map((notch, idx) => (
                <div key={idx} className="border p-4 rounded space-y-4">
                  <div>
                    <Label>Which panel</Label>
                    <select
                      value={notch.panel}
                      onChange={(e) => {
                        const newNotches = [...data.customization.notches];
                        newNotches[idx].panel = e.target.value as any;
                        updateCustomization({ notches: newNotches });
                      }}
                      className="w-full mt-2 px-3 py-2 border rounded"
                    >
                      <option value="panel-door">Door</option>
                      <option value="panel-fixed">Fixed</option>
                      <option value="panel-return">Return</option>
                    </select>
                  </div>
                  <div>
                    <Label>Corner</Label>
                    <select
                      value={notch.corner}
                      onChange={(e) => {
                        const newNotches = [...data.customization.notches];
                        newNotches[idx].corner = e.target.value as any;
                        updateCustomization({ notches: newNotches });
                      }}
                      className="w-full mt-2 px-3 py-2 border rounded"
                    >
                      <option value="bottom-left">Bottom-left</option>
                      <option value="bottom-right">Bottom-right</option>
                      <option value="top-left">Top-left</option>
                      <option value="top-right">Top-right</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`notch-width-${idx}`}>Notch width (mm)</Label>
                      <Input
                        id={`notch-width-${idx}`}
                        type="number"
                        value={notch.widthMm}
                        onChange={(e) => {
                          const newNotches = [...data.customization.notches];
                          newNotches[idx].widthMm = Number(e.target.value);
                          updateCustomization({ notches: newNotches });
                        }}
                        className="mt-2"
                        min="10"
                        max="200"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`notch-height-${idx}`}>Notch height (mm)</Label>
                      <Input
                        id={`notch-height-${idx}`}
                        type="number"
                        value={notch.heightMm}
                        onChange={(e) => {
                          const newNotches = [...data.customization.notches];
                          newNotches[idx].heightMm = Number(e.target.value);
                          updateCustomization({ notches: newNotches });
                        }}
                        className="mt-2"
                        min="10"
                        max="200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3D: Slopes (Rakes) */}
      <Card>
        <CardHeader>
          <CardTitle>Slopes (Rakes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-slate-600">
            If everything is straight, leave these at 0.
          </p>

          {/* Floor rake */}
          <div className="space-y-4">
            <h4 className="font-medium">Floor rake</h4>
            <div>
              <Label htmlFor="floorRakeAmount">Floor rake amount (mm)</Label>
              <Input
                id="floorRakeAmount"
                type="number"
                value={data.customization.rakes.floor.amountMm}
                onChange={(e) =>
                  updateCustomization({
                    rakes: {
                      ...data.customization.rakes,
                      floor: {
                        ...data.customization.rakes.floor,
                        amountMm: Number(e.target.value),
                      },
                    },
                  })
                }
                className="mt-2"
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label>Direction</Label>
              <select
                value={data.customization.rakes.floor.direction}
                onChange={(e) =>
                  updateCustomization({
                    rakes: {
                      ...data.customization.rakes,
                      floor: {
                        ...data.customization.rakes.floor,
                        direction: e.target.value as any,
                      },
                    },
                  })
                }
                className="w-full mt-2 px-3 py-2 border rounded"
              >
                <option value="none">None</option>
                <option value="left">Down to the left</option>
                <option value="right">Down to the right</option>
                <option value="front">Down to the front</option>
                <option value="back">Down to the back</option>
              </select>
            </div>
          </div>

          {/* Wall rakes */}
          <div className="space-y-4">
            <h4 className="font-medium">Wall rakes</h4>
            <div>
              <Label htmlFor="wallLeftRake">Left wall rake (mm)</Label>
              <Input
                id="wallLeftRake"
                type="number"
                value={data.customization.rakes.wallLeft.amountMm}
                onChange={(e) =>
                  updateCustomization({
                    rakes: {
                      ...data.customization.rakes,
                      wallLeft: {
                        ...data.customization.rakes.wallLeft,
                        amountMm: Number(e.target.value),
                      },
                    },
                  })
                }
                className="mt-2"
                min="0"
                max="100"
              />
              <select
                value={data.customization.rakes.wallLeft.direction}
                onChange={(e) =>
                  updateCustomization({
                    rakes: {
                      ...data.customization.rakes,
                      wallLeft: {
                        ...data.customization.rakes.wallLeft,
                        direction: e.target.value as any,
                      },
                    },
                  })
                }
                className="w-full mt-2 px-3 py-2 border rounded"
              >
                <option value="none">None</option>
                <option value="in">Leans in at top</option>
                <option value="out">Leans out at top</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 4: Choose glass
  const renderStep4 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose your glass</h2>
      <p className="text-lg text-slate-600 mb-8">
        All our showers use toughened safety glass.
      </p>
      <RadioGroup
        value={data.glass}
        onValueChange={(value) => updateData({ glass: value as 'standard' | 'ultra-clear' })}
      >
        <Card className={`mb-4 cursor-pointer ${data.glass === 'standard' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="standard" id="glass-standard" />
              <Label htmlFor="glass-standard" className="flex-1 cursor-pointer">
                <div className="font-medium">Standard clear glass</div>
                <div className="text-sm text-slate-500">Included</div>
              </Label>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer ${data.glass === 'ultra-clear' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="ultra-clear" id="glass-ultra" />
              <Label htmlFor="glass-ultra" className="flex-1 cursor-pointer">
                <div className="font-medium">Ultra-clear glass</div>
                <div className="text-sm text-slate-500">Upgrade</div>
              </Label>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );

  // Step 5: Choose hardware finish
  const renderStep5 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose your hardware finish</h2>
      <p className="text-lg text-slate-600 mb-8">
        Applies to hinges and handle.
      </p>
      <RadioGroup
        value={data.finish}
        onValueChange={(value) => updateData({ finish: value as any })}
        className="grid grid-cols-2 gap-4"
      >
        {(['chrome', 'brushed-nickel', 'matte-black', 'brushed-brass'] as const).map((finish) => (
          <Card key={finish} className={`cursor-pointer ${data.finish === finish ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={finish} id={`finish-${finish}`} />
                <Label htmlFor={`finish-${finish}`} className="flex-1 cursor-pointer capitalize">
                  {finish.replace('-', ' ')}
                </Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );

  // Step 6: Choose handle
  const renderStep6 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose your handle</h2>
      <RadioGroup
        value={data.handle}
        onValueChange={(value) => updateData({ handle: value as 'standard' | 'premium' })}
      >
        <Card className={`mb-4 cursor-pointer ${data.handle === 'standard' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="standard" id="handle-standard" />
              <Label htmlFor="handle-standard" className="flex-1 cursor-pointer">
                <div className="font-medium">Standard handle</div>
                <div className="text-sm text-slate-500">Included</div>
              </Label>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer ${data.handle === 'premium' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="premium" id="handle-premium" />
              <Label htmlFor="handle-premium" className="flex-1 cursor-pointer">
                <div className="font-medium">Premium handle</div>
                <div className="text-sm text-slate-500">Upgrade</div>
              </Label>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );

  // Step 7: Choose hinges
  const renderStep7 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose your hinges</h2>
      <RadioGroup
        value={data.hinges}
        onValueChange={(value) => updateData({ hinges: value as 'standard' | 'premium' })}
      >
        <Card className={`mb-4 cursor-pointer ${data.hinges === 'standard' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="standard" id="hinges-standard" />
              <Label htmlFor="hinges-standard" className="flex-1 cursor-pointer">
                <div className="font-medium">Standard hinges</div>
                <div className="text-sm text-slate-500">Included</div>
              </Label>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer ${data.hinges === 'premium' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="premium" id="hinges-premium" />
              <Label htmlFor="hinges-premium" className="flex-1 cursor-pointer">
                <div className="font-medium">Premium hinges</div>
                <div className="text-sm text-slate-500">Upgrade</div>
              </Label>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );

  // Step 8: Review
  const renderStep8 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Review your shower</h2>
      <p className="text-sm text-slate-500 mb-8">
        Diagrams are for visual reference only. Final sizes confirmed during site measure.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-8">
          {data.layout && (
            <ShowerConfigurationWithDimensions
              type={getTemplateType()}
              width={data.widthMm}
              height={data.heightMm}
              doorSwing={getDoorSwing()}
              floorRake={data.customization.rakes.floor.amountMm}
              floorRakeDirection={data.customization.rakes.floor.direction}
              leftWallRake={data.customization.rakes.wallLeft.amountMm}
              leftWallRakeDirection={data.customization.rakes.wallLeft.direction}
              notches={data.customization.notches}
              editable={false}
            />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Layout:</strong> {data.layout && TEMPLATE_LABELS[data.layout]}</div>
              <div><strong>Size:</strong> {data.widthMm}mm × {data.heightMm}mm</div>
              <div><strong>Door opens:</strong> {data.customization.door.opens}</div>
              <div><strong>Glass:</strong> {data.glass === 'standard' ? 'Standard clear' : 'Ultra-clear'}</div>
              <div><strong>Finish:</strong> {data.finish.replace('-', ' ')}</div>
              <div><strong>Handle:</strong> {data.handle === 'standard' ? 'Standard' : 'Premium'}</div>
              <div><strong>Hinges:</strong> {data.hinges === 'standard' ? 'Standard' : 'Premium'}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Step 9: Contact details
  const renderStep9 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Get your quote</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="customer-name">Full name</Label>
          <Input
            id="customer-name"
            value={data.customer.name}
            onChange={(e) =>
              updateData({
                customer: { ...data.customer, name: e.target.value },
              })
            }
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label htmlFor="customer-email">Email</Label>
          <Input
            id="customer-email"
            type="email"
            value={data.customer.email}
            onChange={(e) =>
              updateData({
                customer: { ...data.customer, email: e.target.value },
              })
            }
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label htmlFor="customer-phone">Phone</Label>
          <Input
            id="customer-phone"
            type="tel"
            value={data.customer.phone}
            onChange={(e) =>
              updateData({
                customer: { ...data.customer, phone: e.target.value },
              })
            }
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label htmlFor="customer-postcode">Postcode</Label>
          <Input
            id="customer-postcode"
            value={data.customer.postcode}
            onChange={(e) =>
              updateData({
                customer: { ...data.customer, postcode: e.target.value },
              })
            }
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label htmlFor="customer-notes">Notes (optional)</Label>
          <Textarea
            id="customer-notes"
            value={data.customer.notes}
            onChange={(e) =>
              updateData({
                customer: { ...data.customer, notes: e.target.value },
              })
            }
            className="mt-2 min-h-[100px]"
            placeholder="Any additional information..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      case 8:
        return renderStep8();
      case 9:
        return renderStep9();
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    // TODO: Submit the design data
    console.log('Submitting design:', data);
    alert('Design submitted! (This is a placeholder - implement API call)');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress indicator */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s < step
                        ? 'bg-primary text-primary-foreground'
                        : s === step
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 9 && (
                    <div
                      className={`w-12 h-1 mx-1 ${
                        s < step ? 'bg-primary' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {step < 9 ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              Submit my design
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
