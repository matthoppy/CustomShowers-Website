/**
 * Admin dashboard — sign-in and API.
 *
 * Serves customshowers.uk/admin. The dashboard is part of the website build;
 * this worker is everything it needs a server for:
 *
 *   - signing in with GitHub, restricted to an allow-list of logins
 *   - the jobs the design worker kept (D1 + the file store) and the quote
 *     form enquiries the contact worker kept
 *   - the website photos: gallery jobs and the page pictures, committed to
 *     the repository as the signed-in user (their own GitHub token), which
 *     redeploys the site
 *   - Cloudflare data: zone traffic, the workers' request counts, and the
 *     latest Pages deployments
 *   - Google Business Profile: performance and reviews, through a Google
 *     sign-in whose refresh token is kept in D1
 *
 * Deployed by pasting this file into the dashboard, like the other workers.
 *
 * Variables and secrets (Workers & Pages → customshowers-admin → Settings):
 *   GITHUB_CLIENT_ID       required — the GitHub OAuth App
 *   GITHUB_CLIENT_SECRET   required
 *   ALLOWED_LOGINS         optional — comma-separated GitHub logins, default matthoppy
 *   ADMIN_ORIGIN           optional — where the dashboard lives, default https://customshowers.uk
 *   GITHUB_REPO            optional — default matthoppy/CustomShowers-Website
 *   GITHUB_BRANCH          optional — default main
 *   CF_API_TOKEN           optional — Analytics:Read on the zone, Workers Scripts:Read and Pages:Read on the account
 *   CF_ACCOUNT_ID          optional — with the token: workers and Pages deployments
 *   CF_ZONE_ID             optional — with the token: traffic for customshowers.uk
 *   CF_PAGES_PROJECT       optional — default customshowers-website
 *   GOOGLE_CLIENT_ID       optional — Google OAuth client for Business Profile
 *   GOOGLE_CLIENT_SECRET   optional
 *
 * Bindings (Settings → Bindings):
 *   JOBS       D1 database  "customshowers"       — required
 *   FILES      R2 bucket    "customshowers-files" — drawings and photos, or
 *   FILES_KV   KV namespace "customshowers-files" — the same, where R2 is off
 */

const WORKER_VERSION = "v2";

const DEFAULTS = {
  allowedLogins: "matthoppy",
  adminOrigin: "https://customshowers.uk",
  repo: "matthoppy/CustomShowers-Website",
  branch: "main",
  pagesProject: "customshowers-website",
};

const SESSION_DAYS = 30;
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

const JOB_STATUSES = ["new", "reviewing", "quoted", "ordered", "done", "closed"];
const QUOTE_STATUSES = ["new", "replied", "won", "lost", "closed"];

/** The dashboard's own origins, plus a local dev server. */
const ALLOWED_ORIGINS = [
  "https://customshowers.uk",
  "https://www.customshowers.uk",
  /^https:\/\/[a-z0-9-]+\.customshowers-website\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

/** The repository paths the photos page may touch. */
const UPLOAD_DIR = "public/images/site/";
const SITE_PREFIX = "/images/site/";
const MANIFEST_PATH = "src/content/site-images.json";
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_PHOTOS_PER_PUBLISH = 24;
const MAX_TITLE_LENGTH = 80;
/** The parts of the gallery, as src/content/siteImages.ts lists them. */
const JOB_TYPES = ["enclosure", "inline", "walkin", "sliding", "bath", "other"];
const JOB_TYPE_NAMES = {
  enclosure: "Enclosures",
  inline: "Inline",
  walkin: "Walk-in screens",
  sliding: "Sliding doors",
  bath: "Bath screens",
  other: "Other glass",
};

// ── Small helpers ────────────────────────────────────────────────────────────

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.some((a) => (a instanceof RegExp ? a.test(origin) : a === origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : DEFAULTS.adminOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

function redirect(url, headers = {}) {
  return new Response(null, { status: 302, headers: { Location: url, ...headers } });
}

const enc = new TextEncoder();

function base64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function randomId(bytes = 32) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64url(buf);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

/**
 * A signed, short-lived state for the OAuth round trips: nothing to store,
 * nothing a caller can forge. Keyed on the client secret the worker already
 * holds.
 */
export async function signState(secret, payload) {
  const body = base64url(enc.encode(JSON.stringify({ ...payload, t: Date.now() })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body)));
  return `${body}.${base64url(sig)}`;
}

export async function verifyState(secret, state, maxAgeMs = STATE_MAX_AGE_MS) {
  if (!state || !state.includes(".")) return null;
  const [body, sig] = state.split(".");
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromBase64url(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64url(body)));
    if (typeof payload.t !== "number" || Date.now() - payload.t > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}

/** "/jobs/:id/files/:name" against a path. Params decoded. */
export function matchPath(pattern, path) {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("/").filter(Boolean);
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

export function isAllowedLogin(login, allowed = DEFAULTS.allowedLogins) {
  const list = String(allowed || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return !!login && list.includes(String(login).toLowerCase());
}

function setting(env, key, fallback) {
  const v = env[key];
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/** A safe return path inside the dashboard, never an open redirect. */
export function safeReturnPath(value) {
  if (typeof value !== "string" || !value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//") || value.includes("://")) return "/admin";
  return value.slice(0, 200);
}

// ── The file store ───────────────────────────────────────────────────────────

function fileStore(env) {
  if (env.FILES) {
    return {
      kind: "r2",
      async get(key) {
        const obj = await env.FILES.get(key);
        if (!obj) return null;
        return { body: obj.body, contentType: obj.httpMetadata?.contentType || "application/octet-stream" };
      },
    };
  }
  if (env.FILES_KV) {
    return {
      kind: "kv",
      async get(key) {
        const { value, metadata } = await env.FILES_KV.getWithMetadata(key, { type: "arrayBuffer" });
        if (!value) return null;
        return { body: value, contentType: metadata?.contentType || "application/octet-stream" };
      },
    };
  }
  return null;
}

// ── Sessions ─────────────────────────────────────────────────────────────────

async function sessionFromRequest(request, env, url) {
  const header = request.headers.get("Authorization") || "";
  let token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  // Images and downloads are loaded by the browser without headers, so the
  // file routes also take the token as a query parameter.
  if (!token && url.pathname.includes("/files/")) token = url.searchParams.get("t") || "";
  if (!token || !env.JOBS) return null;
  const row = await env.JOBS.prepare("SELECT * FROM sessions WHERE id = ?1 AND expires_at > ?2")
    .bind(token, new Date().toISOString())
    .first();
  return row || null;
}

async function createSession(env, user, ghToken) {
  const id = randomId();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 3600 * 1000);
  await env.JOBS.prepare(
    "INSERT INTO sessions (id, login, name, avatar_url, gh_token, created_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
  )
    .bind(id, user.login, user.name || null, user.avatar_url || null, ghToken, now.toISOString(), expires.toISOString())
    .run();
  return id;
}

// ── GitHub ───────────────────────────────────────────────────────────────────

async function github(token, method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "customshowers-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`GitHub ${method} ${path} returned ${res.status}: ${data?.message || text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function decodeContent(file) {
  const bytes = fromBase64url(String(file.content || "").replace(/\n/g, "").replace(/\+/g, "-").replace(/\//g, "_"));
  return new TextDecoder().decode(bytes);
}

// ── Website photos ───────────────────────────────────────────────────────────

/**
 * The manifest with every type of work present and only well-formed entries.
 * Anything else in the file is kept as it was. A manifest from before the
 * gallery became jobs (a flat `gallery` list) is carried over as one job per
 * picture, under "other".
 */
export function normaliseManifest(raw) {
  const m = raw && typeof raw === "object" ? raw : {};
  const picture = (x) =>
    x && typeof x === "object" && typeof x.src === "string"
      ? { src: x.src, alt: typeof x.alt === "string" ? x.alt : "", v: Number(x.v) || 1 }
      : null;
  const out = {
    version: 2,
    hero: picture(m.hero) || { src: "", alt: "", v: 1 },
    about: Array.isArray(m.about) ? m.about.map(picture).filter(Boolean) : [],
    jobs: {},
  };
  const jobs = m.jobs && typeof m.jobs === "object" ? m.jobs : {};
  for (const type of JOB_TYPES) {
    out.jobs[type] = (Array.isArray(jobs[type]) ? jobs[type] : [])
      .filter((j) => j && typeof j === "object")
      .map((j) => ({
        title: String(j.title || ""),
        photos: Array.isArray(j.photos) ? j.photos.filter((p) => typeof p === "string" && p) : [],
      }));
  }
  for (const k of Object.keys(jobs)) if (!(k in out.jobs)) out.jobs[k] = jobs[k];
  if (!m.jobs && Array.isArray(m.gallery)) {
    out.jobs.other = m.gallery.map(picture).filter(Boolean).map((p) => ({ title: p.alt, photos: [p.src] }));
  }
  for (const k of Object.keys(m)) if (!(k in out) && k !== "gallery") out[k] = m[k];
  return out;
}

const isSitePath = (p) => typeof p === "string" && p.startsWith("/images/") && !p.includes("..") && !/[\s"'<>\\]/.test(p);
const isNewPhoto = (p, count) => typeof p === "string" && /^new:\d+$/.test(p) && Number(p.slice(4)) < count;

/**
 * What the photos page may publish, checked before GitHub is touched. A
 * change is one job (added, updated or deleted) or one page picture; the
 * photos it names are either paths already on the site or "new:<n>", the nth
 * blob uploaded just before.
 */
export function validateChange(body) {
  const errors = [];
  const change = body?.change && typeof body.change === "object" ? body.change : null;
  const blobs = Array.isArray(body?.blobs) ? body.blobs : [];
  if (blobs.length > MAX_PHOTOS_PER_PUBLISH) errors.push(`too many photos at once (${blobs.length})`);
  for (const b of blobs) if (!b || !/^[0-9a-f]{40}$/.test(String(b.sha || ""))) errors.push("an uploaded photo has no blob id");
  if (!change) errors.push("no change given");
  else if (change.kind === "job") {
    const mode = change.mode;
    if (!["add", "update", "delete"].includes(mode)) errors.push("unknown job change");
    if (mode === "add" || mode === "update") {
      if (!JOB_TYPES.includes(change.type)) errors.push("unknown type of work");
      const title = typeof change.title === "string" ? change.title.trim() : "";
      if (!title) errors.push("the job needs a label");
      if (title.length > MAX_TITLE_LENGTH) errors.push("the label is too long");
      const photos = Array.isArray(change.photos) ? change.photos : [];
      if (!photos.length) errors.push("the job needs at least one photo");
      for (const p of photos) if (!isSitePath(p) && !isNewPhoto(p, blobs.length)) errors.push(`not a photo of the site: ${p}`);
    }
    if (mode === "update" || mode === "delete") {
      if (!JOB_TYPES.includes(change.origType)) errors.push("the job's current type is unknown");
      if (!Number.isInteger(change.origIndex) || change.origIndex < 0) errors.push("the job's position is unknown");
      if (typeof change.origJson !== "string" || !change.origJson) errors.push("the job as it was is missing");
    }
  } else if (change.kind === "slot") {
    if (!["hero", "about"].includes(change.slot)) errors.push("unknown page picture");
    if (change.slot === "about" && !(Number.isInteger(change.index) && change.index >= 0)) errors.push("which About picture?");
    if (typeof change.alt !== "string" || change.alt.length > 200) errors.push("the description is missing or too long");
    if (change.photo != null && !isSitePath(change.photo) && !isNewPhoto(change.photo, blobs.length)) errors.push("not a photo of the site");
  } else errors.push("unknown change");
  return {
    ok: errors.length === 0,
    errors,
    change,
    blobs,
    message: typeof body?.message === "string" ? body.message.slice(0, 200) : "",
  };
}

function conflict(message) {
  const err = new Error(message);
  err.conflict = true;
  return err;
}

/** Of the paths dropped, those under the photos folder that nothing on the site still shows. */
function unused(manifest, dropped) {
  const still = JSON.stringify(manifest);
  return [...new Set(dropped)].filter((p) => p.startsWith(SITE_PREFIX) && !still.includes(`"${p}"`));
}

/**
 * The change applied to a fresh copy of the manifest. A job is found by what
 * it looked like when the editor opened it, so two people publishing at once
 * cannot overwrite each other: if it has moved it is still found, and if it
 * has changed the publish is refused. `newPaths` are the site paths of the
 * uploaded photos, in blob order. Returns the next manifest and the photo
 * files nothing uses any more.
 */
export function applyChange(current, change, newPaths = []) {
  const manifest = normaliseManifest(current);
  const resolve = (p) => (/^new:\d+$/.test(p) ? newPaths[Number(p.slice(4))] : p);
  const dropped = [];

  if (change.kind === "slot") {
    const old = change.slot === "hero" ? manifest.hero : manifest.about[change.index];
    if (!old) throw conflict("That page picture is not on the site any more.");
    const src = change.photo ? resolve(change.photo) : old.src;
    const next = { src, alt: change.alt, v: src === old.src ? old.v : 1 };
    if (change.slot === "hero") manifest.hero = next;
    else manifest.about[change.index] = next;
    if (src !== old.src) dropped.push(old.src);
    return { manifest, removed: unused(manifest, dropped) };
  }

  const finalPhotos = change.mode === "delete" ? [] : change.photos.map(resolve);
  if (change.mode === "add") {
    (manifest.jobs[change.type] = manifest.jobs[change.type] || []).unshift({ title: change.title.trim(), photos: finalPhotos });
    return { manifest, removed: [] };
  }

  const list = manifest.jobs[change.origType] || [];
  let idx = -1;
  if (list[change.origIndex] && JSON.stringify(list[change.origIndex]) === change.origJson) idx = change.origIndex;
  else idx = list.findIndex((j) => JSON.stringify(j) === change.origJson);
  if (idx === -1) throw conflict("This job was changed somewhere else while you were editing. Go back to Photos to see the latest version.");
  const [old] = list.splice(idx, 1);
  for (const p of old.photos) if (change.mode === "delete" || !finalPhotos.includes(p)) dropped.push(p);
  if (change.mode === "delete") return { manifest, removed: unused(manifest, dropped) };
  const updated = { title: change.title.trim(), photos: finalPhotos };
  if (change.type === change.origType) list.splice(idx, 0, updated);
  else (manifest.jobs[change.type] = manifest.jobs[change.type] || []).unshift(updated);
  return { manifest, removed: unused(manifest, dropped) };
}

function slugify(s) {
  return (
    String(s || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "photo"
  );
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

function describeChange(change) {
  if (change.kind === "slot") return change.slot === "hero" ? "Replace the hero picture" : `Update About picture ${(change.index || 0) + 1}`;
  const type = JOB_TYPE_NAMES[change.type || change.origType] || change.type || change.origType;
  if (change.mode === "delete") {
    let title = "";
    try {
      title = JSON.parse(change.origJson).title || "";
    } catch {
      title = "";
    }
    return `Remove gallery job: ${title || "untitled"} (${type})`;
  }
  return `${change.mode === "add" ? "Add" : "Update"} gallery job: ${change.title.trim()} (${type})`;
}

/**
 * One commit on the branch: the uploaded photos under public/images/site/,
 * the manifest, and the removal of photos nothing uses any more. If someone
 * else committed between reading the manifest and moving the branch, GitHub
 * refuses the fast-forward and the whole thing is done once more from the
 * new head, with the blobs already uploaded.
 */
async function publishChange(token, repo, branch, { change, blobs, message }, actor) {
  const label = change.kind === "slot" ? (change.slot === "hero" ? "hero" : `about-${(change.index || 0) + 1}`) : change.title;
  const base = `${slugify(label)}-${stamp()}`;
  const repoPaths = blobs.map((_, i) => `${UPLOAD_DIR}${base}${blobs.length > 1 ? `-${i + 1}` : ""}.jpg`);
  const sitePaths = repoPaths.map((p) => `/${p.slice("public/".length)}`);

  const attempt = async (retried) => {
    const ref = await github(token, "GET", `/repos/${repo}/git/ref/heads/${branch}`);
    const headSha = ref.object.sha;
    const file = await github(token, "GET", `/repos/${repo}/contents/${MANIFEST_PATH}?ref=${headSha}`);
    const current = normaliseManifest(JSON.parse(decodeContent(file)));
    const { manifest, removed } = applyChange(current, change, sitePaths);
    if (!blobs.length && JSON.stringify(manifest) === JSON.stringify(current)) {
      return { sha: null, url: null, unchanged: true, manifest, newPaths: [] };
    }
    const tree = repoPaths.map((path, i) => ({ path, mode: "100644", type: "blob", sha: blobs[i].sha }));
    tree.push({ path: MANIFEST_PATH, mode: "100644", type: "blob", content: JSON.stringify(manifest, null, 2) + "\n" });
    for (const p of removed) tree.push({ path: `public${p}`, mode: "100644", type: "blob", sha: null });
    try {
      const head = await github(token, "GET", `/repos/${repo}/git/commits/${headSha}`);
      const newTree = await github(token, "POST", `/repos/${repo}/git/trees`, { base_tree: head.tree.sha, tree });
      const commit = await github(token, "POST", `/repos/${repo}/git/commits`, {
        message: `${describeChange(change)}\n\nVia the website photos page by ${actor}${message ? `\n\n${message}` : ""}`,
        tree: newTree.sha,
        parents: [headSha],
      });
      await github(token, "PATCH", `/repos/${repo}/git/refs/heads/${branch}`, { sha: commit.sha, force: false });
      return { sha: commit.sha, url: `https://github.com/${repo}/commit/${commit.sha}`, manifest, newPaths: sitePaths };
    } catch (err) {
      if (!retried && (err.status === 409 || err.status === 422)) return attempt(true);
      throw err;
    }
  };
  return attempt(false);
}

// ── Sign-in responses ────────────────────────────────────────────────────────

/**
 * Where the browser ends up after GitHub. Normally back in the dashboard, with
 * the outcome in the URL fragment. When the dashboard opened the sign-in in a
 * popup, a small page instead hands the outcome to the window that opened it
 * and closes: the dashboard says hello first, so the result only ever goes to
 * one of the dashboard's own origins.
 */
export function signInResponse(adminOrigin, popup, outcome) {
  const target = `${adminOrigin}/admin/auth#${new URLSearchParams(outcome).toString()}`;
  if (!popup) return redirect(target);
  const payload = JSON.stringify({ source: "customshowers-admin", ...outcome }).replace(/</g, "\\u003c");
  const origins = JSON.stringify(ALLOWED_ORIGINS.map((o) => (o instanceof RegExp ? { re: o.source } : o)));
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Signing in</title></head>
<body style="font-family: system-ui, sans-serif; padding: 24px; color: #333"><p>Signing you in…</p>
<script>
(function () {
  var opener = window.opener;
  var target = ${JSON.stringify(target)};
  if (!opener) { location.replace(target); return; }
  var allowed = ${origins}.concat([${JSON.stringify(adminOrigin)}]);
  function ok(origin) {
    return allowed.some(function (a) { return typeof a === "string" ? a === origin : new RegExp(a.re).test(origin); });
  }
  var sent = false;
  window.addEventListener("message", function (e) {
    if (sent || e.source !== opener || e.data !== "customshowers-admin:ready" || !ok(e.origin)) return;
    sent = true;
    opener.postMessage(${payload}, e.origin);
    setTimeout(function () { window.close(); }, 300);
  });
  opener.postMessage("customshowers-admin:hello", "*");
  setTimeout(function () { if (!sent) location.replace(target); }, 4000);
})();
</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

// ── Cloudflare ───────────────────────────────────────────────────────────────

async function cfRest(env, path) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data?.errors?.[0]?.message || `Cloudflare returned ${res.status}`);
  }
  return data.result;
}

async function cfGraphql(env, query, variables) {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function cloudflareSummary(env, days) {
  const configured = {
    token: !!env.CF_API_TOKEN,
    zone: !!env.CF_ZONE_ID,
    account: !!env.CF_ACCOUNT_ID,
  };
  const out = { configured, days: [], totals: null, workers: [], deployments: [], errors: {} };
  if (!configured.token) return out;
  const until = new Date();
  const since = new Date(until.getTime() - (days - 1) * 24 * 3600 * 1000);

  if (configured.zone) {
    try {
      const data = await cfGraphql(
        env,
        `query($zone: String!, $since: Date!, $until: Date!) {
          viewer { zones(filter: { zoneTag: $zone }) {
            httpRequests1dGroups(limit: 100, filter: { date_geq: $since, date_leq: $until }, orderBy: [date_ASC]) {
              dimensions { date }
              sum { requests pageViews threats bytes }
              uniq { uniques }
            }
          } }
        }`,
        { zone: env.CF_ZONE_ID, since: isoDate(since), until: isoDate(until) }
      );
      const groups = data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];
      out.days = groups.map((g) => ({
        date: g.dimensions.date,
        requests: g.sum.requests,
        pageViews: g.sum.pageViews,
        visitors: g.uniq.uniques,
        threats: g.sum.threats,
        bytes: g.sum.bytes,
      }));
      out.totals = out.days.reduce(
        (t, d) => ({
          requests: t.requests + d.requests,
          pageViews: t.pageViews + d.pageViews,
          visitors: t.visitors + d.visitors,
          threats: t.threats + d.threats,
          bytes: t.bytes + d.bytes,
        }),
        { requests: 0, pageViews: 0, visitors: 0, threats: 0, bytes: 0 }
      );
    } catch (err) {
      out.errors.analytics = String(err.message || err);
    }
  }

  if (configured.account) {
    try {
      const data = await cfGraphql(
        env,
        `query($account: String!, $since: Time!, $until: Time!) {
          viewer { accounts(filter: { accountTag: $account }) {
            workersInvocationsAdaptive(limit: 100, filter: { datetime_geq: $since, datetime_leq: $until }) {
              dimensions { scriptName }
              sum { requests errors subrequests }
            }
          } }
        }`,
        { account: env.CF_ACCOUNT_ID, since: since.toISOString(), until: until.toISOString() }
      );
      const rows = data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive || [];
      const byName = new Map();
      for (const r of rows) {
        const cur = byName.get(r.dimensions.scriptName) || { name: r.dimensions.scriptName, requests: 0, errors: 0 };
        cur.requests += r.sum.requests;
        cur.errors += r.sum.errors;
        byName.set(cur.name, cur);
      }
      out.workers = [...byName.values()].sort((a, b) => b.requests - a.requests);
    } catch (err) {
      out.errors.workers = String(err.message || err);
    }
    try {
      const project = setting(env, "CF_PAGES_PROJECT", DEFAULTS.pagesProject);
      const list = await cfRest(env, `/accounts/${env.CF_ACCOUNT_ID}/pages/projects/${project}/deployments?per_page=8`);
      out.deployments = (list || []).map((d) => ({
        id: d.id,
        createdAt: d.created_on,
        environment: d.environment,
        branch: d.deployment_trigger?.metadata?.branch || null,
        commit: d.deployment_trigger?.metadata?.commit_hash?.slice(0, 7) || null,
        message: d.deployment_trigger?.metadata?.commit_message || null,
        stage: d.latest_stage?.name || null,
        status: d.latest_stage?.status || null,
        url: d.url,
      }));
    } catch (err) {
      out.errors.deployments = String(err.message || err);
    }
  }
  return out;
}

// ── Google Business Profile ──────────────────────────────────────────────────

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/business.manage";
const STAR = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
const GBP_METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "BUSINESS_CONVERSATIONS",
];

async function getSetting(env, key) {
  const row = await env.JOBS.prepare("SELECT value FROM settings WHERE key = ?1").bind(key).first();
  return row ? row.value : null;
}

async function putSetting(env, key, value) {
  await env.JOBS.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  )
    .bind(key, value, new Date().toISOString())
    .run();
}

async function googleAccessToken(env) {
  const refresh = await getSetting(env, "google.refresh_token");
  if (!refresh) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(data.error_description || data.error || "Google token refresh failed");
  return data.access_token;
}

async function googleGet(token, url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Google returned ${res.status}`);
  return data;
}

/** The first account and location, remembered once found. */
async function googleLocation(env, token) {
  const stored = await getSetting(env, "google.location");
  if (stored) return JSON.parse(stored);
  const accounts = await googleGet(token, "https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
  const account = accounts.accounts?.[0];
  if (!account) throw new Error("No Business Profile account on this Google login");
  const locations = await googleGet(
    token,
    `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress,metadata&pageSize=10`
  );
  const location = locations.locations?.[0];
  if (!location) throw new Error("No location on the Business Profile account");
  const record = {
    account: account.name,
    name: location.name,
    title: location.title,
    address: location.storefrontAddress?.addressLines?.join(", ") || null,
    mapsUri: location.metadata?.mapsUri || null,
    newReviewUri: location.metadata?.newReviewUri || null,
  };
  await putSetting(env, "google.location", JSON.stringify(record));
  return record;
}

function datePart(d) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

async function googleSummary(env, days) {
  const token = await googleAccessToken(env);
  if (!token) return { connected: false };
  const location = await googleLocation(env, token);
  const out = { connected: true, location, metrics: null, reviews: null, errors: {} };

  try {
    const until = new Date(Date.now() - 2 * 24 * 3600 * 1000); // Google lags about two days.
    const since = new Date(until.getTime() - (days - 1) * 24 * 3600 * 1000);
    const s = datePart(since);
    const u = datePart(until);
    const params = new URLSearchParams();
    for (const m of GBP_METRICS) params.append("dailyMetrics", m);
    params.set("dailyRange.startDate.year", s.year);
    params.set("dailyRange.startDate.month", s.month);
    params.set("dailyRange.startDate.day", s.day);
    params.set("dailyRange.endDate.year", u.year);
    params.set("dailyRange.endDate.month", u.month);
    params.set("dailyRange.endDate.day", u.day);
    const data = await googleGet(
      token,
      `https://businessprofileperformance.googleapis.com/v1/${location.name}:fetchMultiDailyMetricsTimeSeries?${params}`
    );
    const byDate = new Map();
    const totals = {};
    for (const block of data.multiDailyMetricTimeSeries || []) {
      for (const series of block.dailyMetricTimeSeries || []) {
        const metric = series.dailyMetric;
        totals[metric] = 0;
        for (const dv of series.timeSeries?.datedValues || []) {
          const d = dv.date;
          const key = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
          const value = Number(dv.value || 0);
          totals[metric] += value;
          const row = byDate.get(key) || { date: key };
          row[metric] = value;
          byDate.set(key, row);
        }
      }
    }
    const daily = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    const impressions = (r) =>
      (r.BUSINESS_IMPRESSIONS_DESKTOP_MAPS || 0) +
      (r.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) +
      (r.BUSINESS_IMPRESSIONS_MOBILE_MAPS || 0) +
      (r.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0);
    out.metrics = {
      days,
      totals: {
        impressions: impressions(totals),
        calls: totals.CALL_CLICKS || 0,
        websiteClicks: totals.WEBSITE_CLICKS || 0,
        directions: totals.BUSINESS_DIRECTION_REQUESTS || 0,
        messages: totals.BUSINESS_CONVERSATIONS || 0,
      },
      daily: daily.map((r) => ({
        date: r.date,
        impressions: impressions(r),
        calls: r.CALL_CLICKS || 0,
        websiteClicks: r.WEBSITE_CLICKS || 0,
        directions: r.BUSINESS_DIRECTION_REQUESTS || 0,
      })),
    };
  } catch (err) {
    out.errors.metrics = String(err.message || err);
  }

  try {
    const data = await googleGet(
      token,
      `https://mybusiness.googleapis.com/v4/${location.account}/${location.name}/reviews?pageSize=10`
    );
    out.reviews = {
      averageRating: data.averageRating ?? null,
      total: data.totalReviewCount ?? 0,
      items: (data.reviews || []).map((r) => ({
        id: r.reviewId,
        name: r.reviewer?.displayName || "Anonymous",
        photo: r.reviewer?.profilePhotoUrl || null,
        rating: STAR[r.starRating] || null,
        comment: r.comment || "",
        at: r.createTime,
        replied: !!r.reviewReply,
      })),
    };
  } catch (err) {
    out.errors.reviews = String(err.message || err);
  }
  return out;
}

// ── Jobs and quotes ──────────────────────────────────────────────────────────

const JOB_LIST_COLUMNS =
  "id, created_at, updated_at, customer_name, customer_email, customer_phone, customer_postcode, status, headline, attachments_json, flags_json, emailed";

function parseJson(text, fallback) {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function jobRow(r) {
  return {
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone, postcode: r.customer_postcode },
    status: r.status,
    headline: r.headline,
    attachments: parseJson(r.attachments_json, []),
    flags: parseJson(r.flags_json, {}),
    emailed: !!r.emailed,
    notes: r.notes ?? undefined,
  };
}

function quoteRow(r) {
  return {
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    name: r.name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    serviceType: r.service_type,
    message: r.message,
    photo: parseJson(r.photo_json, null),
    utm: parseJson(r.utm_json, {}),
    status: r.status,
    notes: r.notes,
    emailed: !!r.emailed,
  };
}

async function listJobs(env, url) {
  const status = url.searchParams.get("status");
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const where = [];
  const binds = [];
  if (status && JOB_STATUSES.includes(status)) {
    where.push(`status = ?${binds.length + 1}`);
    binds.push(status);
  }
  if (q) {
    const like = `%${q}%`;
    const n = binds.length;
    where.push(
      `(id LIKE ?${n + 1} OR customer_name LIKE ?${n + 2} OR customer_email LIKE ?${n + 3} OR customer_postcode LIKE ?${n + 4} OR headline LIKE ?${n + 5})`
    );
    binds.push(like, like, like, like, like);
  }
  const sql = `SELECT ${JOB_LIST_COLUMNS} FROM jobs${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT ${limit}`;
  const rows = (await env.JOBS.prepare(sql).bind(...binds).all()).results || [];
  const counts = (await env.JOBS.prepare("SELECT status, COUNT(*) AS n FROM jobs GROUP BY status").all()).results || [];
  return { jobs: rows.map(jobRow), counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) };
}

async function getJob(env, id) {
  const row = await env.JOBS.prepare("SELECT * FROM jobs WHERE id = ?1").bind(id).first();
  if (!row) return null;
  const events = (await env.JOBS.prepare("SELECT id, at, actor, kind, detail FROM job_events WHERE job_id = ?1 ORDER BY at ASC, id ASC").bind(id).all()).results || [];
  return { ...jobRow(row), notes: row.notes || "", payload: parseJson(row.payload_json, {}), summary: parseJson(row.summary_json, {}), events };
}

async function patchJob(env, id, body, actor) {
  const current = await env.JOBS.prepare("SELECT status, notes FROM jobs WHERE id = ?1").bind(id).first();
  if (!current) return null;
  const now = new Date().toISOString();
  const sets = [];
  const binds = [];
  if (typeof body.status === "string" && JOB_STATUSES.includes(body.status) && body.status !== current.status) {
    sets.push(`status = ?${binds.length + 1}`);
    binds.push(body.status);
    await env.JOBS.prepare("INSERT INTO job_events (job_id, at, actor, kind, detail) VALUES (?1, ?2, ?3, 'status', ?4)")
      .bind(id, now, actor, `${current.status} → ${body.status}`)
      .run();
  }
  if (typeof body.notes === "string" && body.notes !== (current.notes || "")) {
    sets.push(`notes = ?${binds.length + 1}`);
    binds.push(body.notes);
    await env.JOBS.prepare("INSERT INTO job_events (job_id, at, actor, kind, detail) VALUES (?1, ?2, ?3, 'note', ?4)")
      .bind(id, now, actor, body.notes.slice(0, 2000))
      .run();
  }
  if (sets.length) {
    sets.push(`updated_at = ?${binds.length + 1}`);
    binds.push(now);
    await env.JOBS.prepare(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?${binds.length + 1}`).bind(...binds, id).run();
  }
  return getJob(env, id);
}

async function listQuotes(env, url) {
  const status = url.searchParams.get("status");
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const where = [];
  const binds = [];
  if (status && QUOTE_STATUSES.includes(status)) {
    where.push(`status = ?${binds.length + 1}`);
    binds.push(status);
  }
  if (q) {
    const like = `%${q}%`;
    const n = binds.length;
    where.push(`(id LIKE ?${n + 1} OR name LIKE ?${n + 2} OR email LIKE ?${n + 3} OR address LIKE ?${n + 4} OR message LIKE ?${n + 5})`);
    binds.push(like, like, like, like, like);
  }
  const sql = `SELECT * FROM quotes${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT ${limit}`;
  const rows = (await env.JOBS.prepare(sql).bind(...binds).all()).results || [];
  const counts = (await env.JOBS.prepare("SELECT status, COUNT(*) AS n FROM quotes GROUP BY status").all()).results || [];
  return { quotes: rows.map(quoteRow), counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) };
}

async function patchQuote(env, id, body) {
  const current = await env.JOBS.prepare("SELECT * FROM quotes WHERE id = ?1").bind(id).first();
  if (!current) return null;
  const sets = [];
  const binds = [];
  if (typeof body.status === "string" && QUOTE_STATUSES.includes(body.status)) {
    sets.push(`status = ?${binds.length + 1}`);
    binds.push(body.status);
  }
  if (typeof body.notes === "string") {
    sets.push(`notes = ?${binds.length + 1}`);
    binds.push(body.notes);
  }
  if (sets.length) {
    sets.push(`updated_at = ?${binds.length + 1}`);
    binds.push(new Date().toISOString());
    await env.JOBS.prepare(`UPDATE quotes SET ${sets.join(", ")} WHERE id = ?${binds.length + 1}`).bind(...binds, id).run();
  }
  return quoteRow(await env.JOBS.prepare("SELECT * FROM quotes WHERE id = ?1").bind(id).first());
}

async function serveFile(env, key, request) {
  const store = fileStore(env);
  if (!store) return json({ error: "No file store is bound to this worker." }, 404, corsHeaders(request));
  const file = await store.get(key);
  if (!file) return json({ error: "File not found." }, 404, corsHeaders(request));
  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
      ...corsHeaders(request),
    },
  });
}

// ── The worker ───────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;
    const workerOrigin = `${url.protocol}//${url.host}`;
    const adminOrigin = setting(env, "ADMIN_ORIGIN", DEFAULTS.adminOrigin);
    const repo = setting(env, "GITHUB_REPO", DEFAULTS.repo);
    const branch = setting(env, "GITHUB_BRANCH", DEFAULTS.branch);

    try {
      if (path === "/" && method === "GET") {
        return new Response(`customshowers-admin ${WORKER_VERSION} — the dashboard's API. Sign in at ${adminOrigin}/admin.`, {
          status: 200,
          headers: { "Content-Type": "text/plain", ...cors },
        });
      }

      // ── GitHub sign-in ──
      if (path === "/auth/github/start" && method === "GET") {
        const popup = url.searchParams.get("popup") === "1";
        if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
          return signInResponse(adminOrigin, popup, { error: "github-not-configured" });
        }
        const state = await signState(env.GITHUB_CLIENT_SECRET, { r: safeReturnPath(url.searchParams.get("return")), p: popup ? 1 : 0 });
        const params = new URLSearchParams({
          client_id: env.GITHUB_CLIENT_ID,
          redirect_uri: `${workerOrigin}/auth/github/callback`,
          scope: "read:user repo",
          state,
          allow_signup: "false",
        });
        return redirect(`https://github.com/login/oauth/authorize?${params}`);
      }

      if (path === "/auth/github/callback" && method === "GET") {
        const state = await verifyState(env.GITHUB_CLIENT_SECRET || "", url.searchParams.get("state") || "");
        const code = url.searchParams.get("code");
        if (!state || !code) return redirect(`${adminOrigin}/admin/auth#error=bad-state`);
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "customshowers-admin" },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: `${workerOrigin}/auth/github/callback`,
          }),
        });
        const tokenData = await tokenRes.json().catch(() => ({}));
        const popup = !!state.p;
        if (!tokenData.access_token) {
          console.error("GitHub token exchange failed", tokenData);
          return signInResponse(adminOrigin, popup, { error: "token-exchange" });
        }
        const user = await github(tokenData.access_token, "GET", "/user");
        if (!isAllowedLogin(user.login, setting(env, "ALLOWED_LOGINS", DEFAULTS.allowedLogins))) {
          console.warn("Sign-in refused", user.login);
          return signInResponse(adminOrigin, popup, { error: "not-allowed", login: user.login });
        }
        const sid = await createSession(env, user, tokenData.access_token);
        return signInResponse(adminOrigin, popup, { token: sid, return: state.r || "/admin" });
      }

      if (path === "/auth/google/callback" && method === "GET") {
        const state = await verifyState(env.GOOGLE_CLIENT_SECRET || "", url.searchParams.get("state") || "");
        const code = url.searchParams.get("code");
        if (!state || !code || !state.sid) return redirect(`${adminOrigin}/admin/google#error=bad-state`);
        const owner = await env.JOBS.prepare("SELECT id FROM sessions WHERE id = ?1 AND expires_at > ?2")
          .bind(state.sid, new Date().toISOString())
          .first();
        if (!owner) return redirect(`${adminOrigin}/admin/google#error=signed-out`);
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${workerOrigin}/auth/google/callback`,
            grant_type: "authorization_code",
          }),
        });
        const tokenData = await tokenRes.json().catch(() => ({}));
        if (!tokenData.refresh_token) {
          console.error("Google token exchange gave no refresh token", tokenData.error || "");
          return redirect(`${adminOrigin}/admin/google#error=no-refresh-token`);
        }
        await putSetting(env, "google.refresh_token", tokenData.refresh_token);
        await env.JOBS.prepare("DELETE FROM settings WHERE key = 'google.location'").run();
        try {
          await googleLocation(env, tokenData.access_token);
        } catch (err) {
          console.warn("Google connected, but no location found yet", String(err));
        }
        return redirect(`${adminOrigin}/admin/google#connected=1`);
      }

      // ── Everything else needs a session ──
      const session = await sessionFromRequest(request, env, url);
      if (!session) return json({ error: "Not signed in." }, 401, cors);

      if (path === "/auth/logout" && method === "POST") {
        await env.JOBS.prepare("DELETE FROM sessions WHERE id = ?1").bind(session.id).run();
        return json({ ok: true }, 200, cors);
      }

      if (path === "/me" && method === "GET") {
        const googleConfigured = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
        const googleConnected = googleConfigured && !!(await getSetting(env, "google.refresh_token"));
        return json(
          {
            login: session.login,
            name: session.name,
            avatarUrl: session.avatar_url,
            repo,
            branch,
            siteOrigin: adminOrigin,
            capabilities: {
              files: fileStore(env)?.kind || null,
              cloudflare: !!env.CF_API_TOKEN,
              google: googleConfigured ? (googleConnected ? "connected" : "disconnected") : "unconfigured",
            },
            version: WORKER_VERSION,
          },
          200,
          cors
        );
      }

      // ── Jobs ──
      if (path === "/jobs" && method === "GET") return json(await listJobs(env, url), 200, cors);
      let m;
      if ((m = matchPath("/jobs/:id", path)) && method === "GET") {
        const job = await getJob(env, m.id);
        return job ? json(job, 200, cors) : json({ error: "No such job." }, 404, cors);
      }
      if ((m = matchPath("/jobs/:id", path)) && method === "PATCH") {
        const body = await request.json().catch(() => ({}));
        const job = await patchJob(env, m.id, body, session.login);
        return job ? json(job, 200, cors) : json({ error: "No such job." }, 404, cors);
      }
      if ((m = matchPath("/jobs/:id/files/:name", path)) && method === "GET") {
        const row = await env.JOBS.prepare("SELECT attachments_json FROM jobs WHERE id = ?1").bind(m.id).first();
        const att = row ? parseJson(row.attachments_json, []).find((a) => a.filename === m.name) : null;
        if (!att) return json({ error: "File not found." }, 404, cors);
        return serveFile(env, att.key, request);
      }

      // ── Quotes ──
      if (path === "/quotes" && method === "GET") return json(await listQuotes(env, url), 200, cors);
      if ((m = matchPath("/quotes/:id", path)) && method === "PATCH") {
        const body = await request.json().catch(() => ({}));
        const quote = await patchQuote(env, m.id, body);
        return quote ? json(quote, 200, cors) : json({ error: "No such quote." }, 404, cors);
      }
      if ((m = matchPath("/quotes/:id/files/:name", path)) && method === "GET") {
        const row = await env.JOBS.prepare("SELECT photo_json FROM quotes WHERE id = ?1").bind(m.id).first();
        const photo = row ? parseJson(row.photo_json, null) : null;
        if (!photo || photo.filename !== m.name) return json({ error: "File not found." }, 404, cors);
        return serveFile(env, photo.key, request);
      }

      // ── Website photos ──
      if (path === "/site/photos" && method === "GET") {
        const file = await github(session.gh_token, "GET", `/repos/${repo}/contents/${MANIFEST_PATH}?ref=${branch}`);
        const manifest = normaliseManifest(JSON.parse(decodeContent(file)));
        let canPublish = false;
        try {
          const about = await github(session.gh_token, "GET", `/repos/${repo}`);
          canPublish = !!about.permissions?.push;
        } catch (err) {
          if (err.status !== 403 && err.status !== 404) throw err;
        }
        return json({ manifest, repo, branch, siteOrigin: adminOrigin, canPublish }, 200, cors);
      }
      if (path === "/site/photos/upload" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const content = typeof body.contentBase64 === "string" ? body.contentBase64.replace(/\s/g, "") : "";
        const bytes = Math.floor((content.length * 3) / 4);
        if (!content) return json({ error: "No photo was sent." }, 400, cors);
        if (!content.startsWith("/9j/")) return json({ error: "Photos must be JPEGs; the page makes them so before sending." }, 400, cors);
        if (bytes > MAX_IMAGE_BYTES) return json({ error: "That photo is over 6MB even after shrinking." }, 413, cors);
        const blob = await github(session.gh_token, "POST", `/repos/${repo}/git/blobs`, { content, encoding: "base64" });
        return json({ sha: blob.sha, bytes }, 200, cors);
      }
      if (path === "/site/photos/publish" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const check = validateChange(body);
        if (!check.ok) return json({ error: check.errors.join("; ") }, 400, cors);
        try {
          return json(await publishChange(session.gh_token, repo, branch, check, session.login), 200, cors);
        } catch (err) {
          if (err.conflict) return json({ error: err.message, conflict: true }, 409, cors);
          throw err;
        }
      }

      // ── Cloudflare ──
      if (path === "/cloudflare/summary" && method === "GET") {
        const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 30));
        return json(await cloudflareSummary(env, days), 200, cors);
      }

      // ── Google Business Profile ──
      if (path === "/google/status" && method === "GET") {
        const configured = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
        const connected = configured && !!(await getSetting(env, "google.refresh_token"));
        const location = connected ? parseJson(await getSetting(env, "google.location"), null) : null;
        return json({ configured, connected, location, redirectUri: `${workerOrigin}/auth/google/callback` }, 200, cors);
      }
      if (path === "/auth/google/start" && method === "GET") {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ error: "Google is not configured on this worker." }, 400, cors);
        const state = await signState(env.GOOGLE_CLIENT_SECRET, { sid: session.id });
        const params = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          redirect_uri: `${workerOrigin}/auth/google/callback`,
          response_type: "code",
          scope: GOOGLE_SCOPE,
          access_type: "offline",
          prompt: "consent",
          state,
        });
        return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }, 200, cors);
      }
      if (path === "/google/summary" && method === "GET") {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ connected: false, configured: false }, 200, cors);
        const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days")) || 28));
        return json({ configured: true, ...(await googleSummary(env, days)) }, 200, cors);
      }
      if (path === "/google/disconnect" && method === "POST") {
        await env.JOBS.prepare("DELETE FROM settings WHERE key LIKE 'google.%'").run();
        return json({ ok: true }, 200, cors);
      }

      return json({ error: "Not found." }, 404, cors);
    } catch (err) {
      console.error("admin-worker error", String(err));
      return json({ error: String(err.message || err) }, 500, cors);
    }
  },
};

