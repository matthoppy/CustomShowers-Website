/**
 * Sheets and toasts: the small dialogs the dashboard asks and tells with.
 *
 * A sheet slides up from the bottom on a phone and sits in the middle on a
 * wider screen. One is open at a time: a confirmation with a dangerous or
 * ordinary action, a progress sheet while something publishes, a done sheet,
 * or a failure. Use them through useSheets().
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ProgressHandle {
  /** New words under the bar, and how far along, 0 to 1. */
  update(label: string, fraction?: number): void;
  close(): void;
}

interface SheetsApi {
  confirm(opts: { title: string; text?: string; action: string; danger?: boolean }): Promise<boolean>;
  progress(title: string, label: string): ProgressHandle;
  done(title: string, text?: string): Promise<void>;
  fail(title: string, text: string, action?: string): Promise<void>;
  toast(text: string): void;
}

type SheetState =
  | { kind: 'confirm'; title: string; text?: string; action: string; danger: boolean; resolve: (yes: boolean) => void }
  | { kind: 'progress'; title: string; label: string; fraction: number }
  | { kind: 'done'; title: string; text?: string; resolve: () => void }
  | { kind: 'fail'; title: string; text: string; action: string; resolve: () => void };

const SheetsContext = createContext<SheetsApi | null>(null);

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = useMemo<SheetsApi>(
    () => ({
      confirm: ({ title, text, action, danger = false }) =>
        new Promise<boolean>((resolve) => setSheet({ kind: 'confirm', title, text, action, danger, resolve })),
      progress: (title, label) => {
        setSheet({ kind: 'progress', title, label, fraction: 0 });
        return {
          update: (nextLabel, fraction) =>
            setSheet((s) => (s && s.kind === 'progress' ? { ...s, label: nextLabel, fraction: fraction ?? s.fraction } : s)),
          close: () => setSheet((s) => (s && s.kind === 'progress' ? null : s)),
        };
      },
      done: (title, text) => new Promise<void>((resolve) => setSheet({ kind: 'done', title, text, resolve })),
      fail: (title, text, action = 'OK') => new Promise<void>((resolve) => setSheet({ kind: 'fail', title, text, action, resolve })),
      toast: (text) => {
        setToastText(text);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastText(null), 4000);
      },
    }),
    []
  );

  const close = useCallback(() => {
    setSheet((s) => {
      if (!s) return s;
      if (s.kind === 'confirm') s.resolve(false);
      if (s.kind === 'done' || s.kind === 'fail') s.resolve();
      return null;
    });
  }, []);

  useEffect(() => {
    if (!sheet || sheet.kind === 'progress') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, close]);

  return (
    <SheetsContext.Provider value={api}>
      {children}
      {sheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && sheet.kind !== 'progress') close();
          }}
        >
          <div
            role={sheet.kind === 'progress' ? 'status' : 'alertdialog'}
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="admin-sheet w-full max-w-md border-t bg-background p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center shadow-xl sm:border sm:p-7"
          >
            {sheet.kind === 'progress' && (
              <>
                <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" aria-hidden="true" />
                <h3 id="sheet-title" className="mt-3 text-lg font-bold">
                  {sheet.title}
                </h3>
                <div className="mt-4 h-2 w-full overflow-hidden bg-muted" aria-hidden="true">
                  <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${Math.round(sheet.fraction * 100)}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{sheet.label}</p>
              </>
            )}
            {sheet.kind === 'done' && (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <Check className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 id="sheet-title" className="mt-3 text-lg font-bold">
                  {sheet.title}
                </h3>
                {sheet.text && <p className="mt-1 text-sm text-muted-foreground">{sheet.text}</p>}
                <Button className="mt-5 h-12 w-full" autoFocus onClick={close}>
                  Done
                </Button>
              </>
            )}
            {sheet.kind === 'fail' && (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                  <AlertTriangle className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 id="sheet-title" className="mt-3 text-lg font-bold">
                  {sheet.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{sheet.text}</p>
                <Button className="mt-5 h-12 w-full" autoFocus onClick={close}>
                  {sheet.action}
                </Button>
              </>
            )}
            {sheet.kind === 'confirm' && (
              <>
                <h3 id="sheet-title" className="text-lg font-bold">
                  {sheet.title}
                </h3>
                {sheet.text && <p className="mt-1 text-sm text-muted-foreground">{sheet.text}</p>}
                <Button
                  variant={sheet.danger ? 'destructive' : 'default'}
                  className="mt-5 h-12 w-full"
                  autoFocus
                  onClick={() => {
                    sheet.resolve(true);
                    setSheet(null);
                  }}
                >
                  {sheet.action}
                </Button>
                <Button variant="outline" className="mt-2 h-12 w-full" onClick={close}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      {toastText && (
        <div role="status" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 max-w-[calc(100%-2rem)] -translate-x-1/2 bg-foreground px-4 py-3 text-sm text-background shadow-lg">
          {toastText}
        </div>
      )}
    </SheetsContext.Provider>
  );
}

export function useSheets(): SheetsApi {
  const ctx = useContext(SheetsContext);
  if (!ctx) throw new Error('useSheets outside SheetsProvider');
  return ctx;
}
