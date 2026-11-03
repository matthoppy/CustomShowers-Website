/**
 * What the admin worker answers with. The dashboard and its mock speak this
 * shape; the worker (admin-worker/worker.js) produces it.
 */

import type { ConfiguratorSpec } from '@/configurator/spec';
import type { ConfiguratorState, CustomerDetails } from '@/configurator/types';
import type { EnquiryPayload } from '@/configurator/submit';
import type { JobTypeId, SiteImages } from '@/content/siteImages';

export type JobStatus = 'new' | 'reviewing' | 'quoted' | 'ordered' | 'done' | 'closed';
export const JOB_STATUSES: JobStatus[] = ['new', 'reviewing', 'quoted', 'ordered', 'done', 'closed'];

export type QuoteStatus = 'new' | 'replied' | 'won' | 'lost' | 'closed';
export const QUOTE_STATUSES: QuoteStatus[] = ['new', 'replied', 'won', 'lost', 'closed'];

export interface JobAttachment {
  filename: string;
  key: string;
  bytes: number;
  kind: 'drawing' | 'measurement' | 'photo';
}

export interface JobFlags {
  tooFast?: boolean;
  challengeSkipped?: boolean;
  filesStored?: boolean;
  fileStore?: 'r2' | 'kv' | null;
}

export interface JobSummary {
  id: string;
  createdAt: string;
  updatedAt?: string | null;
  customer: { name: string | null; email: string | null; phone: string | null; postcode: string | null };
  status: JobStatus;
  headline: string | null;
  attachments: JobAttachment[];
  flags: JobFlags;
  emailed: boolean;
}

export interface JobEvent {
  id: number;
  at: string;
  actor: string | null;
  kind: 'received' | 'status' | 'note' | string;
  detail: string | null;
}

export interface JobPayload {
  customer: CustomerDetails;
  summary: EnquiryPayload['summary'];
  spec: ConfiguratorSpec;
  disclaimer: string;
  antispam?: { honeypot: string; elapsedMs: number };
  /** The design as the configurator held it; null for jobs kept before it was sent. */
  design: ConfiguratorState | null;
}

export interface JobDetail extends JobSummary {
  notes: string;
  summary: EnquiryPayload['summary'];
  payload: JobPayload;
  events: JobEvent[];
}

export interface JobsList {
  jobs: JobSummary[];
  counts: Partial<Record<JobStatus, number>>;
}

export interface QuotePhoto {
  filename: string;
  key: string;
  bytes: number;
  type: string;
}

export interface Quote {
  id: string;
  createdAt: string;
  updatedAt?: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  serviceType: string | null;
  message: string | null;
  photo: QuotePhoto | null;
  utm: Record<string, string | null>;
  status: QuoteStatus;
  notes: string | null;
  emailed: boolean;
}

export interface QuotesList {
  quotes: Quote[];
  counts: Partial<Record<QuoteStatus, number>>;
}

export interface Me {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  repo: string;
  branch: string;
  siteOrigin: string;
  capabilities: {
    files: 'r2' | 'kv' | null;
    cloudflare: boolean;
    google: 'unconfigured' | 'disconnected' | 'connected';
  };
  version: string;
}

export interface SitePhotosState {
  manifest: SiteImages;
  repo: string;
  branch: string;
  siteOrigin: string;
  /** Whether the signed-in GitHub account may push to the repository. */
  canPublish: boolean;
}

/**
 * One change to the website photos: a gallery job added, updated or deleted,
 * or one of the page pictures replaced or re-described. Photos are paths
 * already on the site, or "new:<n>" for the nth blob uploaded just before.
 * A job being updated or deleted is identified by what it looked like when
 * the editor opened it, so a job someone else changed meanwhile is refused.
 */
export type PhotoChange =
  | { kind: 'job'; mode: 'add'; type: JobTypeId; title: string; photos: string[] }
  | { kind: 'job'; mode: 'update'; type: JobTypeId; title: string; photos: string[]; origType: JobTypeId; origIndex: number; origJson: string }
  | { kind: 'job'; mode: 'delete'; origType: JobTypeId; origIndex: number; origJson: string }
  | { kind: 'slot'; slot: 'hero' | 'about'; index?: number; alt: string; photo: string | null };

export interface PublishPhotosRequest {
  change: PhotoChange;
  blobs: { sha: string }[];
  message?: string;
}

export interface PublishResult {
  /** Null when the change turned out to change nothing. */
  sha: string | null;
  url: string | null;
  unchanged?: boolean;
  manifest: SiteImages;
  /** The site paths the uploaded photos were given, in upload order. */
  newPaths: string[];
}

export interface TrafficDay {
  date: string;
  requests: number;
  pageViews: number;
  visitors: number;
  threats: number;
  bytes: number;
}

export interface Deployment {
  id: string;
  createdAt: string;
  environment: 'production' | 'preview' | string;
  branch: string | null;
  commit: string | null;
  message: string | null;
  stage: string | null;
  status: string | null;
  url: string;
}

export interface CloudflareSummary {
  configured: { token: boolean; zone: boolean; account: boolean };
  days: TrafficDay[];
  totals: Omit<TrafficDay, 'date'> | null;
  workers: { name: string; requests: number; errors: number }[];
  deployments: Deployment[];
  errors: Record<string, string>;
}

export interface GoogleLocation {
  account: string;
  name: string;
  title: string;
  address: string | null;
  mapsUri: string | null;
  newReviewUri: string | null;
}

export interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  location: GoogleLocation | null;
  redirectUri?: string;
}

export interface GoogleReview {
  id: string;
  name: string;
  photo: string | null;
  rating: number | null;
  comment: string;
  at: string;
  replied: boolean;
}

export interface GoogleSummary {
  configured: boolean;
  connected: boolean;
  location?: GoogleLocation;
  metrics?: {
    days: number;
    totals: { impressions: number; calls: number; websiteClicks: number; directions: number; messages: number };
    daily: { date: string; impressions: number; calls: number; websiteClicks: number; directions: number }[];
  } | null;
  reviews?: { averageRating: number | null; total: number; items: GoogleReview[] } | null;
  errors?: Record<string, string>;
}

export interface AdminApi {
  /** Where the sign-in button sends the browser, or the popup when asked for one. */
  loginUrl(returnPath: string, popup?: boolean): string;
  me(): Promise<Me>;
  logout(): Promise<void>;
  listJobs(params?: { status?: JobStatus | null; q?: string }): Promise<JobsList>;
  getJob(id: string): Promise<JobDetail>;
  updateJob(id: string, patch: { status?: JobStatus; notes?: string }): Promise<JobDetail>;
  jobFileUrl(id: string, filename: string): string;
  listQuotes(params?: { status?: QuoteStatus | null; q?: string }): Promise<QuotesList>;
  updateQuote(id: string, patch: { status?: QuoteStatus; notes?: string }): Promise<Quote>;
  quoteFileUrl(id: string, filename: string): string;
  sitePhotos(): Promise<SitePhotosState>;
  /** One shrunk JPEG, as base64, becomes a blob in the repository. */
  uploadPhoto(contentBase64: string): Promise<{ sha: string; bytes: number }>;
  publishPhotos(request: PublishPhotosRequest): Promise<PublishResult>;
  cloudflare(days: number): Promise<CloudflareSummary>;
  googleStatus(): Promise<GoogleStatus>;
  googleConnectUrl(): Promise<string>;
  googleSummary(days: number): Promise<GoogleSummary>;
  googleDisconnect(): Promise<void>;
}
