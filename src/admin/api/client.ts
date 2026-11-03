/**
 * Talking to the admin worker.
 *
 * The session token lives in localStorage and goes in the Authorization
 * header. Files (drawings, photos) are loaded by the browser as images, which
 * cannot carry headers, so their URLs carry the token as a query parameter
 * instead; the worker accepts it on the file routes only.
 */

import type {
  AdminApi,
  CloudflareSummary,
  GoogleStatus,
  GoogleSummary,
  JobDetail,
  JobsList,
  Me,
  PublishPhotosRequest,
  PublishResult,
  Quote,
  QuotesList,
  SitePhotosState,
} from './types';

export const TOKEN_KEY = 'admin:token';
export const MOCK_KEY = 'admin:mock';

/** The worker's URL. Overridable at build time for a different account. */
export const ADMIN_API_URL: string =
  (import.meta.env.VITE_ADMIN_API_URL as string | undefined) ||
  'https://customshowers-admin.vcwvk4sm9m.workers.dev';

/** The worker's origin: the only place a popup sign-in result is accepted from. */
export const ADMIN_API_ORIGIN: string = new URL(ADMIN_API_URL).origin;

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked: the session lasts for this page only.
  }
}

export class ApiError extends Error {
  status: number;
  /** The publish found the job changed elsewhere since the editor opened it. */
  conflict: boolean;
  constructor(message: string, status: number, conflict = false) {
    super(message);
    this.status = status;
    this.conflict = conflict;
  }
}

export function createWorkerApi(baseUrl: string = ADMIN_API_URL): AdminApi {
  const call = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const token = getToken();
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const message =
        (data && typeof data === 'object' && 'error' in data && String((data as { error: unknown }).error)) ||
        `The dashboard server answered ${res.status}.`;
      const conflict = !!(data && typeof data === 'object' && 'conflict' in data && (data as { conflict: unknown }).conflict);
      throw new ApiError(message, res.status, conflict);
    }
    return data as T;
  };
  const query = (params: Record<string, string | number | null | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    const s = q.toString();
    return s ? `?${s}` : '';
  };
  const fileUrl = (path: string) => `${baseUrl}${path}?t=${encodeURIComponent(getToken() || '')}`;

  return {
    loginUrl: (returnPath, popup = false) => `${baseUrl}/auth/github/start?return=${encodeURIComponent(returnPath)}${popup ? '&popup=1' : ''}`,
    me: () => call<Me>('/me'),
    logout: async () => {
      await call('/auth/logout', { method: 'POST' }).catch(() => undefined);
    },
    listJobs: (params = {}) => call<JobsList>(`/jobs${query({ status: params.status, q: params.q })}`),
    getJob: (id) => call<JobDetail>(`/jobs/${encodeURIComponent(id)}`),
    updateJob: (id, patch) => call<JobDetail>(`/jobs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    jobFileUrl: (id, filename) => fileUrl(`/jobs/${encodeURIComponent(id)}/files/${encodeURIComponent(filename)}`),
    listQuotes: (params = {}) => call<QuotesList>(`/quotes${query({ status: params.status, q: params.q })}`),
    updateQuote: (id, patch) => call<Quote>(`/quotes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    quoteFileUrl: (id, filename) => fileUrl(`/quotes/${encodeURIComponent(id)}/files/${encodeURIComponent(filename)}`),
    sitePhotos: () => call<SitePhotosState>('/site/photos'),
    uploadPhoto: (contentBase64) => call<{ sha: string; bytes: number }>('/site/photos/upload', { method: 'POST', body: JSON.stringify({ contentBase64 }) }),
    publishPhotos: (request: PublishPhotosRequest) => call<PublishResult>('/site/photos/publish', { method: 'POST', body: JSON.stringify(request) }),
    cloudflare: (days) => call<CloudflareSummary>(`/cloudflare/summary${query({ days })}`),
    googleStatus: () => call<GoogleStatus>('/google/status'),
    googleConnectUrl: async () => (await call<{ url: string }>('/auth/google/start')).url,
    googleSummary: (days) => call<GoogleSummary>(`/google/summary${query({ days })}`),
    googleDisconnect: async () => {
      await call('/google/disconnect', { method: 'POST' });
    },
  };
}
