/**
 * The admin worker: sign-in, sessions, jobs, files, and the photo publish.
 * Network and bindings are faked. Run with: node admin-worker/worker.test.js
 */
import { test, afterEach } from "node:test";
import assert from "node:assert";
import worker, { applyChange, isAllowedLogin, matchPath, normaliseManifest, safeReturnPath, signInResponse, signState, validateChange, verifyState } from "./worker.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const ORIGIN = "https://customshowers-admin.test.workers.dev";
const SESSION = {
  id: "sess-1",
  login: "matthoppy",
  name: "Matt",
  avatar_url: "https://avatars.test/1",
  gh_token: "gho_test",
  created_at: "2026-11-03T00:00:00Z",
  expires_at: "2099-01-01T00:00:00Z",
};

/** A D1 stand-in: canned answers by SQL pattern, every call recorded. */
function fakeDb(handlers = []) {
  const calls = [];
  const statement = (sql, args) => {
    const h = handlers.find((x) => x.match.test(sql));
    return {
      first: async () => { calls.push({ sql, args }); return h?.first ? h.first(args) : null; },
      all: async () => { calls.push({ sql, args }); return { results: h?.all ? h.all(args) : [] }; },
      run: async () => { calls.push({ sql, args }); if (h?.run) h.run(args); return { success: true }; },
    };
  };
  const db = {
    prepare: (sql) => ({
      bind: (...args) => statement(sql, args),
      first: () => statement(sql, []).first(),
      all: () => statement(sql, []).all(),
      run: () => statement(sql, []).run(),
    }),
  };
  return { db, calls };
}

const withSession = { match: /FROM sessions/, first: (args) => (args[0] === SESSION.id ? SESSION : null) };

function env(extra = {}, handlers = [withSession]) {
  const { db, calls } = fakeDb(handlers);
  return { env: { GITHUB_CLIENT_ID: "cid", GITHUB_CLIENT_SECRET: "csecret", JOBS: db, ...extra }, calls };
}

function req(path, { method = "GET", token = SESSION.id, body } = {}) {
  const headers = { Origin: "https://customshowers.uk" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  return new Request(`${ORIGIN}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

function mockFetch(routes) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    for (const [pattern, reply] of routes) {
      if (pattern.test(u)) {
        const r = typeof reply === "function" ? reply(u, init) : reply;
        return new Response(JSON.stringify(r.body ?? r), { status: r.status || 200, headers: { "Content-Type": "application/json" } });
      }
    }
    return new Response("{}", { status: 404 });
  };
  return calls;
}

test("paths: params are matched and decoded, anything else is null", () => {
  assert.deepStrictEqual(matchPath("/jobs/:id/files/:name", "/jobs/CS-1/files/plan%20view.png"), { id: "CS-1", name: "plan view.png" });
  assert.strictEqual(matchPath("/jobs/:id", "/jobs/CS-1/files/x"), null);
  assert.strictEqual(matchPath("/me", "/jobs"), null);
});

test("return paths stay inside the dashboard", () => {
  assert.strictEqual(safeReturnPath("/admin/jobs/CS-1"), "/admin/jobs/CS-1");
  assert.strictEqual(safeReturnPath("https://evil.example/admin"), "/admin");
  assert.strictEqual(safeReturnPath("//evil.example"), "/admin");
  assert.strictEqual(safeReturnPath(undefined), "/admin");
});

test("the allow-list is case-insensitive and comma-separated", () => {
  assert.ok(isAllowedLogin("MattHoppy"));
  assert.ok(isAllowedLogin("other", "matthoppy, Other"));
  assert.ok(!isAllowedLogin("stranger"));
  assert.ok(!isAllowedLogin(""));
});

test("signed state round-trips, and a tampered or stale one is refused", async () => {
  const state = await signState("secret", { r: "/admin/jobs" });
  assert.strictEqual((await verifyState("secret", state)).r, "/admin/jobs");
  assert.strictEqual(await verifyState("wrong", state), null);
  assert.strictEqual(await verifyState("secret", state.slice(0, -2) + "zz"), null);
  assert.strictEqual(await verifyState("secret", state, -1), null);
});

test("GET / names the worker without needing a session", async () => {
  const { env: e } = env();
  const res = await worker.fetch(req("/", { token: null }), e);
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /customshowers-admin v\d/);
});

test("sign-in start sends the browser to GitHub with a signed state and the repo scope", async () => {
  const { env: e } = env();
  const res = await worker.fetch(req("/auth/github/start?return=/admin/pictures", { token: null }), e);
  assert.strictEqual(res.status, 302);
  const to = new URL(res.headers.get("Location"));
  assert.strictEqual(to.origin + to.pathname, "https://github.com/login/oauth/authorize");
  assert.strictEqual(to.searchParams.get("scope"), "read:user repo");
  assert.strictEqual(to.searchParams.get("redirect_uri"), `${ORIGIN}/auth/github/callback`);
  const state = await verifyState("csecret", to.searchParams.get("state"));
  assert.strictEqual(state.r, "/admin/pictures");
});

test("sign-in start without a GitHub app configured explains itself", async () => {
  const { env: e } = env({ GITHUB_CLIENT_ID: "", GITHUB_CLIENT_SECRET: "" });
  const res = await worker.fetch(req("/auth/github/start", { token: null }), e);
  assert.match(res.headers.get("Location"), /#error=github-not-configured/);
});

test("the callback exchanges the code, checks the login, keeps a session and returns to the dashboard", async () => {
  const inserted = [];
  const { env: e } = env({}, [{ match: /INSERT INTO sessions/, run: (args) => inserted.push(args) }]);
  mockFetch([
    [/github\.com\/login\/oauth\/access_token/, { access_token: "gho_live" }],
    [/api\.github\.com\/user/, { login: "matthoppy", name: "Matt", avatar_url: "a" }],
  ]);
  const state = await signState("csecret", { r: "/admin/jobs" });
  const res = await worker.fetch(req(`/auth/github/callback?code=abc&state=${encodeURIComponent(state)}`, { token: null }), e);
  assert.strictEqual(res.status, 302);
  const to = res.headers.get("Location");
  assert.ok(to.startsWith("https://customshowers.uk/admin/auth#token="), to);
  assert.ok(to.includes("return=%2Fadmin%2Fjobs"));
  assert.strictEqual(inserted.length, 1);
  assert.strictEqual(inserted[0][1], "matthoppy");
  assert.strictEqual(inserted[0][4], "gho_live");
});

test("the callback refuses a login that is not on the list", async () => {
  const inserted = [];
  const { env: e } = env({}, [{ match: /INSERT INTO sessions/, run: (args) => inserted.push(args) }]);
  mockFetch([
    [/access_token/, { access_token: "gho_x" }],
    [/api\.github\.com\/user/, { login: "stranger" }],
  ]);
  const state = await signState("csecret", { r: "/admin" });
  const res = await worker.fetch(req(`/auth/github/callback?code=abc&state=${encodeURIComponent(state)}`, { token: null }), e);
  assert.match(res.headers.get("Location"), /#error=not-allowed&login=stranger/);
  assert.strictEqual(inserted.length, 0);
});

test("a popup sign-in is remembered in the state and answered with a page that hands over the token", async () => {
  const { env: e } = env({}, [{ match: /INSERT INTO sessions/, run: () => undefined }]);
  const start = await worker.fetch(req("/auth/github/start?return=/admin/photos&popup=1", { token: null }), e);
  const state = await verifyState("csecret", new URL(start.headers.get("Location")).searchParams.get("state"));
  assert.deepStrictEqual([state.r, state.p], ["/admin/photos", 1]);

  mockFetch([
    [/access_token/, { access_token: "gho_live" }],
    [/api\.github\.com\/user/, { login: "matthoppy", name: "Matt", avatar_url: "a" }],
  ]);
  const signed = await signState("csecret", { r: "/admin/photos", p: 1 });
  const res = await worker.fetch(req(`/auth/github/callback?code=abc&state=${encodeURIComponent(signed)}`, { token: null }), e);
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get("Content-Type"), /text\/html/);
  const html = await res.text();
  assert.match(html, /"source":"customshowers-admin","token":"[A-Za-z0-9_-]+","return":"\/admin\/photos"/);
  assert.ok(html.includes("customshowers-admin:ready"), "waits for the dashboard to say it is ready");
  assert.ok(html.includes('"https://customshowers.uk"'), "knows the dashboard's origin");
  assert.ok(html.includes("/admin/auth#token="), "falls back to the dashboard URL without an opener");
});

test("a refused popup sign-in hands over the error instead", () => {
  const res = signInResponse("https://customshowers.uk", true, { error: "not-allowed", login: "stranger" });
  assert.strictEqual(res.status, 200);
  return res.text().then((html) => {
    assert.ok(html.includes('"error":"not-allowed","login":"stranger"'));
  });
});

test("without the popup flag the outcome goes back in the URL fragment", () => {
  const res = signInResponse("https://customshowers.uk", false, { token: "sid", return: "/admin/jobs" });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get("Location"), "https://customshowers.uk/admin/auth#token=sid&return=%2Fadmin%2Fjobs");
});

test("everything past sign-in needs a live session", async () => {
  const { env: e } = env();
  assert.strictEqual((await worker.fetch(req("/me", { token: null }), e)).status, 401);
  assert.strictEqual((await worker.fetch(req("/me", { token: "nope" }), e)).status, 401);
  const res = await worker.fetch(req("/me"), e);
  assert.strictEqual(res.status, 200);
  const me = await res.json();
  assert.strictEqual(me.login, "matthoppy");
  assert.strictEqual(me.repo, "matthoppy/CustomShowers-Website");
  assert.deepStrictEqual(me.capabilities, { files: null, cloudflare: false, google: "unconfigured" });
});

test("the job list filters by status and search, and reports counts", async () => {
  const row = {
    id: "CS-20261103-ABCD", created_at: "2026-11-03T10:00:00Z", customer_name: "Jo", customer_email: "jo@x.y",
    status: "new", headline: "2 panels", attachments_json: '[{"filename":"plan-view.png","key":"k","bytes":1,"kind":"drawing"}]', flags_json: "{}", emailed: 1,
  };
  const { env: e, calls } = env({}, [
    withSession,
    { match: /SELECT status, COUNT/, all: () => [{ status: "new", n: 3 }, { status: "quoted", n: 1 }] },
    { match: /FROM jobs/, all: () => [row] },
  ]);
  const res = await worker.fetch(req("/jobs?status=new&q=jo"), e);
  const body = await res.json();
  assert.strictEqual(body.jobs[0].id, row.id);
  assert.strictEqual(body.jobs[0].attachments[0].kind, "drawing");
  assert.deepStrictEqual(body.counts, { new: 3, quoted: 1 });
  const listCall = calls.find((c) => c.sql.includes("FROM jobs WHERE"));
  assert.ok(listCall.sql.includes("status = ?1") && listCall.sql.includes("customer_name LIKE ?3"));
  assert.deepStrictEqual(listCall.args, ["new", "%jo%", "%jo%", "%jo%", "%jo%", "%jo%"]);
});

test("a job's files are served from the store with their type, by name only", async () => {
  const { env: e } = env(
    {
      FILES_KV: {
        getWithMetadata: async (key) =>
          key === "jobs/CS-1/plan-view.png"
            ? { value: new Uint8Array([1, 2, 3]).buffer, metadata: { contentType: "image/png" } }
            : { value: null, metadata: null },
      },
    },
    [
      withSession,
      { match: /SELECT attachments_json FROM jobs/, first: () => ({ attachments_json: '[{"filename":"plan-view.png","key":"jobs/CS-1/plan-view.png"}]' }) },
    ]
  );
  const ok = await worker.fetch(req("/jobs/CS-1/files/plan-view.png?t=sess-1", { token: null }), e);
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), "image/png");
  assert.strictEqual((await ok.arrayBuffer()).byteLength, 3);
  const missing = await worker.fetch(req("/jobs/CS-1/files/other.png"), e);
  assert.strictEqual(missing.status, 404);
});

test("changing a job's status records who did it", async () => {
  const events = [];
  const updates = [];
  const { env: e } = env({}, [
    withSession,
    { match: /SELECT status, notes FROM jobs/, first: () => ({ status: "new", notes: "" }) },
    { match: /INSERT INTO job_events/, run: (args) => events.push(args) },
    { match: /UPDATE jobs SET/, run: (args) => updates.push(args) },
    { match: /SELECT \* FROM jobs/, first: () => ({ id: "CS-1", status: "quoted", notes: "", attachments_json: "[]", flags_json: "{}", payload_json: "{}", summary_json: "{}" }) },
    { match: /FROM job_events WHERE/, all: () => [] },
  ]);
  const res = await worker.fetch(req("/jobs/CS-1", { method: "PATCH", body: { status: "quoted" } }), e);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0][2], "matthoppy");
  assert.strictEqual(events[0][3], "new → quoted");
  assert.strictEqual(updates[0][0], "quoted");
});

const MANIFEST = {
  version: 2,
  hero: { src: "/images/site/hero-shower.jpg", alt: "Hero", v: 1 },
  about: [{ src: "/images/site/about-shower-1.jpg", alt: "About 1", v: 1 }, { src: "/images/site/about-shower-2.jpg", alt: "About 2", v: 1 }],
  jobs: {
    enclosure: [{ title: "Frameless enclosure", photos: ["/images/site/gallery-1.jpg"] }],
    walkin: [
      { title: "Walk-in screen", photos: ["/images/site/walk-in-20261103-1.jpg", "/images/shower-screen-1.JPG"] },
      { title: "Second screen", photos: ["/images/shower-screen-2.JPG"] },
    ],
  },
};
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64");
const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

test("the manifest is normalised: every type present, a flat gallery carried over", () => {
  const m = normaliseManifest(MANIFEST);
  assert.deepStrictEqual(Object.keys(m.jobs), ["enclosure", "inline", "walkin", "sliding", "bath", "other"]);
  assert.strictEqual(m.jobs.walkin.length, 2);
  const legacy = normaliseManifest({ hero: MANIFEST.hero, about: [], gallery: [{ src: "/images/g.jpg", alt: "Old gallery picture", v: 1 }] });
  assert.deepStrictEqual(legacy.jobs.other, [{ title: "Old gallery picture", photos: ["/images/g.jpg"] }]);
  assert.strictEqual("gallery" in legacy, false);
});

test("a change is checked before GitHub is touched", () => {
  const ok = validateChange({
    change: { kind: "job", mode: "add", type: "walkin", title: "Walk-in screen in Fulham", photos: ["new:0", "/images/shower-screen-1.JPG"] },
    blobs: [{ sha: SHA_A }],
  });
  assert.ok(ok.ok, ok.errors.join("; "));
  const bad = validateChange({
    change: { kind: "job", mode: "add", type: "garage", title: "", photos: ["new:3", "../../package.json"] },
    blobs: [{ sha: "nope" }],
  });
  assert.ok(!bad.ok);
  assert.ok(bad.errors.some((m) => m.includes("type of work")));
  assert.ok(bad.errors.some((m) => m.includes("label")));
  assert.ok(bad.errors.some((m) => m.includes("new:3")));
  assert.ok(bad.errors.some((m) => m.includes("package.json")));
  assert.ok(bad.errors.some((m) => m.includes("blob id")));
  assert.ok(!validateChange({ change: { kind: "job", mode: "delete", origType: "walkin", origIndex: 0 } }).ok, "a delete needs the job as it was");
  assert.ok(validateChange({ change: { kind: "slot", slot: "about", index: 1, alt: "New about", photo: "new:0" }, blobs: [{ sha: SHA_A }] }).ok);
  assert.ok(!validateChange({ change: { kind: "slot", slot: "footer", alt: "" } }).ok);
});

test("adding a job puts it first in its type; the uploaded photos take their new paths", () => {
  const { manifest, removed } = applyChange(
    MANIFEST,
    { kind: "job", mode: "add", type: "walkin", title: "  Walk-in screen in Fulham ", photos: ["new:0", "new:1"] },
    ["/images/site/walk-in-screen-in-fulham-20261103-120000-1.jpg", "/images/site/walk-in-screen-in-fulham-20261103-120000-2.jpg"]
  );
  assert.deepStrictEqual(manifest.jobs.walkin[0], {
    title: "Walk-in screen in Fulham",
    photos: ["/images/site/walk-in-screen-in-fulham-20261103-120000-1.jpg", "/images/site/walk-in-screen-in-fulham-20261103-120000-2.jpg"],
  });
  assert.strictEqual(manifest.jobs.walkin.length, 3);
  assert.deepStrictEqual(removed, []);
  assert.strictEqual(MANIFEST.jobs.walkin.length, 2, "the manifest given is not changed");
});

test("updating a job keeps its place, or goes to the top of a new type; dropped photos under the site folder are tidied", () => {
  const orig = MANIFEST.jobs.walkin[0];
  const same = applyChange(MANIFEST, {
    kind: "job", mode: "update", type: "walkin", origType: "walkin", origIndex: 0, origJson: JSON.stringify(orig),
    title: "Walk-in screen, renamed", photos: ["/images/shower-screen-1.JPG"],
  });
  assert.strictEqual(same.manifest.jobs.walkin[0].title, "Walk-in screen, renamed");
  assert.deepStrictEqual(same.removed, ["/images/site/walk-in-20261103-1.jpg"], "the original site photo goes, the shared root picture stays");

  const moved = applyChange(MANIFEST, {
    kind: "job", mode: "update", type: "enclosure", origType: "walkin", origIndex: 1, origJson: JSON.stringify(orig),
    title: "Now an enclosure", photos: orig.photos,
  });
  assert.strictEqual(moved.manifest.jobs.enclosure[0].title, "Now an enclosure", "found by content when its index moved");
  assert.strictEqual(moved.manifest.jobs.walkin.length, 1);
  assert.deepStrictEqual(moved.removed, []);
});

test("deleting a job removes it and its unused photos; a job changed elsewhere is refused", () => {
  const orig = MANIFEST.jobs.walkin[0];
  const gone = applyChange(MANIFEST, { kind: "job", mode: "delete", origType: "walkin", origIndex: 0, origJson: JSON.stringify(orig) });
  assert.strictEqual(gone.manifest.jobs.walkin.length, 1);
  assert.deepStrictEqual(gone.removed, ["/images/site/walk-in-20261103-1.jpg"]);
  assert.throws(
    () => applyChange(MANIFEST, { kind: "job", mode: "delete", origType: "walkin", origIndex: 0, origJson: JSON.stringify({ title: "Edited elsewhere", photos: [] }) }),
    (err) => err.conflict === true && /changed somewhere else/.test(err.message)
  );
});

test("replacing a page picture drops the old file and resets its version; a new description alone keeps it", () => {
  const hero = applyChange(MANIFEST, { kind: "slot", slot: "hero", alt: "New hero", photo: "new:0" }, ["/images/site/hero-20261103-120000.jpg"]);
  assert.deepStrictEqual(hero.manifest.hero, { src: "/images/site/hero-20261103-120000.jpg", alt: "New hero", v: 1 });
  assert.deepStrictEqual(hero.removed, ["/images/site/hero-shower.jpg"]);
  const about = applyChange(MANIFEST, { kind: "slot", slot: "about", index: 1, alt: "Better words", photo: null });
  assert.deepStrictEqual(about.manifest.about[1], { src: "/images/site/about-shower-2.jpg", alt: "Better words", v: 1 });
  assert.deepStrictEqual(about.removed, []);
});

test("GET /site/photos gives the manifest and whether this account may publish", async () => {
  const { env: e } = env();
  mockFetch([
    [/contents\/src\/content\/site-images\.json/, { sha: "msha", content: b64(MANIFEST) }],
    [/repos\/matthoppy\/CustomShowers-Website$/, { permissions: { push: true } }],
  ]);
  const res = await worker.fetch(req("/site/photos"), e);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.canPublish, true);
  assert.strictEqual(body.manifest.jobs.walkin.length, 2);
  assert.deepStrictEqual(body.manifest.jobs.bath, []);
  assert.strictEqual(body.repo, "matthoppy/CustomShowers-Website");
});

test("an upload must be a JPEG and becomes a blob in the repository", async () => {
  const { env: e } = env();
  const calls = mockFetch([[/git\/blobs$/, { sha: SHA_A }]]);
  const notJpeg = await worker.fetch(req("/site/photos/upload", { method: "POST", body: { contentBase64: "aGk=" } }), e);
  assert.strictEqual(notJpeg.status, 400);
  const jpeg = await worker.fetch(req("/site/photos/upload", { method: "POST", body: { contentBase64: "/9j/4AAQSkZJRg==" } }), e);
  assert.strictEqual(jpeg.status, 200);
  assert.deepStrictEqual(await jpeg.json(), { sha: SHA_A, bytes: 12 });
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0].body, { content: "/9j/4AAQSkZJRg==", encoding: "base64" });
});

test("publishing reads the manifest at the head and makes one commit as the signed-in user, in the right order", async () => {
  const { env: e } = env();
  const calls = mockFetch([
    [/git\/ref\/heads\/main$/, { object: { sha: "head" } }],
    [/contents\/src\/content\/site-images\.json/, { sha: "msha", content: b64(MANIFEST) }],
    [/git\/commits\/head$/, { tree: { sha: "basetree" } }],
    [/git\/trees$/, { sha: "newtree" }],
    [/git\/commits$/, { sha: "newcommit" }],
    [/git\/refs\/heads\/main$/, { ref: "refs/heads/main" }],
  ]);
  const res = await worker.fetch(
    req("/site/photos/publish", {
      method: "POST",
      body: {
        change: { kind: "job", mode: "add", type: "walkin", title: "Walk-in screen in Fulham", photos: ["new:0", "new:1"] },
        blobs: [{ sha: SHA_A }, { sha: SHA_B }],
      },
    }),
    e
  );
  const text = await res.text();
  assert.strictEqual(res.status, 200, text);
  const body = JSON.parse(text);
  assert.strictEqual(body.sha, "newcommit");
  assert.strictEqual(body.url, "https://github.com/matthoppy/CustomShowers-Website/commit/newcommit");
  assert.strictEqual(body.newPaths.length, 2);
  assert.match(body.newPaths[0], /^\/images\/site\/walk-in-screen-in-fulham-\d{8}-\d{6}-1\.jpg$/);
  assert.deepStrictEqual(body.manifest.jobs.walkin[0], { title: "Walk-in screen in Fulham", photos: body.newPaths });

  const order = calls.map((c) => `${c.method} ${new URL(c.url).pathname.replace("/repos/matthoppy/CustomShowers-Website", "")}`);
  assert.deepStrictEqual(order, [
    "GET /git/ref/heads/main",
    "GET /contents/src/content/site-images.json",
    "GET /git/commits/head",
    "POST /git/trees",
    "POST /git/commits",
    "PATCH /git/refs/heads/main",
  ]);
  const tree = calls[3].body.tree;
  assert.deepStrictEqual(tree.map((t) => [t.path, "sha" in t ? t.sha : "content"]), [
    [`public${body.newPaths[0]}`, SHA_A],
    [`public${body.newPaths[1]}`, SHA_B],
    ["src/content/site-images.json", "content"],
  ]);
  assert.deepStrictEqual(JSON.parse(tree[2].content), body.manifest);
  assert.match(calls[4].body.message, /^Add gallery job: Walk-in screen in Fulham \(Walk-in screens\)\n\nVia the website photos page by matthoppy$/);
  assert.deepStrictEqual(calls[4].body.parents, ["head"]);
  assert.deepStrictEqual(calls[5].body, { sha: "newcommit", force: false });
});

test("when someone else commits first, the publish starts again from the new head and removes tidied files", async () => {
  const { env: e } = env();
  let patches = 0;
  let heads = 0;
  const calls = mockFetch([
    [/git\/ref\/heads\/main$/, () => ({ object: { sha: `head${++heads}` } })],
    [/contents\/src\/content\/site-images\.json/, { sha: "msha", content: b64(MANIFEST) }],
    [/git\/commits\/head\d$/, { tree: { sha: "basetree" } }],
    [/git\/trees$/, { sha: "newtree" }],
    [/git\/commits$/, { sha: "newcommit" }],
    [/git\/refs\/heads\/main$/, () => (++patches === 1 ? { status: 422, body: { message: "Update is not a fast forward" } } : { ref: "refs/heads/main" })],
  ]);
  const orig = MANIFEST.jobs.walkin[0];
  const res = await worker.fetch(
    req("/site/photos/publish", {
      method: "POST",
      body: { change: { kind: "job", mode: "delete", origType: "walkin", origIndex: 0, origJson: JSON.stringify(orig) }, blobs: [] },
    }),
    e
  );
  assert.strictEqual(res.status, 200, await res.clone().text());
  assert.strictEqual(patches, 2);
  assert.strictEqual(heads, 2);
  const lastCommit = calls.filter((c) => /git\/commits$/.test(c.url)).pop();
  assert.deepStrictEqual(lastCommit.body.parents, ["head2"]);
  const lastTree = calls.filter((c) => /git\/trees$/.test(c.url)).pop().body.tree;
  assert.deepStrictEqual(lastTree.map((t) => [t.path, "sha" in t ? t.sha : "content"]), [
    ["src/content/site-images.json", "content"],
    ["public/images/site/walk-in-20261103-1.jpg", null],
  ]);
  assert.match(lastCommit.body.message, /^Remove gallery job: Walk-in screen \(Walk-in screens\)/);
});

test("a job changed elsewhere is refused as a conflict, and nothing is committed", async () => {
  const { env: e } = env();
  const calls = mockFetch([
    [/git\/ref\/heads\/main$/, { object: { sha: "head" } }],
    [/contents\/src\/content\/site-images\.json/, { sha: "msha", content: b64(MANIFEST) }],
  ]);
  const res = await worker.fetch(
    req("/site/photos/publish", {
      method: "POST",
      body: {
        change: { kind: "job", mode: "update", type: "walkin", origType: "walkin", origIndex: 0, origJson: JSON.stringify({ title: "Stale", photos: ["/images/x.jpg"] }), title: "T", photos: ["/images/x.jpg"] },
        blobs: [],
      },
    }),
    e
  );
  assert.strictEqual(res.status, 409);
  const body = await res.json();
  assert.strictEqual(body.conflict, true);
  assert.ok(calls.every((c) => c.method === "GET"), "nothing was written");
});

test("Cloudflare and Google answer 'not configured' rather than failing when unset", async () => {
  const { env: e } = env();
  const cf = await (await worker.fetch(req("/cloudflare/summary"), e)).json();
  assert.deepStrictEqual(cf.configured, { token: false, zone: false, account: false });
  const g = await (await worker.fetch(req("/google/status"), e)).json();
  assert.strictEqual(g.configured, false);
  const gs = await (await worker.fetch(req("/google/summary"), e)).json();
  assert.strictEqual(gs.configured, false);
});
