/**
 * Suggestion picker — choose from AI-suggested configurations.
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateThumbnail } from './views/TemplateThumbnail';
import type { Suggestion } from './suggestions';
import type { TenantConfig } from './tenant';
import type { ConfiguratorPanel, ConfiguratorJunction } from './types';

interface SuggestionPickerProps {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  tenant: TenantConfig;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  onBack: () => void;
}

export function SuggestionPicker({
  suggestions,
  loading,
  error,
  tenant,
  onSelectSuggestion,
  onBack,
}: SuggestionPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back
        </Button>
        <h2 className="text-2xl font-bold">Suggested layouts</h2>
        <p className="mt-2 text-muted-foreground">
          Based on your photo and measurement, here are layouts that should fit your space.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted p-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Analyzing your space...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
              className="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:border-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 sm:gap-6 sm:p-6"
            >
              <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded border bg-background sm:h-24 sm:w-32">
                <TemplateThumbnail
                  panels={(suggestion.state.panels as ConfiguratorPanel[]) || []}
                  junctions={(suggestion.state.junctions as ConfiguratorJunction[]) || []}
                  width={120}
                  height={90}
                  accent={tenant.brand.primary}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold">{suggestion.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{suggestion.reason}</p>
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <span>Choose this layout</span>
                  </Button>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="rounded-lg border bg-muted p-8 text-center">
          <p className="text-muted-foreground">
            We couldn't generate suggestions from this photo. Try starting from a template instead.
          </p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Go back
          </Button>
        </div>
      )}
    </div>
  );
}
