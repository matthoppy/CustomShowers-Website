/// <reference types="vite/client" />

// Cloudflare Turnstile API types
interface TurnstileOptions {
  sitekey: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (error: string) => void;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
}

interface Window {
  turnstile?: {
    render: (container: HTMLElement | string, options: TurnstileOptions) => string;
    remove: (widgetId: string) => void;
    reset: (widgetId: string) => void;
    getResponse: (widgetId: string) => string | undefined;
  };
}
