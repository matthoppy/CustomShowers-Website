/**
 * Start screen — choose a template or upload a photo.
 */

import { Camera, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TEMPLATES } from './templates';
import { TemplateThumbnail } from './views/TemplateThumbnail';
import type { TenantConfig } from './tenant';

interface StartScreenProps {
  tenant: TenantConfig;
  onSelectTemplate: () => void;
  onSelectPhoto: () => void;
}

export function StartScreen({ tenant, onSelectTemplate, onSelectPhoto }: StartScreenProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Let's design your shower</h1>
        <p className="mt-2 text-muted-foreground">
          Choose how you'd like to start — pick a layout or upload a photo of your space.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Template path */}
        <button
          type="button"
          onClick={onSelectTemplate}
          className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:border-foreground hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Grid3x3 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Start from a template</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick from common layouts like alcoves, corners and walk-ins. You can adjust every
            measurement and add panels as you go.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {TEMPLATES.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-center rounded border bg-background p-2"
              >
                <TemplateThumbnail
                  panels={t.panels}
                  junctions={t.junctions}
                  width={80}
                  height={60}
                  accent={tenant.brand.primary}
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <span>Choose a template</span>
            </Button>
          </div>
        </button>

        {/* Photo path */}
        <button
          type="button"
          onClick={onSelectPhoto}
          className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:border-foreground hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Upload a photo of your space</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Take or upload a photo of your shower area. Mark the opening on the photo and we'll
            suggest layouts that fit.
          </p>

          <div className="mt-6 overflow-hidden rounded-lg border bg-muted">
            <svg
              viewBox="0 0 280 180"
              className="h-auto w-full"
              aria-hidden="true"
            >
              <rect width="280" height="180" fill="currentColor" className="text-muted" />
              <rect x="60" y="40" width="160" height="100" fill="currentColor" className="text-muted-foreground/10" />
              <rect x="60" y="40" width="160" height="100" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary" strokeDasharray="8 4" />
              <circle cx="70" cy="50" r="4" fill="currentColor" className="text-primary" />
              <circle cx="210" cy="50" r="4" fill="currentColor" className="text-primary" />
              <circle cx="210" cy="130" r="4" fill="currentColor" className="text-primary" />
              <circle cx="70" cy="130" r="4" fill="currentColor" className="text-primary" />
              <path d="M 120 70 L 160 70 M 140 50 L 140 90" stroke="currentColor" strokeWidth="2" className="text-primary/60" />
            </svg>
          </div>

          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <span>Take or upload photo</span>
            </Button>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Whichever you choose, we'll confirm all sizes on a site survey before any glass is cut.
      </p>
    </div>
  );
}
