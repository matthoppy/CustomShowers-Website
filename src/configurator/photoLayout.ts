/**
 * Layouts suggested from a photo of the customer's shower space.
 *
 * The layout worker looks at the photo and proposes shapes; the customer picks
 * one and can change it in their own words. All of that is about the *shape*
 * only — the sizes still come from the Measure step, and the shop still
 * prices every enquiry by hand.
 *
 * Whatever comes back over the network is checked again here before it is
 * turned into panels, so a bad reply is an error message, never a shower the
 * drawing code cannot trace.
 */

import type { ShowerTemplate } from './templates';
import type { ConfiguratorJunction, ConfiguratorPanel } from './types';

/** The layout as the worker describes it. */
export interface SuggestedLayout {
  panels: { kind: 'fixed' | 'door'; width_mm: number; hinge_side?: 'left' | 'right' }[];
  junctions: (90 | 180)[];
  left_wall: boolean;
  right_wall: boolean;
  height_mm: number;
}

export interface LayoutSuggestion {
  title: string;
  why: string;
  layout: SuggestedLayout;
  /** For the workshop: ledge, raked top, where the head is. */
  notes: string[];
}

/**
 * What travels with the enquiry, so the workshop sees what the photo was read
 * as and what the customer asked to change.
 */
export interface PhotoLayoutRecord {
  title: string;
  notes: string[];
  /** The customer's own words, in the order they asked. */
  requests: string[];
}

/**
 * One shape for success and failure. The project does not run with strict
 * null checks, so a discriminated union would not narrow at the call sites.
 */
interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/** Mirrors cleanLayout in the worker. Null if it cannot be drawn. */
export function checkLayout(raw: unknown): SuggestedLayout | null {
  const l = raw as Partial<SuggestedLayout> | null;
  if (!l || !Array.isArray(l.panels) || l.panels.length === 0 || l.panels.length > 5) return null;
  if (!Array.isArray(l.junctions) || l.junctions.length !== l.panels.length - 1) return null;
  if (l.panels.filter((p) => p?.kind === 'door').length > 1) return null;
  if (!l.panels.every((p) => (p?.kind === 'fixed' || p?.kind === 'door') && p.width_mm > 0)) return null;
  if (!l.junctions.every((j) => j === 90 || j === 180)) return null;
  return {
    panels: l.panels.map((p) => ({ ...p })),
    junctions: [...l.junctions],
    left_wall: l.left_wall !== false,
    right_wall: l.right_wall !== false,
    height_mm: Number(l.height_mm) || 2000,
  };
}

/** Turn a suggested layout into the same shape a template has. */
export function layoutToTemplate(layout: SuggestedLayout, title: string): ShowerTemplate {
  const stamp = Date.now();
  const panels: ConfiguratorPanel[] = layout.panels.map((p, i) => {
    const panel: ConfiguratorPanel = {
      id: `photo-${stamp}-${i + 1}`,
      kind: p.kind,
      width_mm: p.width_mm,
    };
    if (p.kind === 'door') panel.door = { hinge_side: p.hinge_side ?? 'right', swing: 'out' };
    return panel;
  });
  const junctions: ConfiguratorJunction[] = layout.junctions.map((j) => ({ angle_deg: j }));
  return {
    id: 'photo',
    name: title,
    description: 'Suggested from your photo.',
    panels,
    junctions,
    leftWall: layout.left_wall,
    rightWall: layout.right_wall,
    heightMm: layout.height_mm,
  };
}

/** Back the other way, so a refinement starts from what is on screen now. */
export function templateToLayout(t: {
  panels: ConfiguratorPanel[];
  junctions: ConfiguratorJunction[];
  leftWall: boolean;
  rightWall: boolean;
  heightMm: number;
}): SuggestedLayout {
  return {
    panels: t.panels.map((p) =>
      p.kind === 'door'
        ? { kind: 'door', width_mm: p.width_mm, hinge_side: p.door?.hinge_side ?? 'right' }
        : { kind: 'fixed', width_mm: p.width_mm }
    ),
    junctions: t.junctions.map((j) => j.angle_deg),
    left_wall: t.leftWall,
    right_wall: t.rightWall,
    height_mm: t.heightMm,
  };
}

async function post<T>(url: string, body: unknown): Promise<Result<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: (data as { error?: string }).error ?? 'Something went wrong. Try again.' };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: 'Could not reach us just now. Check your connection and try again.' };
  }
}

export async function suggestFromPhoto(
  endpoint: string,
  image: string
): Promise<Result<{ suggestions: LayoutSuggestion[]; message?: string }>> {
  const res = await post<{ suggestions?: unknown[]; message?: string }>(`${endpoint}/suggest`, {
    image,
    mediaType: 'image/jpeg',
  });
  if (!res.ok || !res.data) return { ok: false, error: res.error };
  const suggestions = (res.data.suggestions ?? [])
    .map((s) => {
      const raw = s as Partial<LayoutSuggestion>;
      const layout = checkLayout(raw.layout);
      return layout
        ? {
            title: String(raw.title ?? 'Suggested layout'),
            why: String(raw.why ?? ''),
            layout,
            notes: Array.isArray(raw.notes) ? raw.notes.map(String) : [],
          }
        : null;
    })
    .filter((s): s is LayoutSuggestion => s !== null);
  return { ok: true, data: { suggestions, message: res.data.message } };
}

export async function refineLayout(
  endpoint: string,
  layout: SuggestedLayout,
  instruction: string,
  image: string | null
): Promise<Result<{ summary: string; layout: SuggestedLayout; notes: string[] }>> {
  const res = await post<{ summary?: string; layout?: unknown; notes?: unknown[] }>(
    `${endpoint}/refine`,
    { layout, instruction, image: image ?? undefined, mediaType: 'image/jpeg' }
  );
  if (!res.ok || !res.data) return { ok: false, error: res.error };
  const checked = checkLayout(res.data.layout);
  if (!checked) return { ok: false, error: 'We could not make that change. Try saying it another way.' };
  return {
    ok: true,
    data: {
      summary: String(res.data.summary ?? 'Updated.'),
      layout: checked,
      notes: Array.isArray(res.data.notes) ? res.data.notes.map(String) : [],
    },
  };
}
