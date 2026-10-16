/**
 * Suggestion service — analyzes photo markup and returns suggested configurations.
 *
 * Current implementation is a MOCK that generates deterministic suggestions from
 * the opening width and aspect ratio. Production implementation would call the
 * /suggest endpoint with optional Gemini or FLUX rendering.
 */

import type { ConfiguratorState } from './types';
import { TEMPLATES } from './templates';

interface Point {
  x: number;
  y: number;
}

export interface Suggestion {
  id: string;
  name: string;
  reason: string;
  state: Partial<ConfiguratorState>;
}

export interface SuggestionRequest {
  corners: Point[];
  knownWidthMm: number;
}

export interface SuggestionProvider {
  getSuggestions(request: SuggestionRequest): Promise<Suggestion[]>;
}

function calculateAspectRatio(corners: Point[]): number {
  if (corners.length !== 4) return 1;

  const width = Math.abs(corners[1].x - corners[0].x);
  const height = Math.abs(corners[2].y - corners[1].y);

  return height / width;
}

class MockSuggestionProvider implements SuggestionProvider {
  async getSuggestions(request: SuggestionRequest): Promise<Suggestion[]> {
    const { corners, knownWidthMm } = request;
    const aspectRatio = calculateAspectRatio(corners);
    const suggestions: Suggestion[] = [];

    if (knownWidthMm <= 800) {
      const alcoveTemplate = TEMPLATES.find((t) => t.id === 'alcove-door');
      if (alcoveTemplate) {
        suggestions.push({
          id: 'alcove-door',
          name: 'Single door',
          reason: 'The opening is narrow enough for a single door between the walls.',
          state: {
            panels: structuredClone(alcoveTemplate.panels).map((p) => ({
              ...p,
              width_mm: knownWidthMm - 20,
            })),
            junctions: structuredClone(alcoveTemplate.junctions),
            leftWall: true,
            rightWall: true,
          },
        });
      }
    } else {
      const panelDoorTemplate = TEMPLATES.find((t) => t.id === 'alcove-panel-door');
      if (panelDoorTemplate) {
        const panelWidth = Math.floor(knownWidthMm * 0.35);
        const doorWidth = knownWidthMm - panelWidth - 20;
        suggestions.push({
          id: 'alcove-panel-door',
          name: 'Panel and door',
          reason: 'The opening width works well with a fixed panel beside the door.',
          state: {
            panels: [
              { ...structuredClone(panelDoorTemplate.panels[0]), width_mm: panelWidth },
              { ...structuredClone(panelDoorTemplate.panels[1]), width_mm: doorWidth },
            ],
            junctions: structuredClone(panelDoorTemplate.junctions),
            leftWall: true,
            rightWall: true,
          },
        });
      }
    }

    if (aspectRatio > 0.7) {
      const cornerTemplate = TEMPLATES.find((t) => t.id === 'corner-door-return');
      if (cornerTemplate) {
        const returnWidth = Math.floor(knownWidthMm * 0.4);
        const doorWidth = Math.min(knownWidthMm - 100, 800);
        suggestions.push({
          id: 'corner-door-return',
          name: 'Corner enclosure',
          reason: 'The space looks like a corner — this puts a side panel returning to the wall.',
          state: {
            panels: [
              { ...structuredClone(cornerTemplate.panels[0]), width_mm: returnWidth },
              { ...structuredClone(cornerTemplate.panels[1]), width_mm: doorWidth },
            ],
            junctions: structuredClone(cornerTemplate.junctions),
            leftWall: true,
            rightWall: true,
          },
        });
      }
    }

    const walkInTemplate = TEMPLATES.find((t) => t.id === 'walk-in');
    if (walkInTemplate && knownWidthMm >= 700) {
      suggestions.push({
        id: 'walk-in',
        name: 'Walk-in screen',
        reason: 'A fixed panel with no door — open walk-in access.',
        state: {
          panels: [
            {
              ...structuredClone(walkInTemplate.panels[0]),
              width_mm: Math.min(knownWidthMm - 300, 1000),
            },
          ],
          junctions: [],
          leftWall: true,
          rightWall: false,
        },
      });
    }

    return suggestions.slice(0, 3);
  }
}

export const mockSuggestionProvider = new MockSuggestionProvider();

export const USE_MOCK_SUGGESTIONS = true;

export async function getSuggestions(request: SuggestionRequest): Promise<Suggestion[]> {
  if (USE_MOCK_SUGGESTIONS) {
    return mockSuggestionProvider.getSuggestions(request);
  }

  const response = await fetch('/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Suggestion service failed: ${response.statusText}`);
  }

  return response.json();
}
