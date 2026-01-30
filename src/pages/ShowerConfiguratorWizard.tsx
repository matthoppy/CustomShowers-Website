/**
 * Shower Configurator Wizard
 * Step-by-step process following the user question flow specification
 * All existing templates are preserved and mapped to new layout options
 */

import { useState } from 'react';
import { ShowerConfiguration } from '@/components/designer/ShowerConfiguration';
import { PanelShapeProfile } from '@/components/designer/PanelFixed';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface DesignData {
  category: 'fixed-panel' | 'single-door' | 'inline' | 'square' | null;
  configType: 'door-only' | 'fixed-only' | 'door-fixed' | 'door-return' | 'custom';
  heightMm: number;
  doorWidthMm: number;
  fullWidthMm: number;
  configuration: {
    door: {
      swing: 'in' | 'out' | 'in-out';
      hingeSide: 'left' | 'right';
    };
    panels: {
      addInlineFixed: boolean;
      inlineFixedSide: 'left' | 'right';
      inlineFixedWidthMm: number;
      addReturn: boolean;
      returnSide: 'left' | 'right';
      returnWidthMm: number;
      inlineFixedRake: { dropMm: number; direction: 'left' | 'right' };
      returnRake: { dropMm: number; direction: 'left' | 'right' };
    };
    mounting: 'channel' | 'clamps';
    mountingSide: 'left' | 'right';
    fixedPanelWidthMm: number;
    notches: Array<{
      panel: 'panel-door' | 'panel-fixed' | 'panel-return';
      corner: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
      widthMm: number;
      heightMm: number;
    }>;
    rakes: {
      plumbEntryMethod: 'direct' | 'laser';
      laserDistanceBottom: number;
      laserDistanceTop: number;
      floor: { amountMm: number; direction: 'none' | 'left' | 'right' | 'front' | 'back' };
      wallLeft: { amountMm: number; direction: 'none' | 'in' | 'out' };
      wallRight: { amountMm: number; direction: 'none' | 'in' | 'out' };
    };
  };
  hardware: {
    handleType: 'knob' | 'pull';
    specificHandle: string;
    finish: 'chrome' | 'brushed-nickel' | 'matte-black' | 'brushed-brass';
  };
  glass: 'standard' | 'ultra-clear';
  customer: {
    name: string;
    email: string;
    phone: string;
    postcode: string;
    notes: string;
  };
  shapeProfile: PanelShapeProfile;
  slopeMode: boolean;
  slopedTop: { leftMm: number; rightMm: number };
  isFloorToCeiling: boolean;
}

const INITIAL_DATA: DesignData = {
  category: null,
  configType: 'door-only',
  heightMm: 2000,
  doorWidthMm: 650,
  fullWidthMm: 650,
  configuration: {
    door: {
      swing: 'out',
      hingeSide: 'left',
    },
    panels: {
      addInlineFixed: false,
      inlineFixedSide: 'left',
      inlineFixedWidthMm: 0,
      addReturn: false,
      returnSide: 'left',
      returnWidthMm: 0,
      inlineFixedRake: { dropMm: 0, direction: 'left' },
      returnRake: { dropMm: 0, direction: 'left' },
    },
    mounting: 'channel',
    mountingSide: 'left',
    fixedPanelWidthMm: 600,
    notches: [],
    rakes: {
      plumbEntryMethod: 'direct',
      laserDistanceBottom: 50,
      laserDistanceTop: 50,
      floor: { amountMm: 0, direction: 'none' },
      wallLeft: { amountMm: 0, direction: 'none' },
      wallRight: { amountMm: 0, direction: 'none' },
    },
  },
  hardware: {
    handleType: 'pull',
    specificHandle: 'standard',
    finish: 'chrome',
  },
  glass: 'standard',
  customer: {
    name: '',
    email: '',
    phone: '',
    postcode: '',
    notes: '',
  },
  shapeProfile: 'standard' as PanelShapeProfile,
  slopeMode: false,
  slopedTop: { leftMm: 0, rightMm: 0 },
  isFloorToCeiling: false,
};

function getShapeIconPath(shape: PanelShapeProfile): string {
  const w = 30; // mini width
  const h = 50; // mini height
  const n = 10; // mini notch

  switch (shape) {
    case 'notch-bl':
      return `M 0 0 L ${w} 0 L ${w} ${h} L ${n} ${h} L ${n} ${h - n} L 0 ${h - n} Z`;
    case 'notch-br':
      return `M 0 0 L ${w} 0 L ${w} ${h - n} L ${w - n} ${h - n} L ${w - n} ${h} L 0 ${h} Z`;
    case 'double-notch-bl':
      return `M 0 0 L ${w} 0 L ${w} ${h} L ${n * 2} ${h} L ${n * 2} ${h - n} L ${n} ${h - n} L ${n} ${h - n * 2} L 0 ${h - n * 2} Z`;
    case 'double-notch-br':
      return `M 0 0 L ${w} 0 L ${w} ${h - n * 2} L ${w - n} ${h - n * 2} L ${w - n} ${h - n} L ${w - n * 2} ${h - n} L ${w - n * 2} ${h} L 0 ${h} Z`;
    case 'notch-bl-br':
      return `M 0 0 L ${w} 0 L ${w} ${h - n} L ${w - n} ${h - n} L ${w - n} ${h} L ${n} ${h} L ${n} ${h - n} L 0 ${h - n} Z`;
    default:
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }
}

const CollapsibleCard = ({
  id,
  title,
  headline,
  isOpen,
  onToggle,
  onNext,
  children
}: {
  id: string;
  title: string;
  headline?: string;
  isOpen: boolean;
  onToggle: () => void;
  onNext: () => void;
  children: React.ReactNode
}) => {
  return (
    <Card className={`overflow-hidden border-slate-200 shadow-sm transition-all duration-300 ${isOpen ? 'ring-1 ring-primary/20 bg-white' : 'bg-slate-50/30'}`}>
      <div
        onClick={onToggle}
        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'bg-slate-50/50 border-b' : 'hover:bg-slate-50'}`}
      >
        <div className="flex flex-col min-w-0 pr-4">
          <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</Label>
          {!isOpen && headline && (
            <span className="text-xs font-semibold text-slate-700 truncate">{headline}</span>
          )}
          {isOpen && (
            <span className="text-xs font-bold text-slate-900">{title}</span>
          )}
        </div>
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 bg-slate-100' : 'bg-white'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-slate-500">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="text-[10px] font-bold uppercase tracking-tight text-primary hover:text-primary hover:bg-primary/5 h-7"
            >
              Next Section
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default function ShowerConfiguratorWizard() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<DesignData>(INITIAL_DATA);
  const [openSection, setOpenSection] = useState<string | null>('floor-to-ceiling');

  const handleSectionToggle = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const handleNextSection = (id: string) => {
    const sections = ['floor-to-ceiling', 'mounting', 'shape', 'dimensions', 'rakes'];
    const currentIndex = sections.indexOf(id);
    if (currentIndex < sections.length - 1) {
      setOpenSection(sections[currentIndex + 1]);
    } else {
      setOpenSection(null);
    }
  };

  const updateData = (updates: Partial<DesignData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const updateConfiguration = (updates: Partial<DesignData['configuration']>) => {
    setData((prev) => ({
      ...prev,
      configuration: { ...prev.configuration, ...updates },
    }));
  };


  const canProceed = () => {
    // Fixed Panel flow validation
    if (data.category === 'fixed-panel') {
      switch (step) {
        case 1: return data.category !== null;
        case 2: return data.heightMm >= 1000 && data.heightMm <= 3000 && data.configuration.fixedPanelWidthMm >= 100;
        default: return true;
      }
    }

    // Default flow validation
    switch (step) {
      case 1:
        return data.category !== null;
      case 2:
        return data.heightMm >= 1000 && data.heightMm <= 3000;
      case 3:
        return data.doorWidthMm >= 300 || data.configType === 'fixed-only';
      default:
        return true;
    }
  };

  // Note: getTotalSteps is defined later but referenced here via closure
  const nextStep = () => {
    const totalSteps = data.category === 'fixed-panel' ? 6 : 7;
    if (canProceed() && step < totalSteps) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  // Step 1: Selection Category
  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">What type of shower are you building?</h2>
      <p className="text-lg text-slate-600 mb-8">Select a category to start your design.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { id: 'fixed-panel', label: 'Fixed Panel', desc: 'A single stationary glass panel.' },
          { id: 'single-door', label: 'Single Door', desc: 'A standalone swinging door.' },
          { id: 'inline', label: 'Inline Shower', desc: 'Door and fixed panels in a straight line.' },
          { id: 'square', label: 'Square/Corner', desc: 'Entry door with a 90° return panel.' },
        ].map((cat) => (
          <Card
            key={cat.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${data.category === cat.id ? 'ring-2 ring-primary border-primary' : ''}`}
            onClick={() => updateData({ category: cat.id as any })}
          >
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">{cat.label}</h3>
              <p className="text-slate-500 text-sm">{cat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Step 2: Height
  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">How tall is the glass?</h2>
      <p className="text-lg text-slate-600 mb-8">
        This is usually measured to a grout line in a tile and above the shower head.
      </p>

      <Card className="mb-8">
        <CardContent className="p-6">
          <Label htmlFor="height" className="text-base font-medium">Height (mm)</Label>
          <Input
            id="height"
            type="number"
            value={data.heightMm || ''}
            onChange={(e) => updateData({ heightMm: Number(e.target.value) || 0 })}
            placeholder="2000"
            className="mt-4 text-xl h-14"
            min="1000"
            max="3000"
          />
          <p className="text-sm text-slate-500 mt-4">
            Standard height is usually between 2000mm and 2100mm.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <ShowerConfiguration
            category="inline"
            baseType="fixed-panel"
            width={280}
            height={360}
            realHeightMm={data.heightMm}
            mountingType={data.configuration.mounting}
          />
        </div>
      </div>
    </div>
  );

  // Step 3: Configuration Type & Width
  const renderStep3 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Configuration & Width</h2>
      <p className="text-lg text-slate-600 mb-8">
        What is the primary configuration, and what is the door width?
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Config Type</Label>
            <RadioGroup
              value={data.configType}
              onValueChange={(value) => updateData({ configType: value as any })}
              className="grid gap-4 mt-2"
            >
              {[
                { id: 'door-only', label: 'Door Only' },
                { id: 'fixed-only', label: 'Fixed Panel Only' },
                { id: 'door-fixed', label: 'Door + Fixed Panel' },
                { id: 'door-return', label: 'Door + Return Panel' },
              ].map((cfg) => (
                <Label
                  key={cfg.id}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${data.configType === cfg.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-slate-50'
                    }`}
                >
                  <RadioGroupItem value={cfg.id} />
                  <span className="font-medium">{cfg.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {data.configType !== 'fixed-only' && (
            <div>
              <Label htmlFor="doorWidth" className="text-base font-medium">Door Width (mm)</Label>
              <Input
                id="doorWidth"
                type="number"
                value={data.doorWidthMm || ''}
                onChange={(e) => updateData({ doorWidthMm: Number(e.target.value) || 0 })}
                className="mt-2"
                min="300"
                max="1000"
              />
              <p className="text-sm text-slate-500 mt-1">Standard door size is 650mm.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-inner p-4 border flex items-center justify-center">
          <ShowerConfiguration
            category="inline"
            baseType={data.configType === 'door-return' ? 'single' : 'fixed-panel'}
            width={280}
            height={360}
            realHeightMm={data.heightMm}
            realWidthMm={data.configType === 'fixed-only' ? 800 : data.doorWidthMm}
            mountingType={data.configuration.mounting}
          />
        </div>
      </div>
    </div>
  );

  // Step 4: Door Config (Swing & Direction)
  const renderStep4 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Door Configuration</h2>
      <p className="text-lg text-slate-600 mb-8">
        Which way should the door swing?
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
            <Label className="text-base font-medium">Swing Direction</Label>
            <RadioGroup
              value={data.configuration.door.swing}
              onValueChange={(val) => updateConfiguration({ door: { ...data.configuration.door, swing: val as any } })}
              className="grid gap-4 mt-2"
            >
              {[
                { id: 'out', label: 'Opens Only Outwards' },
                { id: 'in-out', label: 'Opens Both Ways (In & Out)' },
              ].map((opt) => (
                <Label
                  key={opt.id}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${data.configuration.door.swing === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-slate-50'
                    }`}
                >
                  <RadioGroupItem value={opt.id} />
                  <span className="font-medium">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">Hinge Side</Label>
            <RadioGroup
              value={data.configuration.door.hingeSide}
              onValueChange={(val) => updateConfiguration({ door: { ...data.configuration.door, hingeSide: val as any } })}
              className="flex gap-4 mt-2"
            >
              <Label className={`flex items-center space-x-2 p-3 border rounded cursor-pointer transition-colors ${data.configuration.door.hingeSide === 'left' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'
                }`}>
                <RadioGroupItem value="left" />
                <span>Left Side</span>
              </Label>
              <Label className={`flex items-center space-x-2 p-3 border rounded cursor-pointer transition-colors ${data.configuration.door.hingeSide === 'right' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'
                }`}>
                <RadioGroupItem value="right" />
                <span>Right Side</span>
              </Label>
            </RadioGroup>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-inner p-4 border flex items-center justify-center">
          <ShowerConfiguration
            category="inline"
            baseType="single"
            doorVariant={data.configuration.door.hingeSide}
            width={280}
            height={360}
            realHeightMm={data.heightMm}
            realWidthMm={data.doorWidthMm}
            mountingType={data.configuration.mounting}
          />
        </div>
      </div>
    </div>
  );

  // Step 5: Mounting (Channel/Clamps)
  const renderStep5 = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Mounting System</h2>
      <p className="text-lg text-slate-600 mb-8">Choose how the glass is fixed to your walls.</p>

      <RadioGroup
        value={data.configuration.mounting}
        onValueChange={(val) => updateConfiguration({ mounting: val as any })}
        className="grid gap-6"
      >
        <Card className={`cursor-pointer transition-all ${data.configuration.mounting === 'channel' ? 'ring-2 ring-primary border-primary' : 'hover:border-slate-300'}`}>
          <CardContent className="p-6 flex items-start space-x-4">
            <RadioGroupItem value="channel" className="mt-1" />
            <div>
              <Label className="text-lg font-bold cursor-pointer">U-Channel (Standard)</Label>
              <p className="text-slate-500 mt-1">Slim aluminium profile for a watertight seal. Most popular and cost-effective.</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all ${data.configuration.mounting === 'clamps' ? 'ring-2 ring-primary border-primary' : 'hover:border-slate-300'}`}>
          <CardContent className="p-6 flex items-start space-x-4">
            <RadioGroupItem value="clamps" className="mt-1" />
            <div>
              <Label className="text-lg font-bold cursor-pointer">Glass Clamps (Premium)</Label>
              <p className="text-slate-500 mt-1">Minimal hardware for a fully frameless look. Requires slight gap for silicone.</p>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );

  // Step 6: Hardware (Handle & Finish)
  const renderStep6 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Hardware & Finish</h2>
      <p className="text-lg text-slate-600 mb-8">Final touches for your shower.</p>

      <div className="space-y-8">
        <div>
          <Label className="text-lg font-semibold block mb-4">Choose handle style</Label>
          <RadioGroup
            value={data.hardware.handleType}
            onValueChange={(val) => setData(prev => ({ ...prev, hardware: { ...prev.hardware, handleType: val as any } }))}
            className="grid grid-cols-2 gap-4"
          >
            <Card className={`cursor-pointer ${data.hardware.handleType === 'pull' ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-6 flex items-center space-x-3">
                <RadioGroupItem value="pull" />
                <span className="font-medium">Pull Handle</span>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer ${data.hardware.handleType === 'knob' ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-6 flex items-center space-x-3">
                <RadioGroupItem value="knob" />
                <span className="font-medium">Knobs</span>
              </CardContent>
            </Card>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-lg font-semibold block mb-4">Choose finish</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['chrome', 'brushed-nickel', 'matte-black', 'brushed-brass'] as const).map((finish) => (
              <button
                key={finish}
                onClick={() => setData(prev => ({ ...prev, hardware: { ...prev.hardware, finish } }))}
                className={`p-4 border rounded-lg text-center transition-all ${data.hardware.finish === finish ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-slate-300'
                  }`}
              >
                <div className={`w-12 h-12 mx-auto rounded-full mb-2 shadow-inner ${finish === 'chrome' ? 'bg-slate-200' :
                  finish === 'brushed-nickel' ? 'bg-slate-400' :
                    finish === 'matte-black' ? 'bg-slate-900' :
                      'bg-amber-500' // brushed brass
                  }`} />
                <span className="text-sm font-medium capitalize">{finish.replace('-', ' ')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 7: Final Review & Contact
  const renderStep7 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Review & Request Quote</h2>
      <p className="text-lg text-slate-600 mb-8">
        Check your details below and submit to receive a professional quote.
      </p>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Shower Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Configuration</span>
                <span className="font-semibold capitalize">{data.configType.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Height</span>
                <span className="font-semibold">{data.heightMm}mm</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Door Width</span>
                <span className="font-semibold">{data.doorWidthMm}mm</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Mounting</span>
                <span className="font-semibold capitalize">{data.configuration.mounting}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Hardware</span>
                <span className="font-semibold capitalize">{data.hardware.handleType} ({data.hardware.finish.replace('-', ' ')})</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Your Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="cust-name">Full Name</Label>
                <Input id="cust-name" value={data.customer.name} onChange={e => updateData({ customer: { ...data.customer, name: e.target.value } })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cust-email">Email</Label>
                <Input id="cust-email" type="email" value={data.customer.email} onChange={e => updateData({ customer: { ...data.customer, email: e.target.value } })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cust-phone">Phone</Label>
                <Input id="cust-phone" type="tel" value={data.customer.phone} onChange={e => updateData({ customer: { ...data.customer, phone: e.target.value } })} className="mt-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-4 flex flex-col items-center justify-center">
          <ShowerConfiguration
            category="inline"
            baseType={data.configType === 'door-return' ? 'single' : 'fixed-panel'}
            width={280}
            height={360}
            realHeightMm={data.heightMm}
            realWidthMm={data.doorWidthMm}
            mountingType={data.configuration.mounting}
          />
          <p className="mt-4 text-sm text-slate-400 text-center italic">
            *Visual representation only. Final sizes confirmed during survey.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 2 Combined (Fixed Panel): Size & Mounting & Shapes
  const renderFixedPanel_Step2Combined = () => (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Size, Shape & Mounting</h2>
      <p className="text-lg text-slate-600 mb-6">Enter measurements and configure your panel's shape.</p>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          {/* Floor to Ceiling Section */}
          <CollapsibleCard
            id="floor-to-ceiling"
            title="Height Type"
            headline={data.isFloorToCeiling ? "Floor to Ceiling Screen" : "Standard Height Screen"}
            isOpen={openSection === 'floor-to-ceiling'}
            onToggle={() => handleSectionToggle('floor-to-ceiling')}
            onNext={() => handleNextSection('floor-to-ceiling')}
          >
            <div className="space-y-4">
              <Label className="text-xs font-semibold mb-2 block">Is this a Floor to Ceiling screen?</Label>
              <RadioGroup
                value={data.isFloorToCeiling ? "yes" : "no"}
                onValueChange={(val) => updateData({ isFloorToCeiling: val === 'yes' })}
                className="grid grid-cols-2 gap-3"
              >
                <Label className={`flex items-center space-x-2 p-3 border rounded cursor-pointer transition-colors ${data.isFloorToCeiling ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
                  <RadioGroupItem value="yes" />
                  <span className="text-xs font-medium">Yes (Full Height)</span>
                </Label>
                <Label className={`flex items-center space-x-2 p-3 border rounded cursor-pointer transition-colors ${!data.isFloorToCeiling ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
                  <RadioGroupItem value="no" />
                  <span className="text-xs font-medium">No (Standard)</span>
                </Label>
              </RadioGroup>
              <p className="text-[10px] text-slate-500 bg-blue-50/50 p-2 rounded border border-blue-100">
                Floor to ceiling screens automatically include a top channel for structural support.
              </p>
            </div>
          </CollapsibleCard>

          <CollapsibleCard
            id="mounting"
            title="Mounting & Direction"
            headline={`${data.configuration.mounting === 'channel' ? 'U-Channel' : 'Clamps'} on ${data.configuration.mountingSide} side ${data.isFloorToCeiling ? '+ Ceiling Channel' : ''}`}
            isOpen={openSection === 'mounting'}
            onToggle={() => handleSectionToggle('mounting')}
            onNext={() => handleNextSection('mounting')}
          >
            <div className="space-y-6">
              <div>
                <Label className="text-xs font-semibold mb-3 block">Fixing Method</Label>
                <RadioGroup
                  value={data.configuration.mounting}
                  onValueChange={(val) => updateConfiguration({ mounting: val as any })}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label className={`flex items-center space-x-2 p-2.5 border rounded cursor-pointer transition-colors ${data.configuration.mounting === 'channel' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
                    <RadioGroupItem value="channel" />
                    <span className="text-xs font-medium">U-Channel</span>
                  </Label>
                  <Label className={`flex items-center space-x-2 p-2.5 border rounded cursor-pointer transition-colors ${data.configuration.mounting === 'clamps' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
                    <RadioGroupItem value="clamps" />
                    <span className="text-xs font-medium">Clamps</span>
                  </Label>
                </RadioGroup>
                {data.isFloorToCeiling && (
                  <p className="text-[10px] text-primary font-medium mt-2 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    Ceiling channel is used for top mounting.
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold mb-3 block">Fixing Wall</Label>
                <RadioGroup
                  value={data.configuration.mountingSide}
                  onValueChange={(val) => updateConfiguration({ mountingSide: val as any })}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label className={`flex items-center space-x-2 p-2.5 border rounded cursor-pointer transition-colors ${data.configuration.mountingSide === 'left' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
                    <RadioGroupItem value="left" />
                    <span className="text-xs font-medium">Left Wall</span>
                  </Label>
                  <Label className={`flex items-center space-x-2 p-2.5 border rounded cursor-pointer transition-colors ${data.configuration.mountingSide === 'right' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
                    <RadioGroupItem value="right" />
                    <span className="text-xs font-medium">Right Wall</span>
                  </Label>
                </RadioGroup>
              </div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard
            id="shape"
            title="Panel Shape"
            headline={data.shapeProfile === 'standard' ? "Rectangle" : `Notched (${data.shapeProfile})`}
            isOpen={openSection === 'shape'}
            onToggle={() => handleSectionToggle('shape')}
            onNext={() => handleNextSection('shape')}
          >
            <div className="grid grid-cols-3 gap-3">
              {(['standard', 'notch-bl', 'notch-br', 'double-notch-bl', 'double-notch-br', 'notch-bl-br'] as PanelShapeProfile[]).map((shape) => (
                <div
                  key={shape}
                  onClick={() => updateData({ shapeProfile: shape })}
                  className={`relative p-2 border rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${data.shapeProfile === shape ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}
                >
                  <svg width="40" height="60" viewBox="0 0 30 50" fill="none" className="stroke-slate-400 group-hover:stroke-slate-600 transition-colors">
                    <path d={getShapeIconPath(shape)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {data.shapeProfile === shape && (
                      <path d={getShapeIconPath(shape)} stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                  <span className="text-[8px] font-bold uppercase text-slate-500 text-center leading-tight">
                    {shape === 'standard' ? 'Rectangle' : shape.replace('notch-', '').replace('-', ' ')}
                  </span>
                  {data.shapeProfile === shape && (
                    <div className="absolute top-1 right-1">
                      <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleCard>

          <CollapsibleCard
            id="dimensions"
            title="Panel Measurements"
            headline={`${data.heightMm}mm H x ${data.configuration.fixedPanelWidthMm}mm W`}
            isOpen={openSection === 'dimensions'}
            onToggle={() => handleSectionToggle('dimensions')}
            onNext={() => handleNextSection('dimensions')}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">H</span>
                    <Label htmlFor="fp-height" className="text-xs font-semibold">Total Height (mm)</Label>
                  </div>
                  <Input
                    id="fp-height"
                    type="number"
                    value={data.heightMm || ''}
                    onChange={(e) => updateData({ heightMm: Number(e.target.value) || 0 })}
                    className="h-8 text-xs ml-7 mt-1"
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">W</span>
                    <Label htmlFor="fp-width" className="text-xs font-semibold">Total Width (mm)</Label>
                  </div>
                  <Input
                    id="fp-width"
                    type="number"
                    value={data.configuration.fixedPanelWidthMm || ''}
                    onChange={(e) => updateConfiguration({ fixedPanelWidthMm: Number(e.target.value) || 0 })}
                    className="h-8 text-xs ml-7 mt-1"
                    placeholder="800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Measurements</Label>
                  <span className="text-[9px] text-slate-400 italic">Refer to labels on diagram</span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded border-2 border-primary text-primary text-[10px] font-bold flex items-center justify-center">L</span>
                      <Label className="text-xs font-medium">Top Left Offset</Label>
                    </div>
                    <Input
                      type="number"
                      value={data.slopedTop.leftMm || ''}
                      onChange={(e) => updateData({ slopedTop: { ...data.slopedTop, leftMm: Number(e.target.value) || 0 } })}
                      className="h-8 text-xs ml-7 w-20"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded border-2 border-primary text-primary text-[10px] font-bold flex items-center justify-center">R</span>
                      <Label className="text-xs font-medium">Top Right Offset</Label>
                    </div>
                    <Input
                      type="number"
                      value={data.slopedTop.rightMm || ''}
                      onChange={(e) => updateData({ slopedTop: { ...data.slopedTop, rightMm: Number(e.target.value) || 0 } })}
                      className="h-8 text-xs ml-7 w-20"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Computed Top Width</span>
                    <span className="text-[10px] font-mono font-bold text-primary">
                      {Math.max(100, data.configuration.fixedPanelWidthMm - data.slopedTop.leftMm - data.slopedTop.rightMm)}mm
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 italic leading-tight">
                    Top width is automatically calculated based on Total Width and Top Offsets.
                  </p>
                </div>

                {data.shapeProfile !== 'standard' && (
                  <div className="text-[10px] text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                    <p className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Shape <strong>{data.shapeProfile}</strong> uses standard notch sizes by default.
                    </p>
                    <p className="mt-1 opacity-70">
                      Measurement labels (A, B, C...) on the diagram show current calculated segments. Full manual control coming.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard
            id="rakes"
            title="Rakes & Out of Square"
            headline={
              data.configuration.rakes.floor.amountMm > 0 ||
                (data.configuration.mountingSide === 'left' ? data.configuration.rakes.wallLeft.amountMm > 0 : data.configuration.rakes.wallRight.amountMm > 0)
                ? "Active Rakes" : "All plumb/level"
            }
            isOpen={openSection === 'rakes'}
            onToggle={() => handleSectionToggle('rakes')}
            onNext={() => handleNextSection('rakes')}
          >
            <div className="space-y-5">
              <div className="p-3 bg-slate-50 rounded-lg border space-y-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Plumb Entry Method</Label>
                    <RadioGroup
                      value={data.configuration.rakes.plumbEntryMethod}
                      onValueChange={(val) => updateConfiguration({ rakes: { ...data.configuration.rakes, plumbEntryMethod: val as any } })}
                      className="flex gap-2"
                    >
                      <Label className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-full cursor-pointer transition-all ${data.configuration.rakes.plumbEntryMethod === 'direct' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-slate-100'}`}>
                        <RadioGroupItem value="direct" className="w-3 h-3" />
                        <span className="text-[10px] font-bold">Direct Rake</span>
                      </Label>
                      <Label className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-full cursor-pointer transition-all ${data.configuration.rakes.plumbEntryMethod === 'laser' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-slate-100'}`}>
                        <RadioGroupItem value="laser" className="w-3 h-3" />
                        <span className="text-[10px] font-bold">Laser Tool</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {data.configuration.rakes.plumbEntryMethod === 'laser' ? (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400">Laser Distance (Bottom)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={data.configuration.rakes.laserDistanceBottom}
                            onChange={(e) => {
                              const bottom = Number(e.target.value) || 0;
                              const top = data.configuration.rakes.laserDistanceTop;
                              const amount = Math.abs(top - bottom);
                              const direction = top === bottom ? 'none' : (top > bottom ? 'out' : 'in');
                              const side = data.configuration.mountingSide;

                              updateConfiguration({
                                rakes: {
                                  ...data.configuration.rakes,
                                  laserDistanceBottom: bottom,
                                  [side === 'left' ? 'wallLeft' : 'wallRight']: { amountMm: amount, direction }
                                }
                              });
                            }}
                            className="h-8 text-xs font-bold"
                          />
                          <span className="text-[10px] font-bold text-slate-400">mm</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400">Laser Distance (Top)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={data.configuration.rakes.laserDistanceTop}
                            onChange={(e) => {
                              const top = Number(e.target.value) || 0;
                              const bottom = data.configuration.rakes.laserDistanceBottom;
                              const amount = Math.abs(top - bottom);
                              const direction = top === bottom ? 'none' : (top > bottom ? 'out' : 'in');
                              const side = data.configuration.mountingSide;

                              updateConfiguration({
                                rakes: {
                                  ...data.configuration.rakes,
                                  laserDistanceTop: top,
                                  [side === 'left' ? 'wallLeft' : 'wallRight']: { amountMm: amount, direction }
                                }
                              });
                            }}
                            className="h-8 text-xs font-bold"
                          />
                          <span className="text-[10px] font-bold text-slate-400">mm</span>
                        </div>
                      </div>
                      <p className="col-span-2 text-[10px] text-primary bg-primary/5 p-2 rounded-md italic">
                        The wall leans <b>{Math.abs(data.configuration.rakes.laserDistanceTop - data.configuration.rakes.laserDistanceBottom)}mm {data.configuration.rakes.laserDistanceTop > data.configuration.rakes.laserDistanceBottom ? 'OUT (away from glass)' : (data.configuration.rakes.laserDistanceTop < data.configuration.rakes.laserDistanceBottom ? 'IN (towards glass)' : '')}</b>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-8 bg-slate-400 rounded-full" />
                        <div>
                          <Label className="text-xs font-bold block">
                            {data.configuration.mountingSide === 'left' ? 'Left Wall Plumb' : 'Right Wall Plumb'}
                          </Label>
                          <span className="text-[10px] text-slate-500">Is the wall leaning in or out?</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={data.configuration.mountingSide === 'left' ? (data.configuration.rakes.wallLeft.amountMm || '') : (data.configuration.rakes.wallRight.amountMm || '')}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            if (data.configuration.mountingSide === 'left') {
                              updateConfiguration({ rakes: { ...data.configuration.rakes, wallLeft: { ...data.configuration.rakes.wallLeft, amountMm: val } } });
                            } else {
                              updateConfiguration({ rakes: { ...data.configuration.rakes, wallRight: { ...data.configuration.rakes.wallRight, amountMm: val } } });
                            }
                          }}
                          className="w-16 h-8 text-xs text-center"
                          placeholder="0"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">mm</span>
                      </div>
                    </div>
                  )}
                </div>

                {(data.configuration.mountingSide === 'left' ? data.configuration.rakes.wallLeft.amountMm > 0 : data.configuration.rakes.wallRight.amountMm > 0) && (
                  <div className="flex gap-2 ml-3.5">
                    {data.configuration.mountingSide === 'left' ? (
                      <>
                        <Button
                          variant={data.configuration.rakes.wallLeft.direction === 'out' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateConfiguration({ rakes: { ...data.configuration.rakes, wallLeft: { ...data.configuration.rakes.wallLeft, direction: 'out' } } })}
                          className="h-7 text-[9px] px-3 font-bold uppercase tracking-wide flex items-center gap-2"
                        >
                          <span className="text-[12px]">←</span>
                          Out (Leaning Left)
                        </Button>
                        <Button
                          variant={data.configuration.rakes.wallLeft.direction === 'in' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateConfiguration({ rakes: { ...data.configuration.rakes, wallLeft: { ...data.configuration.rakes.wallLeft, direction: 'in' } } })}
                          className="h-7 text-[9px] px-3 font-bold uppercase tracking-wide flex items-center gap-2"
                        >
                          <span className="text-[12px]">→</span>
                          In (Leaning Right)
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant={data.configuration.rakes.wallRight.direction === 'in' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateConfiguration({ rakes: { ...data.configuration.rakes, wallRight: { ...data.configuration.rakes.wallRight, direction: 'in' } } })}
                          className="h-7 text-[9px] px-3 font-bold uppercase tracking-wide flex items-center gap-2"
                        >
                          <span className="text-[12px]">→</span>
                          In (Leaning Right)
                        </Button>
                        <Button
                          variant={data.configuration.rakes.wallRight.direction === 'out' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateConfiguration({ rakes: { ...data.configuration.rakes, wallRight: { ...data.configuration.rakes.wallRight, direction: 'out' } } })}
                          className="h-7 text-[9px] px-3 font-bold uppercase tracking-wide flex items-center gap-2"
                        >
                          <span className="text-[12px]">←</span>
                          Out (Leaning Left)
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Floor Level Fall */}
              <div className="p-3 bg-slate-50 rounded-lg border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1.5 bg-slate-400 rounded-full" />
                    <div>
                      <Label className="text-xs font-bold block">Floor Level Fall</Label>
                      <span className="text-[10px] text-slate-500">Fall across the tray width</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={data.configuration.rakes.floor.amountMm || ''}
                      onChange={(e) => updateConfiguration({ rakes: { ...data.configuration.rakes, floor: { ...data.configuration.rakes.floor, amountMm: Number(e.target.value) || 0 } } })}
                      className="w-16 h-8 text-xs text-center"
                      placeholder="0"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">mm</span>
                  </div>
                </div>

                {data.configuration.rakes.floor.amountMm > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant={data.configuration.rakes.floor.direction === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateConfiguration({ rakes: { ...data.configuration.rakes, floor: { ...data.configuration.rakes.floor, direction: 'right' } } })}
                      className="h-7 text-[9px] px-3 font-bold uppercase tracking-wide flex items-center gap-2"
                    >
                      <span className="text-[12px]">↑R</span>
                      Tray is lower on Left
                    </Button>
                    <Button
                      variant={data.configuration.rakes.floor.direction === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateConfiguration({ rakes: { ...data.configuration.rakes, floor: { ...data.configuration.rakes.floor, direction: 'left' } } })}
                      className="h-7 text-[9px] px-3 font-bold uppercase tracking-wide flex items-center gap-2"
                    >
                      <span className="text-[12px]">↑L</span>
                      Tray is lower on Right
                    </Button>
                  </div>
                )}
                <p className="text-[9px] text-slate-400 italic">"Tray is lower on Right" means the Left side of the tray is higher.</p>
              </div>
            </div>
          </CollapsibleCard>
        </div>

        {/* Diagram Column - Border removed, background subtle */}
        <div className="flex flex-col items-center justify-center min-h-[450px] p-0 sticky top-8">
          <ShowerConfiguration
            category="inline"
            baseType="fixed-panel"
            width={320}
            height={400}
            realHeightMm={data.heightMm}
            realWidthMm={data.configuration.fixedPanelWidthMm}
            onHeightClick={() => {
              const el = document.getElementById('fp-height') as HTMLInputElement;
              if (el) { el.focus(); el.select(); }
            }}
            onWidthClick={() => {
              const el = document.getElementById('fp-width') as HTMLInputElement;
              if (el) { el.focus(); el.select(); }
            }}
            floorRake={data.configuration.rakes.floor.amountMm > 0 ? { amount: data.configuration.rakes.floor.amountMm * 0.13, direction: data.configuration.rakes.floor.direction as any } : undefined}
            mountingType={data.configuration.mounting}
            mountingSide={data.configuration.mountingSide}
            shapeProfile={data.shapeProfile}
            slopedTop={data.slopedTop}
            isActive={false} // Orange highlight logic removed
          />

          <p className="mt-2 text-[10px] text-slate-400 italic">Click dimensions to edit</p>
        </div>
      </div>
    </div>
  );

  // Step 3 (Fixed Panel): Hardware Finish
  const renderFixedPanel_Step3_Finish = () => (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">What finish would you like?</h2>
      <p className="text-lg text-slate-600 mb-8">Select the colour for your mounting hardware.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['chrome', 'brushed-nickel', 'matte-black', 'brushed-brass'] as const).map((finish) => (
          <button
            key={finish}
            onClick={() => setData(prev => ({ ...prev, hardware: { ...prev.hardware, finish } }))}
            className={`p-6 border rounded-lg text-center transition-all ${data.hardware.finish === finish ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-slate-300 hover:shadow'}`}
          >
            <div className={`w-16 h-16 mx-auto rounded-full mb-3 shadow-inner ${finish === 'chrome' ? 'bg-slate-200' :
              finish === 'brushed-nickel' ? 'bg-slate-400' :
                finish === 'matte-black' ? 'bg-slate-900' :
                  'bg-amber-500'
              }`} />
            <span className="text-sm font-medium capitalize">{finish.replace('-', ' ')}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 4 (Fixed Panel): Review & Contact
  const renderFixedPanel_Step4_Review = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Review & Request Quote</h2>
      <p className="text-lg text-slate-600 mb-8">Check your details and submit for a professional quote.</p>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Fixed Panel Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Height</span>
                <span className="font-semibold">{data.heightMm}mm</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Width</span>
                <span className="font-semibold">{data.configuration.fixedPanelWidthMm}mm</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Mounting</span>
                <span className="font-semibold capitalize">{data.configuration.mounting} ({data.configuration.mountingSide})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Finish</span>
                <span className="font-semibold capitalize">{data.hardware.finish.replace('-', ' ')}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Your Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fp-name">Full Name</Label>
                <Input id="fp-name" value={data.customer.name} onChange={e => updateData({ customer: { ...data.customer, name: e.target.value } })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="fp-email">Email</Label>
                <Input id="fp-email" type="email" value={data.customer.email} onChange={e => updateData({ customer: { ...data.customer, email: e.target.value } })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="fp-phone">Phone</Label>
                <Input id="fp-phone" type="tel" value={data.customer.phone} onChange={e => updateData({ customer: { ...data.customer, phone: e.target.value } })} className="mt-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-4 flex flex-col items-center justify-center">
          <ShowerConfiguration
            category="inline"
            baseType="fixed-panel"
            width={280}
            height={360}
            realHeightMm={data.heightMm}
            realWidthMm={data.configuration.fixedPanelWidthMm}
            mountingType={data.configuration.mounting}
            mountingSide={data.configuration.mountingSide}
          />
          <p className="mt-4 text-sm text-slate-400 text-center italic">
            *Visual representation only. Final sizes confirmed during survey.
          </p>
        </div>
      </div>
    </div>
  );

  // Main step dispatcher with category-based branching
  const renderStep = () => {
    // Fixed Panel has its own flow (5 steps total)
    if (data.category === 'fixed-panel') {
      switch (step) {
        case 1: return renderStep1(); // Category selection (shared)
        case 2: return renderFixedPanel_Step2Combined();
        case 3: return renderFixedPanel_Step3_Finish();
        case 4: return renderFixedPanel_Step4_Review();
        default: return null;
      }
    }

    // Default flow for other categories (7 steps)
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
      default:
        return null;
    }
  };

  // Get the total number of steps based on category
  const getTotalSteps = () => {
    if (data.category === 'fixed-panel') return 4;
    return 7;
  };

  const handleSubmit = () => {
    // TODO: Submit the design data
    console.log('Submitting design:', data);
    alert('Design submitted! (This is a placeholder - implement API call)');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Progress indicator */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${s < step
                      ? 'bg-primary text-primary-foreground'
                      : s === step
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                        : 'bg-slate-200 text-slate-600'
                      }`}
                  >
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < getTotalSteps() && (
                    <div
                      className={`w-10 h-1 mx-1 ${s < step ? 'bg-primary' : 'bg-slate-200'
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content - takes remaining space */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {step < getTotalSteps() ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              Submit Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
