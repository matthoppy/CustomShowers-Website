/**
 * Turnstile widget for Gemini photo recognition endpoints.
 *
 * Renders a separate widget instance that can be reset after each use,
 * since Turnstile tokens are single-use.
 */

import { useEffect, useRef, useState } from 'react';
import { getTenant } from './tenant';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface GeminiTurnstileProps {
  onToken: (token: string | null) => void;
  autoRender?: boolean;
}

export function GeminiTurnstile({ onToken, autoRender = true }: GeminiTurnstileProps) {
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const containerRef = useRef<HTMLDivElement>(null);
  const tenant = getTenant();

  useEffect(() => {
    if (!tenant.turnstileSiteKey || !autoRender) return;

    const container = containerRef.current;
    if (!container) return;

    let mounted = true;
    let currentWidgetId: string | null = null;

    const tryRender = () => {
      if (!mounted || !container || currentWidgetId) return;

      try {
        if (typeof window === 'undefined' || !window.turnstile) {
          return;
        }

        currentWidgetId = window.turnstile.render(container, {
          sitekey: tenant.turnstileSiteKey,
          appearance: 'interaction-only',
          theme: 'light',
          size: 'compact',
          callback: (token: string) => {
            if (mounted && token) {
              setState('ready');
              onToken(token);
            }
          },
          'expired-callback': () => {
            if (mounted) {
              setState('loading');
              onToken(null);
            }
          },
          'error-callback': () => {
            if (mounted) {
              setState('failed');
              onToken(null);
            }
          },
        });

        setWidgetId(currentWidgetId);
      } catch (err) {
        console.error('Gemini Turnstile render error:', err);
        if (mounted) {
          setState('failed');
        }
      }
    };

    // Try render immediately if turnstile already loaded
    if (window.turnstile) {
      tryRender();
    }

    // Also try on script load event
    const script = document.querySelector('script[src*="challenges.cloudflare.com"]');
    if (script) {
      script.addEventListener('load', tryRender);
    }

    // Fallback: retry after short delay
    const retryTimer = setTimeout(tryRender, 1000);

    // Cleanup on unmount
    return () => {
      mounted = false;
      clearTimeout(retryTimer);
      if (currentWidgetId && window.turnstile?.remove) {
        try {
          window.turnstile.remove(currentWidgetId);
        } catch (err) {
          console.warn('Gemini Turnstile remove error:', err);
        }
      }
    };
  }, [tenant.turnstileSiteKey, autoRender, onToken]);

  // Public method to reset the widget (for re-use after a request)
  useEffect(() => {
    if (!widgetId) return;

    // Expose reset method on the container element for external access
    const container = containerRef.current;
    if (container) {
      (container as HTMLDivElement & { resetWidget?: () => void }).resetWidget = () => {
        if (window.turnstile && widgetId) {
          try {
            window.turnstile.reset(widgetId);
            setState('loading');
            onToken(null);
          } catch (err) {
            console.warn('Turnstile reset error:', err);
          }
        }
      };
    }
  }, [widgetId, onToken]);

  if (!tenant.turnstileSiteKey) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-2">
      <div ref={containerRef} id={`gemini-turnstile-${Math.random().toString(36).slice(2)}`} />
      {state === 'failed' && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Security check failed. Please refresh the page.
        </p>
      )}
    </div>
  );
}
