/**
 * Gemini photo recognition client for the configurator.
 *
 * Advisory only: customer-entered measurements always win. Gemini suggestions
 * are presented for the user to explicitly accept per field, never auto-applied.
 */

import { getTenant } from './tenant';

const GEMINI_TIMEOUT_MS = 25000; // Client-side timeout (worker has 20s)

export interface GeminiReading {
  value: number;
  unit: string;
  confidence: number;
  source: string;
}

export interface GeminiAnalyseResponse {
  available: boolean;
  readings?: GeminiReading[];
  notes?: string;
  reason?: string;
}

export interface GeminiConfig {
  panelCount?: number;
  mounting?: string;
  finish?: string;
  handle?: string;
  glass?: string;
  openingWidthMm?: number;
  heightMm?: number;
}

export interface GeminiSuggestResponse {
  available: boolean;
  config?: GeminiConfig;
  notes?: string;
  reason?: string;
}

interface GeminiImage {
  mimeType: string;
  data: string; // base64
}

/**
 * Convert a File or Blob to base64 for Gemini API.
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Prepare images for Gemini API from File objects.
 */
async function prepareImages(files: (File | Blob)[]): Promise<GeminiImage[]> {
  const images: GeminiImage[] = [];

  for (const file of files) {
    const mimeType = file.type || 'image/jpeg';
    const data = await fileToBase64(file);
    images.push({ mimeType, data });
  }

  return images;
}

/**
 * Call the worker's /analyse endpoint with measurement photos.
 *
 * Returns { available: false, reason } if:
 * - Gemini API key is not configured
 * - Request times out
 * - Validation fails
 * - API returns an error
 *
 * Returns { available: true, readings, notes } on success.
 */
export async function analysePhotos(
  files: (File | Blob)[],
  turnstileToken: string | null
): Promise<GeminiAnalyseResponse> {
  try {
    const tenant = getTenant();
    const workerUrl = tenant.designWorkerUrl || 'https://customshowers-design.vcwvk4sm9m.workers.dev';

    const images = await prepareImages(files);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const response = await fetch(`${workerUrl}/analyse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images, turnstileToken }),
      signal: controller.signal,
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        available: false,
        reason: `Worker returned ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { available: false, reason: 'Request timed out' };
    }
    return { available: false, reason: 'Network error' };
  }
}

/**
 * Call the worker's /suggest endpoint with a room photo.
 *
 * Returns { available: false, reason } if:
 * - Gemini API key is not configured
 * - Request times out
 * - Validation fails
 * - API returns an error
 *
 * Returns { available: true, config, notes } on success.
 */
export async function suggestConfiguration(
  files: (File | Blob)[],
  turnstileToken: string | null
): Promise<GeminiSuggestResponse> {
  try {
    const tenant = getTenant();
    const workerUrl = tenant.designWorkerUrl || 'https://customshowers-design.vcwvk4sm9m.workers.dev';

    const images = await prepareImages(files);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const response = await fetch(`${workerUrl}/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images, turnstileToken }),
      signal: controller.signal,
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        available: false,
        reason: `Worker returned ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { available: false, reason: 'Request timed out' };
    }
    return { available: false, reason: 'Network error' };
  }
}

/**
 * Helper to convert millimetres to a display unit with uncertainty.
 */
export function formatReading(reading: GeminiReading): string {
  const { value, unit, confidence } = reading;

  // Convert to mm if needed
  let valueMm = value;
  if (unit === 'cm') {
    valueMm = value * 10;
  } else if (unit === 'm') {
    valueMm = value * 1000;
  } else if (unit === 'inches' || unit === 'in') {
    valueMm = value * 25.4;
  }

  // Round based on confidence
  const rounded = confidence > 0.9 ? Math.round(valueMm) : Math.round(valueMm / 10) * 10;

  const confidencePct = Math.round(confidence * 100);
  return `${rounded}mm (${confidencePct}% confident)`;
}
