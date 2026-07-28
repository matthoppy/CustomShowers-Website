/**
 * Sending the enquiry.
 *
 * The drawings are rasterised in the browser before sending. Inline SVG is
 * unreliable in mail clients — Outlook and Gmail both strip or mangle it — so
 * the glazier gets PNG attachments that render anywhere, alongside a plain
 * HTML table that survives even when images are blocked.
 */

import { supabase } from '@/integrations/supabase/client';
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
  summary: {
    runWidthMm: number;
    heightMm: number;
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
  attachments: EnquiryAttachment[]
): EnquiryPayload {
  const spec = buildSpec(state);
  return {
    tenantId: tenant.id,
    destinationEmail: tenant.destinationEmail,
    customer,
    summary: {
      runWidthMm: spec.totalRunWidthMm,
      heightMm: spec.heightMm,
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
  };
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

export async function submitEnquiry(payload: EnquiryPayload): Promise<SubmitResult> {
  try {
    const { error } = await supabase.functions.invoke('send-design-enquiry', {
      body: payload,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong' };
  }
}
