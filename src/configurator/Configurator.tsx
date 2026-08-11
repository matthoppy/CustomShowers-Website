/**
 * The configurator.
 *
 * Self-contained and tenant-driven: it takes a TenantConfig and renders the
 * whole flow. Nothing in here knows about Custom Showers specifically, so the
 * same component serves a route on the main site and the iframe embed.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw } from 'lucide-react';
import { PlanView } from './views/PlanView';
import { ElevationView } from './views/ElevationView';
import { ShapeStep } from './steps/ShapeStep';
import { SizesStep } from './steps/SizesStep';
import { HardwareStep } from './steps/HardwareStep';
import { ReviewStep } from './steps/ReviewStep';
import { STEPS, type StepId, type StepProps } from './steps/types';
import { createInitialState, type ConfiguratorState, type CustomerDetails } from './types';
import { getTenant, type TenantConfig } from './tenant';
import { TEMPLATES, type ShowerTemplate } from './templates';
import {
  buildEnquiryPayload,
  submitEnquiry,
  svgToPngBase64,
  type EnquiryAttachment,
} from './submit';

const EMPTY_CUSTOMER: CustomerDetails = {
  name: '',
  email: '',
  phone: '',
  postcode: '',
  notes: '',
  measurementsAcknowledged: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Drop a template's shape into the current state, keeping anything the
 * customer has already chosen that is not about shape — finish, handle,
 * mounting — so switching template does not silently undo their hardware.
 */
function applyTemplate(state: ConfiguratorState, template: ShowerTemplate): ConfiguratorState {
  return {
    ...state,
    panels: structuredClone(template.panels),
    junctions: structuredClone(template.junctions),
    leftWall: template.leftWall,
    rightWall: template.rightWall,
    heightMm: template.heightMm ?? state.heightMm,
  };
}

interface ConfiguratorProps {
  tenant?: TenantConfig;
  /** Rendered inside an iframe — drops the outer page chrome. */
  embedded?: boolean;
}

export function Configurator({ tenant = getTenant(), embedded = false }: ConfiguratorProps) {
  const [stepId, setStepId] = useState<StepId>('shape');
  const [templateId, setTemplateId] = useState<string | null>(TEMPLATES[0].id);
  const [state, setState] = useState<ConfiguratorState>(() =>
    applyTemplate(createInitialState(tenant.glassThicknessMm), TEMPLATES[0])
  );
  const [customer, setCustomerState] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [activePanelId, setActivePanelId] = useState<string | null>(state.panels[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const didMountRef = useRef(false);
  // How long the customer spent on the design. A real one cannot get through
  // four steps in a couple of seconds; a script can.
  const startedAtRef = useRef<number>(Date.now());

  const drawingRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  /**
   * Start each step at the top.
   *
   * Steps differ a lot in length, so without this you press Next at the bottom
   * of a long step and land halfway down the next one, below its heading.
   *
   * Embedded, the iframe has no scrollbar of its own — it grows to fit and the
   * host page does the scrolling — so there is nothing here to scroll and we
   * ask the parent instead.
   */
  useEffect(() => {
    // Skip the very first render: scrolling on mount would yank a host page
    // down to the widget as soon as it loads.
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (embedded) {
      window.parent.postMessage({ type: 'glass-configurator:scrollToTop' }, '*');
      return;
    }

    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [stepId, submitted, embedded]);

  const update = (patch: Partial<ConfiguratorState>) => setState((s) => ({ ...s, ...patch }));
  const setCustomer = (patch: Partial<CustomerDetails>) =>
    setCustomerState((c) => ({ ...c, ...patch }));

  const stepIndex = STEPS.findIndex((s) => s.id === stepId);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const canProceed = useMemo(() => {
    switch (stepId) {
      case 'shape':
        return state.panels.length > 0;
      case 'sizes':
        return (
          state.panels.length > 0 &&
          state.panels.every((p) => p.width_mm > 0) &&
          state.heightMm >= 500 &&
          state.heightMm <= 3000
        );
      case 'hardware':
        return true;
      case 'review':
        return (
          customer.name.trim().length > 1 &&
          EMAIL_PATTERN.test(customer.email) &&
          customer.measurementsAcknowledged &&
          // No challenge configured means none to pass.
          (!tenant.turnstileSiteKey || !!turnstileToken)
        );
      default:
        return false;
    }
  }, [stepId, state, customer, tenant.turnstileSiteKey, turnstileToken]);

  const stepProps: StepProps = {
    tenant,
    state,
    update,
    activePanelId,
    setActivePanelId,
    canvasWidth: 620,
    canvasHeight: 520,
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const attachments: EnquiryAttachment[] = [];
    const svgs = drawingRef.current?.querySelectorAll('svg') ?? [];
    const names = ['plan-view.png', 'elevation-view.png'];
    let i = 0;
    for (const svg of Array.from(svgs)) {
      const png = await svgToPngBase64(svg as SVGSVGElement);
      if (png) attachments.push({ filename: names[i] ?? `drawing-${i + 1}.png`, content: png });
      i++;
    }

    const payload = buildEnquiryPayload(tenant, state, customer, attachments, turnstileToken, {
      honeypot,
      elapsedMs: Date.now() - startedAtRef.current,
    });
    const result = await submitEnquiry(payload);

    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setError(
        result.error ??
          'We could not send that. Please try again, or call us and quote your measurements.'
      );
    }
  }

  function reset() {
    const fresh = applyTemplate(createInitialState(tenant.glassThicknessMm), TEMPLATES[0]);
    setTemplateId(TEMPLATES[0].id);
    setState(fresh);
    setCustomerState(EMPTY_CUSTOMER);
    setActivePanelId(fresh.panels[0]?.id ?? null);
    setStepId('shape');
    setSubmitted(false);
    setError(null);
    setTurnstileToken(null);
    setHoneypot('');
    startedAtRef.current = Date.now();
  }

  if (submitted) {
    return (
      <div className={embedded ? 'p-8' : 'mx-auto max-w-2xl px-6 py-24'}>
        <div className="rounded-lg border p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold">Design sent</h2>
          <p className="mt-2 text-muted-foreground">
            Thanks {customer.name.split(' ')[0] || 'very much'} — your measurements are with{' '}
            {tenant.brand.name}. We will be in touch to confirm sizes before anything is cut.
          </p>
          <Button variant="outline" onClick={reset} className="mt-6">
            <RotateCcw className="mr-2 h-4 w-4" />
            Design another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* Scroll target for step changes. The margin keeps the heading clear of
          the site's sticky header, which would otherwise sit over it. */}
      <div ref={topRef} className="scroll-mt-24" aria-hidden="true" />

      {/* Progress. */}
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-4 sm:gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => i < stepIndex && setStepId(s.id)}
              disabled={i > stepIndex}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < stepIndex
                    ? 'bg-foreground text-background'
                    : i === stepIndex
                      ? 'bg-foreground text-background ring-2 ring-foreground ring-offset-2'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={`hidden text-sm sm:inline ${
                  i === stepIndex ? 'font-semibold' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border sm:w-8" />}
            </button>
          ))}
        </div>
      </div>

      {/* Body. */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold sm:text-3xl">{step.heading}</h2>
            <p className="mt-1 text-muted-foreground">{step.blurb}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              {stepId === 'shape' && (
                <ShapeStep
                  {...stepProps}
                  selectedTemplateId={templateId}
                  onSelectTemplate={(t) => {
                    setTemplateId(t.id);
                    setState((s) => applyTemplate(s, t));
                    setActivePanelId(t.panels[0].id);
                  }}
                  onStartFromScratch={() => {
                    setTemplateId(null);
                    const fresh = createInitialState(tenant.glassThicknessMm);
                    setState((s) => ({ ...fresh, finishId: s.finishId, handleId: s.handleId }));
                    setActivePanelId(fresh.panels[0].id);
                  }}
                />
              )}
              {stepId === 'sizes' && <SizesStep {...stepProps} />}
              {stepId === 'hardware' && <HardwareStep {...stepProps} />}
              {stepId === 'review' && (
                <ReviewStep
                  {...stepProps}
                  customer={customer}
                  setCustomer={setCustomer}
                  onTurnstileToken={setTurnstileToken}
                  honeypot={honeypot}
                  setHoneypot={setHoneypot}
                />
              )}
            </div>

            {/* Drawings. Kept mounted on every step so the review step can
                rasterise them without a re-render race on submit. */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div ref={drawingRef} className="space-y-4">
                <figure className="overflow-hidden rounded-lg border bg-card">
                  <figcaption className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Plan
                  </figcaption>
                  <div className="flex justify-center overflow-x-auto p-2">
                    <PlanView
                      panels={state.panels}
                      junctions={state.junctions}
                      leftWall={state.leftWall}
                      rightWall={state.rightWall}
                      width={560}
                      height={stepId === 'shape' ? 420 : 300}
                      activePanelId={activePanelId}
                      onPanelClick={setActivePanelId}
                      onToggleJunction={(i) => {
                        const junctions = [...state.junctions];
                        junctions[i] = {
                          angle_deg: junctions[i].angle_deg === 90 ? 180 : 90,
                        };
                        update({ junctions });
                      }}
                      accent={tenant.brand.primary}
                    />
                  </div>
                </figure>

                <figure className="overflow-hidden rounded-lg border bg-card">
                  <figcaption className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Elevation
                  </figcaption>
                  <div className="flex justify-center overflow-x-auto p-2">
                    <ElevationView
                      panels={state.panels}
                      junctions={state.junctions}
                      heightMm={state.heightMm}
                      handleId={state.handleId}
                      width={560}
                      height={stepId === 'shape' ? 260 : 380}
                      activePanelId={activePanelId}
                      onPanelClick={setActivePanelId}
                      accent={tenant.brand.primary}
                    />
                  </div>
                </figure>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Drawings are to scale but indicative. Sizes are confirmed before cutting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav. */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setStepId(STEPS[Math.max(0, stepIndex - 1)].id)}
            disabled={stepIndex === 0 || submitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {isLast ? (
            <Button onClick={handleSubmit} disabled={!canProceed || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                <>Send my design</>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setStepId(STEPS[stepIndex + 1].id)}
              disabled={!canProceed}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
