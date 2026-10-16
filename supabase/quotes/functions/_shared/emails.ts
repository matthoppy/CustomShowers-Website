// Email bodies. Plain, table-based HTML so they survive every mail client.

import { adminUrl, customerUrl, esc, extrasTotal, gbp, type QuoteRow } from './util.ts';

const wrap = (body: string) => `<!doctype html><html><body style="margin:0;background:#f1f5f9;">
<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:15px;line-height:1.5;">
<div style="background:#ffffff;border-radius:8px;padding:28px;">${body}</div>
<p style="color:#64748b;font-size:12px;text-align:center;margin-top:16px;">Custom Showers · Frameless shower glass, supply only</p>
</div></body></html>`;

const button = (href: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${esc(href)}" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold;">${esc(label)}</a></p>`;

const TD = 'style="padding:6px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top;"';
const TDR = 'style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;vertical-align:top;"';

function priceTable(q: QuoteRow, withExtras = false): string {
  if (!q.price) return '';
  const rows = q.price.lines
    .map((l) => `<tr><td ${TD}>${esc(l.description)}${l.qty > 1 ? ` × ${l.qty}` : ''}</td><td ${TDR}>${gbp(l.total_pence)}</td></tr>`)
    .join('');
  const extras = withExtras && q.extras.length
    ? q.extras.map((e) => `<tr><td ${TD}>${esc(e.name)} × ${e.qty}</td><td ${TDR}>${gbp(e.total_pence)}</td></tr>`).join('')
    : '';
  const total = q.price.total_pence + (withExtras ? extrasTotal(q.extras) : 0);
  return `<table style="border-collapse:collapse;width:100%;font-size:14px;">
${rows}
<tr><td ${TD}>VAT (${Math.round(q.price.vat_rate * 100)}%)</td><td ${TDR}>${gbp(q.price.vat_pence)}</td></tr>
${extras ? `<tr><td colspan="2" style="padding:12px 8px 4px;font-weight:bold;">Extras (inc VAT)</td></tr>${extras}` : ''}
<tr><td style="padding:10px 8px;font-weight:bold;">Total</td><td style="padding:10px 8px;text-align:right;font-weight:bold;">${gbp(total)}</td></tr>
</table>`;
}

function sizesTable(q: QuoteRow): string {
  const rows = q.design.spec.panels
    .map(
      (p) => `<tr><td ${TD}>${esc(p.label)}</td><td ${TDR}>${p.tightWidthMm} × ${p.tightHeightMm}mm</td><td ${TDR}>${p.cutWidthMm} × ${p.cutHeightMm}mm</td></tr>`
    )
    .join('');
  return `<table style="border-collapse:collapse;width:100%;font-size:14px;">
<tr><th ${TD} align="left">Panel</th><th ${TDR}>Your measurement</th><th ${TDR}>Glass size</th></tr>${rows}</table>`;
}

// -----------------------------------------------------------------------------
// Supplier order — written to be forwarded as it stands.
// -----------------------------------------------------------------------------

const GLASS: Record<string, string> = {
  clear: 'Clear',
  'low-iron': 'Low-iron (extra clear)',
  satin: 'Satin / acid-etched',
  bronze: 'Bronze tint',
  grey: 'Grey tint',
};

export function supplierOrderText(q: QuoteRow): string {
  const s = q.design.spec;
  const st = q.design.state as Record<string, unknown>;
  const lines: string[] = [];
  lines.push(`GLASS ORDER — ${q.ref}`);
  lines.push(`${s.glassThicknessMm}mm toughened ${GLASS[String(st.glassType)] ?? st.glassType}, fully polished edges`);
  if (st.glassCoating === 'easy-clean') lines.push('Easy-clean coating: YES');
  lines.push('');
  s.panels.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.label} — ${p.cutWidthMm} (W) × ${p.cutHeightMm} (H) mm — qty 1 — ${p.kind === 'door' ? 'DOOR' : 'fixed panel'}`);
    for (const n of p.notches) lines.push(`   Notch ${n.corner.toLowerCase()}: ${n.widthMm} × ${n.heightMm}mm`);
    if (p.door) {
      const hp = p.door.hingePlacement;
      lines.push(
        `   Hinges on ${p.door.hingeSide} edge (${p.door.hingeBrand})` +
          (hp?.topHingeOffset ? ` — centres ${hp.topHingeOffset}mm from top, ${hp.bottomHingeOffset}mm from bottom` : '')
      );
      lines.push(`   Handle holes on ${p.door.hingeSide === 'left' ? 'right' : 'left'} edge`);
    }
  });
  lines.push('');
  lines.push(`Total glass weight approx ${Math.round(s.totalGlassWeightKg)}kg`);
  return lines.join('\n');
}

function pickList(q: QuoteRow): string {
  const s = q.design.spec;
  const sum = q.design.summary ?? {};
  const doors = s.panels.filter((p) => p.door);
  const items: string[] = [];
  items.push(`Finish: ${sum.finish ?? '—'}`);
  if (doors.length) {
    items.push(`Hinges: ${doors.map((d) => `${d.door!.hingeBrand} (${d.cutHeightMm > 2000 ? 3 : 2})`).join(', ')}`);
    items.push(`Handle: ${sum.handle ?? '—'} × ${doors.length}`);
    items.push(`Door seals: ${doors.map((d) => d.door!.sealType).join(', ')}`);
  }
  if (s.mounting === 'channel') items.push(`U-channel: ${(s.totalChannelLengthMm / 1000).toFixed(2)}m`);
  else items.push('Mounting: glass clamps');
  if (s.support?.supportBarRequired) items.push('Support bar: REQUIRED');
  for (const e of q.extras) items.push(`Extra: ${e.name} × ${e.qty}`);
  return items.map((i) => `<li>${esc(i)}</li>`).join('');
}

function deliveryBlock(q: QuoteRow): string {
  const d = q.delivery;
  if (!d?.address) return '<p>No delivery address captured — check Stripe.</p>';
  const a = d.address;
  const parts = [d.name, a.line1, a.line2, a.city, a.state, a.postal_code, a.country].filter(Boolean).map(esc);
  return `<p style="margin:0;">${parts.join('<br>')}${d.phone ? `<br>Tel ${esc(d.phone)}` : ''}</p>`;
}

// -----------------------------------------------------------------------------
// Messages
// -----------------------------------------------------------------------------

export function adminNewQuote(q: QuoteRow) {
  const c = q.customer;
  return {
    subject: `New design ${q.ref} from ${c.name}${c.postcode ? ` (${c.postcode})` : ''} — price to check`,
    html: wrap(`<h2 style="margin-top:0;">New design to price</h2>
<p><strong>${esc(c.name)}</strong> · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>${c.phone ? ` · ${esc(c.phone)}` : ''}${c.postcode ? ` · ${esc(c.postcode)}` : ''}</p>
${c.notes ? `<p style="background:#f8fafc;padding:10px;border-radius:6px;white-space:pre-wrap;">${esc(c.notes)}</p>` : ''}
<p>Suggested price: <strong>${q.suggested_price ? gbp(q.suggested_price.total_pence) : '—'}</strong> inc VAT. Check it, change anything, then send it to the customer.</p>
${button(adminUrl(q), 'Review and send price')}
${sizesTable(q)}
<p style="color:#64748b;font-size:13px;">Drawings, site readings and any tape photos are attached.</p>`),
  };
}

export function customerReceived(q: QuoteRow) {
  return {
    subject: `We’ve got your shower design (${q.ref})`,
    html: wrap(`<h2 style="margin-top:0;">Thanks, ${esc(q.customer.name.split(' ')[0])}</h2>
<p>We’ve received your design and measurements. We’ll check everything and email your price, usually within one working day.</p>
${sizesTable(q)}
<p style="color:#64748b;font-size:13px;">Reference ${esc(q.ref)}. Just reply to this email if you have any questions.</p>`),
  };
}

export function customerPrice(q: QuoteRow) {
  return {
    subject: `Your shower glass price — ${q.ref}`,
    html: wrap(`<h2 style="margin-top:0;">Your price is ready</h2>
<p>Hi ${esc(q.customer.name.split(' ')[0])}, here’s the price for your frameless shower glass.</p>
${q.price_note ? `<p style="background:#f8fafc;padding:10px;border-radius:6px;white-space:pre-wrap;">${esc(q.price_note)}</p>` : ''}
${priceTable(q)}
<p>Next, please check your sizes carefully. Glass is made to measure and can’t be cut down once it’s toughened.</p>
${button(customerUrl(q), 'Check sizes and order')}
<p style="color:#64748b;font-size:13px;">Reference ${esc(q.ref)}. Reply to this email if anything looks wrong.</p>`),
  };
}

export function adminChangeRequest(q: QuoteRow) {
  return {
    subject: `${q.ref}: ${q.customer.name} asked for a change`,
    html: wrap(`<h2 style="margin-top:0;">Change requested</h2>
<p style="background:#fffbeb;border:1px solid #fcd34d;padding:12px;border-radius:6px;white-space:pre-wrap;">${esc(q.change_request)}</p>
<p>Reply to the customer, update the price if needed, and send it again.</p>
${button(adminUrl(q), 'Open quote')}`),
  };
}

export function adminPaid(q: QuoteRow, supplierText: string) {
  const paid = q.amount_paid_pence ?? 0;
  return {
    subject: `PAID ${q.ref} — ${gbp(paid)} — glass order ready for supplier`,
    html: wrap(`<h2 style="margin-top:0;">Paid — ready to order</h2>
<p><strong>${esc(q.customer.name)}</strong> paid <strong>${gbp(paid)}</strong>.</p>
<h3 style="margin-bottom:6px;">Forward to the glass supplier</h3>
<pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;font-family:Menlo,Consolas,monospace;font-size:13px;white-space:pre-wrap;">${esc(supplierText)}</pre>
<h3 style="margin-bottom:6px;">Deliver to</h3>
${deliveryBlock(q)}
<h3 style="margin-bottom:6px;">Hardware and extras to pick</h3>
<ul>${pickList(q)}</ul>
${q.design.spec.warnings?.length ? `<h3 style="margin-bottom:6px;">Warnings</h3><ul>${q.design.spec.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
${button(adminUrl(q), 'Open order')}
<p style="color:#64748b;font-size:13px;">Drawings and the customer’s site readings are attached.</p>`),
  };
}

export function customerPaid(q: QuoteRow) {
  return {
    subject: `Order confirmed — ${q.ref}`,
    html: wrap(`<h2 style="margin-top:0;">Thank you, your order is confirmed</h2>
<p>We’ve received your payment and will order your glass now. We’ll be in touch with a delivery date.</p>
${priceTable(q, true)}
${sizesTable(q)}
${button(customerUrl(q), 'View your order')}
<p style="color:#64748b;font-size:13px;">Reference ${esc(q.ref)}.</p>`),
  };
}
