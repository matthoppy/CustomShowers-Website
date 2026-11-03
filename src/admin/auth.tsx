/**
 * Who is signed in, and the API to talk to as them.
 *
 * The worker signs people in with GitHub and hands back a session token on
 * /admin/auth; this keeps it in localStorage and sends it with every call.
 * With ?mock=1 the dashboard runs against sample data instead, for working on
 * it without a server.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError, MOCK_KEY, createWorkerApi, getToken, setToken } from './api/client';
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
  const location = useLocation();

  // Re-check whenever the token could have changed: after the sign-in
  // callback stores one, this runs again and lands the user in.
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
  }, [api, mock, token]);

  const value: AdminContextValue = {
    api,
    user,
    loading,
    error,
    mock,
    signIn: (returnPath) => {
      window.location.href = api.loginUrl(returnPath || location.pathname);
    },
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

/** The sign-in return point: /admin/auth#token=…&return=… or #error=… */
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
    const reasons: Record<string, string> = {
      'not-allowed': `That GitHub account (${hash.get('login') || 'unknown'}) is not on the list of people who can use this dashboard.`,
      'github-not-configured': 'The dashboard worker has no GitHub app configured yet. See docs/ADMIN_DASHBOARD.md.',
      'bad-state': 'The sign-in link had expired or was not ours. Start again from the sign-in button.',
      'token-exchange': 'GitHub did not accept the sign-in. Check the client secret on the worker and try again.',
    };
    setProblem(reasons[error || ''] || 'Sign-in did not complete. Try again from the sign-in button.');
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
