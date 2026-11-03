/**
 * Who is signed in, and the API to talk to as them.
 *
 * Signing in opens GitHub in a small window; the worker finishes the sign-in
 * there and hands the session token back to this page, which never leaves.
 * Where the window is blocked the whole page goes to GitHub instead and comes
 * back to /admin/auth. Either way the token lives in localStorage and goes
 * with every call. With ?mock=1 the dashboard runs on sample data instead,
 * for working on it without a server.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_API_ORIGIN, ApiError, MOCK_KEY, createWorkerApi, getToken, setToken } from './api/client';
import { createMockApi } from './api/mock';
import type { AdminApi, Me } from './api/types';

interface AdminContextValue {
  api: AdminApi;
  user: Me | null;
  loading: boolean;
  error: string | null;
  mock: boolean;
  signIn: (returnPath: string) => void;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const POPUP_NAME = 'customshowers-admin-auth';

/** What went wrong with a sign-in, in words. */
export function signInProblem(code: string | null | undefined, login?: string | null): string {
  const reasons: Record<string, string> = {
    'not-allowed': `That GitHub account (${login || 'unknown'}) is not on the list of people who can use this dashboard.`,
    'github-not-configured': 'The dashboard worker has no GitHub app configured yet. See docs/ADMIN_DASHBOARD.md.',
    'bad-state': 'The sign-in link had expired or was not ours. Start again from the sign-in button.',
    'token-exchange': 'GitHub did not accept the sign-in. Check the client secret on the worker and try again.',
  };
  return reasons[code || ''] || 'Sign-in did not complete. Try again from the sign-in button.';
}

function detectMock(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mock') === '1') {
      window.sessionStorage.setItem(MOCK_KEY, '1');
      return true;
    }
    if (params.get('mock') === '0') {
      window.sessionStorage.removeItem(MOCK_KEY);
      return false;
    }
    if (import.meta.env.VITE_ADMIN_MOCK === '1') return true;
    return window.sessionStorage.getItem(MOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [mock] = useState(detectMock);
  const api = useMemo(() => (mock ? createMockApi() : createWorkerApi()), [mock]);
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Goes up when a sign-in window hands over a token, so the session is checked again. */
  const [attempt, setAttempt] = useState(0);
  const popup = useRef<Window | null>(null);
  const location = useLocation();

  // Re-check whenever the token could have changed: after the sign-in window
  // or the callback page stores one, this runs again and lands the user in.
  const token = getToken();
  useEffect(() => {
    let cancelled = false;
    if (!mock && !token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setToken(null);
          setUser(null);
        } else {
          setError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, mock, token, attempt]);

  // The sign-in window's handshake: it says hello, this page answers from its
  // own origin, and the window hands over the outcome to that origin only.
  useEffect(() => {
    if (mock) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ADMIN_API_ORIGIN) return;
      if (e.data === 'customshowers-admin:hello') {
        (e.source as Window | null)?.postMessage('customshowers-admin:ready', ADMIN_API_ORIGIN);
        return;
      }
      const data = e.data as { source?: string; token?: string; error?: string; login?: string } | null;
      if (!data || typeof data !== 'object' || data.source !== 'customshowers-admin') return;
      if (data.token) {
        setToken(data.token);
        setError(null);
        setAttempt((n) => n + 1);
      } else {
        setError(signInProblem(data.error, data.login));
      }
      try {
        popup.current?.close();
      } catch {
        // The window has moved to another origin; it closes itself.
      }
      popup.current = null;
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mock]);

  const signIn = useCallback(
    (returnPath: string) => {
      const back = returnPath || location.pathname;
      if (mock) {
        window.location.href = api.loginUrl(back);
        return;
      }
      const width = 600;
      const height = 720;
      const left = Math.max(0, Math.round((window.screen.width - width) / 2));
      const top = Math.max(0, Math.round((window.screen.height - height) / 2));
      const win = window.open(api.loginUrl(back, true), POPUP_NAME, `width=${width},height=${height},left=${left},top=${top}`);
      if (!win) {
        // Pop-ups blocked: sign in with the whole page instead.
        window.location.href = api.loginUrl(back);
        return;
      }
      popup.current = win;
      setError(null);
    },
    [api, mock, location.pathname]
  );

  const value: AdminContextValue = {
    api,
    user,
    loading,
    error,
    mock,
    signIn,
    signOut: async () => {
      await api.logout();
      setToken(null);
      setUser(null);
    },
  };
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin outside AdminProvider');
  return ctx;
}

/** The whole-page sign-in's return point: /admin/auth#token=…&return=… or #error=… */
export function AuthCallback() {
  const navigate = useNavigate();
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('token');
    const error = hash.get('error');
    if (token) {
      setToken(token);
      const back = hash.get('return') || '/admin';
      navigate(back.startsWith('/admin') ? back : '/admin', { replace: true });
      return;
    }
    setProblem(signInProblem(error, hash.get('login')));
  }, [navigate]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {problem ? (
        <>
          <h1 className="text-xl font-semibold">Could not sign you in</h1>
          <p className="mt-2 text-sm text-muted-foreground">{problem}</p>
          <a href="/admin" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
            Back to sign in
          </a>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      )}
    </div>
  );
}
