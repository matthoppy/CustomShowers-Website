/**
 * The admin worker: sign-in, sessions, jobs, files, and the picture commit.
 * Network and bindings are faked. Run with: node admin-worker/worker.test.js
 */
import { test, afterEach } from "node:test";
import assert from "node:assert";
import worker, { isAllowedLogin, matchPath, safeReturnPath, signState, validatePublish, verifyState } from "./worker.js";

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

test("a publish is checked before any blob is made", () => {
  const good = validatePublish({
    manifest: { hero: { src: "/images/site/h.jpg", alt: "" }, about: [{ src: "/images/a.jpg", alt: "" }, { src: "/images/b.jpg", alt: "" }], gallery: [{ src: "/images/g.jpg", alt: "" }] },
    files: [{ path: "public/images/site/h.jpg", contentBase64: "aGk=" }],
    removals: ["public/images/old.jpg"],
  });
  assert.ok(good.ok, good.errors.join("; "));
  const bad = validatePublish({ manifest: {}, files: [{ path: "src/main.tsx", contentBase64: "aGk=" }, { path: "public/images/../x.jpg", contentBase64: "aGk=" }], removals: ["package.json"] });
  assert.ok(!bad.ok);
  assert.ok(bad.errors.some((m) => m.includes("src/main.tsx")));
  assert.ok(bad.errors.some((m) => m.includes("package.json")));
  assert.ok(bad.errors.some((m) => m.includes("hero")));
});

test("publishing makes one commit on the branch as the signed-in user, in the right order", async () => {
  const { env: e } = env();
  const calls = mockFetch([
    [/git\/ref\/heads\/main$/, { object: { sha: "head" } }],
    [/git\/commits\/head$/, { tree: { sha: "basetree" } }],
    [/git\/blobs$/, (u, init) => ({ sha: `blob-${JSON.parse(init.body).encoding}` })],
    [/git\/trees$/, { sha: "newtree" }],
    [/git\/commits$/, { sha: "newcommit" }],
    [/git\/refs\/heads\/main$/, { ref: "refs/heads/main" }],
  ]);
  const res = await worker.fetch(
    req("/site/images/publish", {
      method: "POST",
      body: {
        manifest: { hero: { src: "/images/site/h.jpg", alt: "Hero" }, about: [{ src: "/images/a.jpg", alt: "" }, { src: "/images/b.jpg", alt: "" }], gallery: [{ src: "/images/g.jpg", alt: "" }] },
        files: [{ path: "public/images/site/h.jpg", contentBase64: "aGk=" }],
        removals: ["public/images/old.jpg"],
        message: "New hero",
      },
    }),
    e
  );
  const text = await res.text();
  assert.strictEqual(res.status, 200, text);
  const body = JSON.parse(text);
  assert.strictEqual(body.sha, "newcommit");
  const order = calls.map((c) => `${c.method} ${new URL(c.url).pathname.replace("/repos/matthoppy/CustomShowers-Website", "")}`);
  assert.deepStrictEqual(order, [
    "GET /git/ref/heads/main",
    "GET /git/commits/head",
    "POST /git/blobs",
    "POST /git/blobs",
    "POST /git/trees",
    "POST /git/commits",
    "PATCH /git/refs/heads/main",
  ]);
  const tree = calls[4].body.tree;
  assert.deepStrictEqual(tree.map((t) => [t.path, t.sha]), [
    ["public/images/site/h.jpg", "blob-base64"],
    ["public/images/old.jpg", null],
    ["src/content/site-images.json", "blob-utf-8"],
  ]);
  assert.strictEqual(calls[5].body.message, "New hero");
  assert.deepStrictEqual(calls[5].body.parents, ["head"]);
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
