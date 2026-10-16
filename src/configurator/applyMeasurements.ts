/**
 * Turns the wizard's readings into panel widths for the chosen layout.
 *
 * Each measuring plan names its readings for that layout (front opening,
 * return depth, screen width…), so the mapping has to be per layout. A
 * generic "opening width" lookup only ever matched the two alcove plans and
 * silently left every other layout at its template sizes.
 *
 * Each set of bottom/middle/top readings resolves to its smallest, because
 * glass made to the widest point won't go in at the narrowest.
 */

import type { ConfiguratorPanel } from './types';

/** Below this a fixed panel beside a door isn't worth making — rebalance instead. */
const MIN_FIXED_MM = 200;

export function smallestOf(measurements: Record<string, number>, group: string): number | undefined {
  const readings = ['bottom', 'middle', 'top']
    .map((p) => measurements[`${group}-${p}`])
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0);
  return readings.length ? Math.min(...readings) : undefined;
}

/** Which reading sets size which panel, by template id and panel index. */
const PANEL_SOURCES: Record<string, (string | null)[]> = {
  'alcove-door': ['opening-width'],
  'walk-in': ['panel-width'],
  'walk-in-return': ['main-panel-width', 'return-panel-width'],
  // Side return first, then the door across the front — the template's order.
  'corner-door-return': ['return-depth', 'front-opening-width'],
  'over-bath': ['screen-width'],
};

/**
 * Returns new panels with measured widths applied. Panels with no matching
 * reading keep the template size; the customer can still change any of them
 * on the sizes step.
 */
export function applyMeasuredWidths(
  templateId: string,
  panels: ConfiguratorPanel[],
  measurements: Record<string, number>
): ConfiguratorPanel[] {
  const next = panels.map((p) => ({ ...p }));

  if (templateId === 'alcove-panel-door') {
    // Customer measures the whole opening; keep the door a usable width and
    // give the rest to the fixed panel.
    const total = smallestOf(measurements, 'opening-width');
    const doorIndex = next.findIndex((p) => p.kind === 'door');
    const fixedIndex = next.findIndex((p) => p.kind === 'fixed');
    if (total && doorIndex >= 0 && fixedIndex >= 0) {
      let door = next[doorIndex].width_mm;
      if (total - door < MIN_FIXED_MM) door = Math.round(total * 0.6);
      next[doorIndex].width_mm = door;
      next[fixedIndex].width_mm = total - door;
    }
    return next;
  }

  const sources = PANEL_SOURCES[templateId];
  if (sources) {
    sources.forEach((group, i) => {
      const width = group ? smallestOf(measurements, group) : undefined;
      if (width && next[i]) next[i].width_mm = width;
    });
    return next;
  }

  // Layouts without their own plan are measured as one opening. That only
  // sizes a panel unambiguously when there is exactly one.
  const opening = smallestOf(measurements, 'opening-width');
  if (opening && next.length === 1) next[0].width_mm = opening;
  return next;
}
