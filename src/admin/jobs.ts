/**
 * Reading a stored job: what to call its photos, and the fitting information
 * the sheet and the detail page both need.
 */

import type { JobAttachment, JobDetail } from './api/types';

/** The photo's slot, from the filename the designer gave it. */
export function attachmentLabel(a: JobAttachment): string {
  const f = a.filename.replace(/\.(jpe?g|png|webp)$/i, '');
  const run = /-run(\d+)$/.exec(f);
  const suffix = run ? ` (run ${run[1]})` : '';
  if (f === 'plan-view') return 'Plan';
  if (f === 'elevation-view') return 'Elevation';
  if (f.startsWith('measured-width-at-floor')) return `Width at the floor${suffix}`;
  if (f === 'measured-height') return 'Height';
  if (f === 'measured-wall-lean') return 'Wall lean';
  if (f === 'measured-floor-level') return 'Floor level';
  if (f.startsWith('photo')) return 'The room';
  return a.filename;
}

/** A line for the email subject or a heading: who and what. */
export function jobTitle(job: JobDetail): string {
  return `${job.customer.name || 'Customer'} · ${job.headline || job.id}`;
}

export function mailtoCustomer(job: JobDetail): string {
  if (!job.customer.email) return '#';
  const subject = encodeURIComponent(`Your shower design ${job.id}`);
  return `mailto:${job.customer.email}?subject=${subject}`;
}
