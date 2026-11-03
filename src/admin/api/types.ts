/**
 * What the admin worker answers with. The dashboard and its mock speak this
 * shape; the worker (admin-worker/worker.js) produces it.
 */

import type { ConfiguratorSpec } from '@/configurator/spec';
import type { ConfiguratorState, CustomerDetails } from '@/configurator/types';
import type { EnquiryPayload } from '@/configurator/submit';
import type { SiteImages } from '@/content/siteImages';

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

export interface SiteImagesState {
  manifest: SiteImages;
  manifestSha: string;
  repo: string;
  branch: string;
  files: { path: string; size: number }[];
  siteOrigin: string;
}

export interface PublishRequest {
  manifest: SiteImages;
  files: { path: string; contentBase64: string }[];
  removals: string[];
  message?: string;
}

export interface PublishResult {
  sha: string;
  url: string;
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
  /** Where the sign-in button sends the browser. */
  loginUrl(returnPath: string): string;
  me(): Promise<Me>;
  logout(): Promise<void>;
  listJobs(params?: { status?: JobStatus | null; q?: string }): Promise<JobsList>;
  getJob(id: string): Promise<JobDetail>;
  updateJob(id: string, patch: { status?: JobStatus; notes?: string }): Promise<JobDetail>;
  jobFileUrl(id: string, filename: string): string;
  listQuotes(params?: { status?: QuoteStatus | null; q?: string }): Promise<QuotesList>;
  updateQuote(id: string, patch: { status?: QuoteStatus; notes?: string }): Promise<Quote>;
  quoteFileUrl(id: string, filename: string): string;
  siteImages(): Promise<SiteImagesState>;
  publishImages(request: PublishRequest): Promise<PublishResult>;
  cloudflare(days: number): Promise<CloudflareSummary>;
  googleStatus(): Promise<GoogleStatus>;
  googleConnectUrl(): Promise<string>;
  googleSummary(days: number): Promise<GoogleSummary>;
  googleDisconnect(): Promise<void>;
}
