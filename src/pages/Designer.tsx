/**
 * Designer Page
 * Main shower design tool interface
 */

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { useDesign, DesignProvider } from '@/contexts/DesignContext';
import TemplateSelector from '@/components/designer/TemplateSelector';
import ConfigurationPanel from '@/components/designer/ConfigurationPanel';
import ShowerPreview3D from '@/components/designer/ShowerPreview3D';
import MeasurementDiagram from '@/components/designer/MeasurementDiagram';

type DesignStep = 'template' | 'configure' | 'measurements' | 'quote';

function DesignerContent() {
  const { design, updateTemplate, updateConfiguration, updateMeasurementPoint, resetDesign } = useDesign();
  const [step, setStep] = useState<DesignStep>('template');

  const stepNames: Record<DesignStep, string> = {
    template: 'Select Design',
    configure: 'Configure',
    measurements: 'Measurements',
    quote: 'Get Quote',
  };

  const steps: DesignStep[] = ['template', 'configure', 'measurements', 'quote'];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'template':
        return design.template !== null;
      case 'configure':
        return true; // Configuration always valid
      case 'measurements':
        // Check that all measurement points have valid values
        return design.measurementPoints.length > 0 &&
               design.measurementPoints.every(m => m.value > 0);
      default:
        return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length && canProceed()) {
      setStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-40 pb-8 bg-primary">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 uppercase">
              Design Your Shower
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Create your perfect bespoke frameless shower enclosure
            </p>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="bg-muted py-4 border-b">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-4">
            {steps.map((s, idx) => {
              const isActive = s === step;
              const isCompleted = idx < currentStepIndex;

              return (
                <div key={s} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                          ? 'bg-primary/60 text-primary-foreground'
                          : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`font-medium ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {stepNames[s]}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-12 bg-background">
        <div className="container mx-auto px-6">
          {/* Step: Template Selection */}
          {step === 'template' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-foreground uppercase">
                  Choose Your Shower Design
                </h2>
                <Button variant="outline" size="sm" onClick={resetDesign}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>

              <TemplateSelector
                onSelect={updateTemplate}
                selectedTemplateId={design.template?.id}
              />
            </div>
          )}

          {/* Step: Configuration */}
          {step === 'configure' && design.template && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground uppercase mb-6">
                  Configure Your Shower
                </h2>
                <ConfigurationPanel
                  template={design.template}
                  configuration={{
                    mountingType: design.mountingType,
                    doorOpening: design.doorOpening,
                    hardwareFinish: design.hardwareFinish,
                    glassType: design.glassType,
                    glassThickness: design.glassThickness,
                    includeSeals: design.includeSeals,
                    sealType: design.sealType,
                  }}
                  onChange={updateConfiguration}
                />
              </div>

              <div className="sticky top-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Live Preview</span>
                      <Badge variant="secondary">{design.template.name}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ShowerPreview3D
                      template={design.template}
                      glassType={design.glassType}
                      hardwareFinish={design.hardwareFinish}
                      showHardware={true}
                      width={500}
                      height={500}
                    />

                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Current Configuration:</h4>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-muted-foreground">Glass:</dt>
                        <dd className="font-medium capitalize">
                          {design.glassType} {design.glassThickness}mm
                        </dd>
                        <dt className="text-muted-foreground">Mounting:</dt>
                        <dd className="font-medium capitalize">{design.mountingType}</dd>
                        <dt className="text-muted-foreground">Hardware:</dt>
                        <dd className="font-medium capitalize">
                          {design.hardwareFinish.replace('-', ' ')}
                        </dd>
                        <dt className="text-muted-foreground">Door Opens:</dt>
                        <dd className="font-medium capitalize">{design.doorOpening}</dd>
                      </dl>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step: Measurements */}
          {step === 'measurements' && design.template && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground uppercase mb-6">
                Enter Measurements
              </h2>
              <MeasurementDiagram
                template={design.template}
                measurements={design.measurementPoints}
                onUpdateMeasurement={updateMeasurementPoint}
              />
            </div>
          )}

          {/* Step: Quote */}
          {step === 'quote' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground uppercase mb-6">
                Your Quote
              </h2>
              <Card>
                <CardContent className="p-8">
                  <p className="text-center text-muted-foreground">
                    Quote calculator coming soon...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Navigation Footer */}
      <section className="bg-muted border-t py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </div>

            <Button
              onClick={nextStep}
              disabled={!canProceed() || currentStepIndex === steps.length - 1}
            >
              {currentStepIndex === steps.length - 1 ? 'Get Quote' : 'Next Step'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function Designer() {
  return (
    <DesignProvider>
      <DesignerContent />
    </DesignProvider>
  );
}
