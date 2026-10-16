/**
 * Keeps a half-finished measure so closing the tab isn't the end of it.
 *
 * People measure with the phone in one hand and a tape in the other, and the
 * browser will get backgrounded, refreshed or closed along the way. Losing
 * eight measurements to that is the quickest way to lose the customer.
 *
 * Saved per layout, in this browser only. Storage can be missing, full or
 * throw (private mode, blocked site data), so every call here fails quietly:
 * the wizard must work exactly the same without it.
 */

import type { MeasuringMethod } from './types';
import type { HeightReference } from './measurementPlans';

const VERSION = 1;
const PREFIX = 'cs-measure:';
/** A measure older than this is more likely a different bathroom than a paused one. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface WizardProgress {
  version: number;
  savedAt: number;
  /** -2 intro, -1 method choice, 0..n steps, n review. */
  stepIndex: number;
  measuringMethod: MeasuringMethod;
  measurements: Record<string, string>;
  notSure: string[];
  confirmed: string[];
  floorType: 'tray' | 'wet-room' | 'over-bath';
  obstacles: string[];
  heightReference: HeightReference;
  heightToReference: string;
  showerHeadHeight: string;
}

const key = (configurationId: string) => `${PREFIX}${configurationId}`;
const photoKey = (configurationId: string) => `${PREFIX}${configurationId}:photos`;

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadProgress(configurationId: string): WizardProgress | null {
  try {
    const raw = storage()?.getItem(key(configurationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WizardProgress;
    if (parsed.version !== VERSION || Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgress(configurationId: string, progress: Omit<WizardProgress, 'version' | 'savedAt'>) {
  try {
    storage()?.setItem(key(configurationId), JSON.stringify({ ...progress, version: VERSION, savedAt: Date.now() }));
  } catch {
    // Full or unavailable — carry on without saving.
  }
}

/** Something worth offering to resume: the customer got past the opening screens. */
export function hasMeaningfulProgress(p: WizardProgress | null): p is WizardProgress {
  return !!p && (p.stepIndex >= 0 || Object.values(p.measurements).some((v) => v.trim() !== ''));
}

/**
 * Photos are kept apart from the numbers: a few of them can fill the storage
 * quota, and when that happens the measurements must still save.
 */
export function loadPhotos(configurationId: string): Record<string, string> {
  try {
    const raw = storage()?.getItem(photoKey(configurationId));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function savePhotos(configurationId: string, photos: Record<string, string>) {
  try {
    storage()?.setItem(photoKey(configurationId), JSON.stringify(photos));
  } catch {
    // Too big to keep — they stay in memory for this visit.
  }
}

export function clearProgress(configurationId: string) {
  try {
    storage()?.removeItem(key(configurationId));
    storage()?.removeItem(photoKey(configurationId));
  } catch {
    // Nothing to do.
  }
}
