/**
 * Sending the enquiry.
 *
 * The drawings are rasterised in the browser before sending. Inline SVG is
 * unreliable in mail clients — Outlook and Gmail both strip or mangle it — so
 * the glazier gets PNG attachments that render anywhere, alongside a plain
 * HTML table that survives even when images are blocked.
 */

import { buildSpec, type ConfiguratorSpec } from './spec';
import { finishLabel, handleLabel, type TenantConfig } from './tenant';
import type { ConfiguratorState, CustomerDetails } from './types';

export interface EnquiryAttachment {
  filename: string;
  /** Base64 PNG, no data: prefix. */
  content: string;
}

export interface EnquiryPayload {
  tenantId: string;
  destinationEmail: string;
  customer: CustomerDetails;
  /**
   * Display-ready values for the email. Formatted here rather than in the
   * worker so units travel with the number and the worker stays a dumb
   * renderer.
   */
  summary: {
    runWidthMm: string;
    heightMm: string;
    panelCount: number;
    cornerCount: number;
    mounting: string;
    finish: string;
    handle: string;
    glass: string;
  };
  spec: ConfiguratorSpec;
  disclaimer: string;
  attachments: EnquiryAttachment[];
  turnstileToken: string | null;
  antispam: AntiSpamSignals;
}

export interface AntiSpamSignals {
  /** Hidden field. Any content means a bot filled it in. */
  honeypot: string;
  /** Milliseconds between opening the configurator and pressing send. */
  elapsedMs: number;
}

/**
 * Rasterise a live <svg> element to a base64 PNG.
 *
 * Scaled 2x so panel dimensions stay legible when the glazier zooms in on a
 * phone. Resolves to null rather than throwing — a missing drawing should
 * never block an enquiry, since the spec table carries the same numbers.
 */
export async function svgToPngBase64(svg: SVGSVGElement, scale = 2): Promise<string | null> {
  try {
    const width = Number(svg.getAttribute('width')) || svg.clientWidth;
    const height = Number(svg.getAttribute('height')) || svg.clientHeight;
    if (!width || !height) return null;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    // Mail clients render on white; the app may be on a tinted surface.
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(width));
    bg.setAttribute('height', String(height));
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);

    const source = new XMLSerializer().serializeToString(clone);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;

    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('svg load failed'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/png').split(',')[1] ?? null;
  } catch {
    return null;
  }
}

export function buildEnquiryPayload(
  tenant: TenantConfig,
  state: ConfiguratorState,
  customer: CustomerDetails,
  attachments: EnquiryAttachment[],
  turnstileToken: string | null,
  antispam: AntiSpamSignals
): EnquiryPayload {
  const spec = buildSpec(state);
  return {
    tenantId: tenant.id,
    destinationEmail: tenant.destinationEmail,
    customer,
    summary: {
      // Units included here rather than left to the reader: this lands in a
      // workshop inbox and a bare "1500" is one careless glance from a
      // mis-cut panel.
      runWidthMm: `${spec.totalRunWidthMm}mm`,
      heightMm: `${spec.heightMm}mm${spec.isFloorToCeiling ? ' (floor to ceiling)' : ''}`,
      panelCount: spec.panels.length,
      cornerCount: spec.cornerCount,
      mounting: state.mounting === 'channel' ? 'U-channel' : 'Glass clamps',
      finish: finishLabel(tenant, state.finishId),
      handle: handleLabel(tenant, state.handleId),
      glass: `${state.glassThicknessMm}mm toughened`,
    },
    spec,
    disclaimer: tenant.measurementDisclaimer,
    attachments,
    turnstileToken,
    antispam,
  };
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

export async function submitEnquiry(
  endpoint: string,
  payload: EnquiryPayload
): Promise<SubmitResult> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // The worker returns a readable reason for the cases a customer can act
      // on, like being rate limited or failing the challenge.
      const body = await res.json().catch(() => null);
      // eslint-disable-next-line no-console
      console.error(`[configurator] ${endpoint} returned ${res.status}`, body);
      return { ok: false, error: body?.error ?? `Send failed (${res.status})` };
    }

    return { ok: true };
  } catch (e) {
    // fetch only throws before it gets a reply at all: the hostname does not
    // resolve, the CORS preflight was refused, or the connection dropped. That
    // is a very different fault from the server returning an error, so name the
    // endpoint in the console — otherwise diagnosing it means guessing.
    // eslint-disable-next-line no-console
    console.error(`[configurator] could not reach ${endpoint}`, e);
    return {
      ok: false,
      error: 'We could not reach our server. Check your connection and try again.',
    };
  }
}
