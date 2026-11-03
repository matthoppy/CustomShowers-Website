/**
 * A stand-in for the admin worker, for working on the dashboard without a
 * server. Switched on with ?mock=1 (remembered for the tab) and used by the
 * browser tests.
 *
 * The sample jobs are made with the real configurator engine, so what the
 * job pages show is exactly what a real enquiry carries: the spec with cut
 * sizes and hinges, the summary, the drawings redrawn from the design.
 */

import { runPanelIndices, runWidthsMm } from '@/configurator/geometry';
import { scaleRunPanels } from '@/configurator/layout';
import { applyCrossReadings, applyFloorReadings, createOpeningMeasurements } from '@/configurator/measure';
import { buildEnquiryPayload } from '@/configurator/submit';
import { getTemplate } from '@/configurator/templates';
import { getTenant } from '@/configurator/tenant';
import { createInitialState, type ConfiguratorState, type CustomerDetails } from '@/configurator/types';
import { siteImages, type SiteImages } from '@/content/siteImages';
import { applyPhotoChange, normaliseManifest } from '../photos';
import type {
  AdminApi,
  CloudflareSummary,
  GoogleSummary,
  JobDetail,
  JobEvent,
  Quote,
  SitePhotosState,
} from './types';

const tenant = getTenant();

function stateFrom(templateId: string): ConfiguratorState {
  const t = getTemplate(templateId)!;
  const panels = structuredClone(t.panels);
  const junctions = structuredClone(t.junctions);
  const state = createInitialState(tenant.glassThicknessMm);
  return {
    ...state,
    panels,
    junctions,
    leftWall: t.leftWall,
    rightWall: t.rightWall,
    heightMm: t.heightMm ?? state.heightMm,
    opening: createOpeningMeasurements(runWidthsMm(panels, junctions)),
  };
}

function customer(name: string, email: string, phone: string, postcode: string, notes = ''): CustomerDetails {
  return { name, email, phone, postcode, notes, measurementsAcknowledged: true };
}

/** Door only, laser, to the ceiling: the eight-reading cross. */
function doorOnlyJob(): ConfiguratorState {
  let s = stateFrom('alcove-door');
  s = { ...s, isFloorToCeiling: true, topGapMm: 30, opening: { ...s.opening, method: 'laser' } };
  const opening = applyCrossReadings(s.opening, {
    leftBottomMm: 400,
    leftTopMm: 397,
    rightBottomMm: 398,
    rightTopMm: 398,
    floorLeftMm: 1000,
    floorRightMm: 1004,
    ceilingLeftMm: 1400,
    ceilingRightMm: 1398,
  });
  const runs = runPanelIndices(s.panels, s.junctions);
  return {
    ...s,
    opening: { ...opening, shapeConfirmed: true },
    panels: scaleRunPanels(s.panels, runs[0], opening.runs[0].widthAtFloorMm),
    heightMm: (opening.ceilingHeightMm ?? 2400) - 30,
    finishId: 'matte-black',
  };
}

/** Panel and door, tape, a leaning wall, a sloping floor, an upstand. */
function panelDoorJob(): ConfiguratorState {
  const s = stateFrom('alcove-panel-door');
  const runs = runPanelIndices(s.panels, s.junctions);
  const run0 = applyFloorReadings(
    { ...s.opening.runs[0], halfAMm: 612, halfBMm: 598, widthAtFloorMm: 1210, widthAtTopCheckMm: 1204 },
    0,
    4
  );
  const panels = scaleRunPanels(s.panels, runs[0], 1210).map((p, i) =>
    i === 0 ? { ...p, notches: { bottom_left: true, bottom_right: false, width_mm: 40, height_mm: 60 } } : p
  );
  return {
    ...s,
    panels,
    opening: {
      ...s.opening,
      method: 'packers',
      runs: [run0],
      startWall: { gapBottomMm: 6, gapMiddleMm: null, gapTopMm: 0 },
      endWall: { gapBottomMm: 0, gapMiddleMm: null, gapTopMm: 0 },
      aboveGlass: 'clear',
      shapeConfirmed: true,
    },
    finishId: 'brushed-nickel',
    handleId: 'knob',
  };
}

/** Corner, door and side, laser, with a ceiling that slopes along the front. */
function cornerJob(): ConfiguratorState {
  const s = stateFrom('corner-door-return');
  const runs = runPanelIndices(s.panels, s.junctions);
  let panels = scaleRunPanels(s.panels, runs[0], 800);
  panels = scaleRunPanels(panels, runs[1], 1250);
  const r0 = applyFloorReadings({ ...s.opening.runs[0], widthAtFloorMm: 800, ceilingStartMm: 2400, ceilingEndMm: 2400 }, 1000, 1002);
  const r1 = applyFloorReadings(
    { ...s.opening.runs[1], halfAMm: 600, halfBMm: 650, widthAtFloorMm: 1250, ceilingStartMm: 2400, ceilingEndMm: 2380 },
    1000,
    1000
  );
  return {
    ...s,
    panels,
    isFloorToCeiling: true,
    aboveDoor: 'open',
    doorHeightMm: 2000,
    heightMm: 2400,
    opening: {
      ...s.opening,
      method: 'laser',
      runs: [r0, r1],
      startWall: { gapBottomMm: 50, gapMiddleMm: null, gapTopMm: 50 },
      endWall: { gapBottomMm: 50, gapMiddleMm: null, gapTopMm: 54 },
      shapeConfirmed: true,
    },
    mounting: 'clamps',
    finishId: 'satin-brass',
  };
}

function job(
  id: string,
  createdAt: string,
  design: ConfiguratorState,
  who: CustomerDetails,
  status: JobDetail['status'],
  extras: { notes?: string; events?: JobEvent[]; photos?: string[]; flags?: JobDetail['flags'] } = {}
): JobDetail {
  const payload = buildEnquiryPayload(tenant, design, who, [], null, { honeypot: '', elapsedMs: 540000 });
  const attachments: JobDetail['attachments'] = [
    { filename: 'plan-view.png', key: `jobs/${id}/plan-view.png`, bytes: 48210, kind: 'drawing' },
    { filename: 'elevation-view.png', key: `jobs/${id}/elevation-view.png`, bytes: 61044, kind: 'drawing' },
    ...(extras.photos || []).map((f, i) => ({
      filename: f,
      key: `jobs/${id}/${f}`,
      bytes: 240000 + i * 17000,
      kind: (f.startsWith('measured-') ? 'measurement' : 'photo') as 'measurement' | 'photo',
    })),
  ];
  const headline = [
    `${payload.spec.panels.length} panel${payload.spec.panels.length === 1 ? '' : 's'}`,
    `${payload.summary.runWidthMm} wide`,
    `${payload.summary.heightMm} tall`,
    payload.summary.finish,
  ].join(' · ');
  return {
    id,
    createdAt,
    updatedAt: null,
    customer: { name: who.name, email: who.email, phone: who.phone, postcode: who.postcode },
    status,
    headline,
    attachments,
    flags: extras.flags || { tooFast: false, challengeSkipped: false, filesStored: true, fileStore: 'kv' },
    emailed: true,
    notes: extras.notes || '',
    summary: payload.summary,
    payload: {
      customer: who,
      summary: payload.summary,
      spec: payload.spec,
      disclaimer: payload.disclaimer,
      antispam: payload.antispam,
      design,
    },
    events: [
      { id: 1, at: createdAt, actor: 'customer', kind: 'received', detail: 'Sent from the designer' },
      ...(extras.events || []),
    ],
  };
}

const MOCK_PHOTOS: Record<string, string> = {
  'measured-height.jpg': '/images/site/gallery-1.jpg',
  'measured-width-at-floor-run1.jpg': '/images/site/gallery-2.jpg',
  'measured-wall-lean.jpg': '/images/site/gallery-3.jpg',
  'photo-1.jpg': '/images/site/gallery-4.jpg',
  'photo-2.jpg': '/images/shower-inline-2.JPG',
  'sketch.jpg': '/images/shower-screen-2.JPG',
};

function buildJobs(): JobDetail[] {
  const today = new Date();
  const daysAgo = (d: number, h = 10) => new Date(today.getTime() - d * 86400000 + h * 3600000 - today.getHours() * 3600000).toISOString();
  return [
    job('CS-20261103-K7PQ', daysAgo(0, 9), doorOnlyJob(), customer('Sarah Whitfield', 'sarah.w@example.com', '07700 900123', 'SW6 4LN', 'Ceiling slopes slightly, photos attached.'), 'new', {
      photos: ['measured-height.jpg', 'measured-width-at-floor-run1.jpg', 'photo-1.jpg'],
    }),
    job('CS-20261101-M4XD', daysAgo(2, 15), panelDoorJob(), customer('Tom Okafor', 'tom.okafor@example.com', '07700 900456', 'N8 9PL'), 'reviewing', {
      notes: 'Called Tom: confirm the upstand height before cutting.',
      photos: ['measured-wall-lean.jpg', 'photo-2.jpg'],
      events: [
        { id: 2, at: daysAgo(1, 11), actor: 'matthoppy', kind: 'status', detail: 'new → reviewing' },
        { id: 3, at: daysAgo(1, 11), actor: 'matthoppy', kind: 'note', detail: 'Called Tom: confirm the upstand height before cutting.' },
      ],
    }),
    job('CS-20261028-R2VB', daysAgo(6, 13), cornerJob(), customer('Priya Nair', 'priya@example.com', '07700 900789', 'BS8 2JD', 'Loft bathroom, the ceiling comes down over the front.'), 'quoted', {
      photos: ['measured-height.jpg', 'sketch.jpg'],
      events: [
        { id: 2, at: daysAgo(5, 9), actor: 'matthoppy', kind: 'status', detail: 'new → reviewing' },
        { id: 3, at: daysAgo(4, 16), actor: 'matthoppy', kind: 'status', detail: 'reviewing → quoted' },
      ],
      flags: { tooFast: false, challengeSkipped: true, filesStored: true, fileStore: 'kv' },
    }),
  ];
}

function buildQuotes(): Quote[] {
  const now = Date.now();
  const at = (d: number) => new Date(now - d * 86400000).toISOString();
  return [
    {
      id: 'Q-20261103-H2JK',
      createdAt: at(0.2),
      name: 'Daniel Reeves',
      email: 'daniel.reeves@example.com',
      phone: '07700 900222',
      address: '14 Elm Road, Fulham, SW6 2AB',
      serviceType: 'London',
      message: 'Looking for a walk-in screen around 1200mm with a return, black fittings. Can you survey?',
      photo: { filename: 'sketch.jpg', key: 'quotes/Q-20261103-H2JK/sketch.jpg', bytes: 310000, type: 'image/jpeg' },
      utm: { source: 'google', medium: 'cpc', campaign: 'frameless-london', term: null, content: null, gclid: 'EAIaIQ…' },
      status: 'new',
      notes: null,
      emailed: true,
    },
    {
      id: 'Q-20261102-F8RT',
      createdAt: at(1.4),
      name: 'Helen Marsh',
      email: 'helen.marsh@example.com',
      phone: '07700 900333',
      address: '3 Orchard Close, Harrogate, HG2 8EA',
      serviceType: 'Outside London',
      message: 'Supply only for a three-sided enclosure, our fitter will install.',
      photo: null,
      utm: { source: null, medium: null, campaign: null, term: null, content: null, gclid: null },
      status: 'replied',
      notes: 'Sent the designer link.',
      emailed: true,
    },
    {
      id: 'Q-20261029-B6NW',
      createdAt: at(5),
      name: 'Marcus Lee',
      email: 'marcus.lee@example.com',
      phone: '07700 900444',
      address: '88 Park Lane, Leeds, LS1 4DE',
      serviceType: 'Outside London',
      message: 'Bath screen, 1500 tall, chrome.',
      photo: null,
      utm: { source: 'bing', medium: 'cpc', campaign: 'bath-screens', term: null, content: null, gclid: null },
      status: 'won',
      notes: null,
      emailed: true,
    },
  ];
}

function buildCloudflare(days: number): CloudflareSummary {
  const out: CloudflareSummary['days'] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const base = weekend ? 130 : 210;
    const wobble = Math.round(40 * Math.sin(i / 2.3) + 25 * Math.cos(i / 5.1));
    const visitors = Math.max(40, base + wobble);
    out.push({
      date: d.toISOString().slice(0, 10),
      visitors,
      pageViews: Math.round(visitors * 2.6),
      requests: Math.round(visitors * 31),
      threats: Math.round(Math.random() * 3),
      bytes: visitors * 1_900_000,
    });
  }
  const totals = out.reduce(
    (t, d) => ({ requests: t.requests + d.requests, pageViews: t.pageViews + d.pageViews, visitors: t.visitors + d.visitors, threats: t.threats + d.threats, bytes: t.bytes + d.bytes }),
    { requests: 0, pageViews: 0, visitors: 0, threats: 0, bytes: 0 }
  );
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
  return {
    configured: { token: true, zone: true, account: true },
    days: out,
    totals,
    workers: [
      { name: 'customshowers-design', requests: 412, errors: 0 },
      { name: 'customshowers-contact', requests: 188, errors: 2 },
      { name: 'customshowers-admin', requests: 1290, errors: 0 },
    ],
    deployments: [
      { id: 'dep-1', createdAt: hoursAgo(3), environment: 'production', branch: 'main', commit: '597bc05', message: 'Designer: guided measuring journey, one screen at a time', stage: 'deploy', status: 'success', url: 'https://customshowers.uk' },
      { id: 'dep-2', createdAt: hoursAgo(30), environment: 'production', branch: 'main', commit: 'ba84b84', message: 'Designer: measuring upgrades from Notion decisions, and phone crash fix (#56)', stage: 'deploy', status: 'success', url: 'https://customshowers.uk' },
      { id: 'dep-3', createdAt: hoursAgo(52), environment: 'preview', branch: 'feat/guided-measuring-journey', commit: '3a1f0c2', message: 'Measure step: one screen per task', stage: 'deploy', status: 'success', url: 'https://feat-guided-measuring-journey.customshowers-website.pages.dev' },
    ],
    errors: {},
  };
}

function buildGoogle(days: number): GoogleSummary {
  const now = new Date(Date.now() - 2 * 86400000);
  const daily: NonNullable<GoogleSummary['metrics']>['daily'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const impressions = Math.max(20, Math.round(95 + 30 * Math.sin(i / 3) + 15 * Math.cos(i / 7)));
    daily.push({ date: d.toISOString().slice(0, 10), impressions, calls: i % 4 === 0 ? 1 : 0, websiteClicks: Math.round(impressions / 12), directions: i % 6 === 0 ? 1 : 0 });
  }
  const totals = daily.reduce(
    (t, d) => ({ impressions: t.impressions + d.impressions, calls: t.calls + d.calls, websiteClicks: t.websiteClicks + d.websiteClicks, directions: t.directions + d.directions, messages: 2 }),
    { impressions: 0, calls: 0, websiteClicks: 0, directions: 0, messages: 0 }
  );
  const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
  return {
    configured: true,
    connected: true,
    location: { account: 'accounts/1', name: 'locations/1', title: 'Custom Showers', address: 'Fulham, London', mapsUri: 'https://maps.google.com/?cid=1', newReviewUri: 'https://g.page/r/example/review' },
    metrics: { days, totals, daily },
    reviews: {
      averageRating: 4.9,
      total: 37,
      items: [
        { id: 'r1', name: 'Amelia R.', photo: null, rating: 5, comment: 'Measured it ourselves with the online designer and the glass fitted first time. Brilliant service.', at: ago(3), replied: true },
        { id: 'r2', name: 'James K.', photo: null, rating: 5, comment: 'Supply-only to Manchester, arrived well packed with clear fitting instructions.', at: ago(9), replied: false },
        { id: 'r3', name: 'Nadia P.', photo: null, rating: 4, comment: 'Lovely frameless screen. Took a little longer than quoted but worth the wait.', at: ago(21), replied: true },
        { id: 'r4', name: 'Oliver T.', photo: null, rating: 5, comment: 'Matt talked us through the measuring over email, really patient.', at: ago(40), replied: true },
      ],
    },
    errors: {},
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createMockApi(): AdminApi {
  const jobs = buildJobs();
  const quotes = buildQuotes();
  let manifest: SiteImages = normaliseManifest(siteImages);
  let nextEvent = 100;
  let uploads = 0;

  return {
    loginUrl: (returnPath) => `${returnPath}?mock=1`,
    me: async () => ({
      login: 'matthoppy',
      name: 'Matt Hopkinson',
      avatarUrl: null,
      repo: 'matthoppy/CustomShowers-Website',
      branch: 'main',
      siteOrigin: window.location.origin,
      capabilities: { files: 'kv', cloudflare: true, google: 'connected' },
      version: 'mock',
    }),
    logout: async () => undefined,
    listJobs: async ({ status, q } = {}) => {
      await wait(120);
      const needle = (q || '').toLowerCase();
      const rows = jobs.filter(
        (j) =>
          (!status || j.status === status) &&
          (!needle || [j.id, j.customer.name, j.customer.email, j.customer.postcode, j.headline].some((v) => (v || '').toLowerCase().includes(needle)))
      );
      const counts: Record<string, number> = {};
      for (const j of jobs) counts[j.status] = (counts[j.status] || 0) + 1;
      return { jobs: rows.map(({ payload, events, notes, summary, ...rest }) => rest), counts };
    },
    getJob: async (id) => {
      await wait(120);
      const j = jobs.find((x) => x.id === id);
      if (!j) throw new Error('No such job.');
      return structuredClone(j);
    },
    updateJob: async (id, patch) => {
      await wait(150);
      const j = jobs.find((x) => x.id === id);
      if (!j) throw new Error('No such job.');
      const at = new Date().toISOString();
      if (patch.status && patch.status !== j.status) {
        j.events.push({ id: nextEvent++, at, actor: 'matthoppy', kind: 'status', detail: `${j.status} → ${patch.status}` });
        j.status = patch.status;
      }
      if (typeof patch.notes === 'string' && patch.notes !== j.notes) {
        j.notes = patch.notes;
        j.events.push({ id: nextEvent++, at, actor: 'matthoppy', kind: 'note', detail: patch.notes });
      }
      j.updatedAt = at;
      return structuredClone(j);
    },
    jobFileUrl: (_id, filename) => MOCK_PHOTOS[filename] || '#',
    listQuotes: async ({ status, q } = {}) => {
      await wait(100);
      const needle = (q || '').toLowerCase();
      const rows = quotes.filter(
        (x) => (!status || x.status === status) && (!needle || [x.id, x.name, x.email, x.address, x.message].some((v) => (v || '').toLowerCase().includes(needle)))
      );
      const counts: Record<string, number> = {};
      for (const x of quotes) counts[x.status] = (counts[x.status] || 0) + 1;
      return { quotes: rows.map((r) => ({ ...r })), counts };
    },
    updateQuote: async (id, patch) => {
      await wait(120);
      const x = quotes.find((r) => r.id === id);
      if (!x) throw new Error('No such quote.');
      if (patch.status) x.status = patch.status;
      if (typeof patch.notes === 'string') x.notes = patch.notes;
      x.updatedAt = new Date().toISOString();
      return { ...x };
    },
    quoteFileUrl: (_id, filename) => MOCK_PHOTOS[filename] || '/images/site/gallery-2.jpg',
    sitePhotos: async (): Promise<SitePhotosState> => {
      await wait(150);
      return {
        manifest: structuredClone(manifest),
        repo: 'matthoppy/CustomShowers-Website',
        branch: 'main',
        siteOrigin: window.location.origin,
        canPublish: true,
      };
    },
    uploadPhoto: async (contentBase64) => {
      await wait(250 + Math.min(600, contentBase64.length / 4000));
      return { sha: (++uploads).toString(16).padStart(40, '0'), bytes: Math.floor((contentBase64.length * 3) / 4) };
    },
    publishPhotos: async ({ change, blobs }) => {
      await wait(700);
      const stamp = Date.now().toString(36);
      const newPaths = blobs.map((_, i) => `/images/site/sample-${stamp}-${i + 1}.jpg`);
      const { manifest: next } = applyPhotoChange(manifest, change, newPaths);
      manifest = next;
      return {
        sha: 'mock' + Math.random().toString(16).slice(2, 9),
        url: 'https://github.com/matthoppy/CustomShowers-Website/commits/main',
        manifest: structuredClone(manifest),
        newPaths,
      };
    },
    cloudflare: async (days) => {
      await wait(200);
      return buildCloudflare(days);
    },
    googleStatus: async () => ({ configured: true, connected: true, location: buildGoogle(7).location!, redirectUri: 'https://customshowers-admin.vcwvk4sm9m.workers.dev/auth/google/callback' }),
    googleConnectUrl: async () => '#',
    googleSummary: async (days) => {
      await wait(200);
      return buildGoogle(days);
    },
    googleDisconnect: async () => undefined,
  };
}
