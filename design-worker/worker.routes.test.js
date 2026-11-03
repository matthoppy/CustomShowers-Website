/**
 * Request-level tests: enquiry path keeps the v5 lenient Turnstile behaviour,
 * Gemini endpoints stay strict. Network calls are mocked.
 * Run with: node design-worker/worker.routes.test.js
 */
import { test, afterEach } from "node:test";
import assert from "node:assert";
import worker from "./worker.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const ENV = { RESEND_API_KEY: "test-resend", TURNSTILE_SECRET_KEY: "test-secret" };

function enquiry(extra = {}) {
  return new Request("https://worker.test/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://customshowers.uk" },
    body: JSON.stringify({
      tenantId: "customshowers",
      customer: { name: "Test Customer", email: "test@example.com" },
      summary: "Walk-in panel",
      spec: {},
      antispam: { elapsedMs: 60000 },
      ...extra,
    }),
  });
}

function mockFetch({ turnstileSuccess = true } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("turnstile")) {
      return new Response(JSON.stringify(turnstileSuccess
        ? { success: true }
        : { success: false, "error-codes": ["invalid-input-response"] }));
    }
    return new Response(JSON.stringify({ id: "email-id" }), { status: 200 });
  };
  return calls;
}

test("enquiry: missing token is let through and flagged 'Security check did not run'", async () => {
  const calls = mockFetch();
  const res = await worker.fetch(enquiry(), ENV);
  assert.notStrictEqual(res.status, 403);
  assert.strictEqual(res.status, 200);
  assert.ok(!calls.some(c => c.url.includes("turnstile")), "no siteverify call without a token");
  const workshop = calls.find(c => c.url.includes("resend") && c.init.body.includes("Security check did not run"));
  assert.ok(workshop, "workshop email carries the skipped-challenge warning");
});

test("enquiry: invalid token is still rejected with 400", async () => {
  const calls = mockFetch({ turnstileSuccess: false });
  const res = await worker.fetch(enquiry({ turnstileToken: "bad" }), ENV);
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /Security check failed/);
  assert.ok(!calls.some(c => c.url.includes("resend")), "no email sent");
});

test("enquiry: valid token sends without the warning", async () => {
  const calls = mockFetch();
  const res = await worker.fetch(enquiry({ turnstileToken: "good" }), ENV);
  assert.strictEqual(res.status, 200);
  assert.ok(!calls.some(c => c.url.includes("resend") && c.init.body.includes("Security check did not run")));
});

for (const path of ["/analyse", "/suggest"]) {
  test(`${path}: missing token is refused and never reaches Gemini`, async () => {
    const calls = mockFetch();
    const req = new Request(`https://worker.test${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://customshowers.uk" },
      body: JSON.stringify({ images: [{ mimeType: "image/jpeg", data: "AAAA" }] }),
    });
    const res = await worker.fetch(req, { ...ENV, GEMINI_API_KEY: "test-gemini" });
    const body = await res.json();
    assert.ok(res.status === 403 || body.available === false, `got ${res.status}`);
    assert.ok(!calls.some(c => c.url.includes("generativelanguage")), "Gemini not called");
  });
}

// ── Keeping the job for the dashboard ────────────────────────────────────────

/** The worker rate-limits five enquiries per IP, so each test comes from its own address. */
let nextIp = 10;
function enquiryFromFreshIp(extra = {}) {
  const req = enquiry(extra);
  const headers = new Headers(req.headers);
  headers.set("cf-connecting-ip", `10.0.0.${nextIp++}`);
  return new Request(req.url, { method: "POST", headers, body: req.body, duplex: "half" });
}

function fakeD1(runs, { fail = false } = {}) {
  return {
    prepare: (sql) => ({
      bind: (...args) => ({
        run: async () => {
          if (fail) throw new Error("D1 down");
          runs.push({ sql, args });
          return { success: true };
        },
      }),
    }),
  };
}

test("enquiry: keeps the job in D1 and the files in the store when they are bound", async () => {
  mockFetch();
  const runs = [];
  const puts = [];
  const env = {
    ...ENV,
    JOBS: fakeD1(runs),
    FILES_KV: { put: async (key, bytes, opts) => { puts.push({ key, bytes: bytes.length, opts }); } },
  };
  const res = await worker.fetch(
    enquiryFromFreshIp({
      summary: { panelCount: 2, runWidthMm: "1210mm", heightMm: "2000mm", finish: "Polished chrome" },
      attachments: [
        { filename: "plan-view.png", content: btoa("png-bytes") },
        { filename: "measured-height.jpg", content: btoa("jpg-bytes") },
      ],
    }),
    env
  );
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.match(body.jobId, /^CS-\d{8}-[A-HJ-NP-Z2-9]{4}$/);
  assert.strictEqual(puts.length, 2);
  assert.strictEqual(puts[0].key, `jobs/${body.jobId}/plan-view.png`);
  assert.strictEqual(puts[0].opts.metadata.contentType, "image/png");
  assert.strictEqual(runs.length, 2);
  assert.ok(runs[0].sql.includes("INSERT INTO jobs"));
  assert.strictEqual(runs[0].args[0], body.jobId);
  assert.strictEqual(runs[0].args[7], "2 panels · 1210mm wide · 2000mm tall · Polished chrome");
  const attachments = JSON.parse(runs[0].args[10]);
  assert.deepStrictEqual(attachments.map((a) => a.kind), ["drawing", "measurement"]);
  assert.ok(runs[1].sql.includes("INSERT INTO job_events"));
});

test("enquiry: a database failure never fails a design that has already been emailed", async () => {
  mockFetch();
  const env = { ...ENV, JOBS: fakeD1([], { fail: true }) };
  const res = await worker.fetch(enquiryFromFreshIp(), env);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).jobId, null);
});

test("enquiry: without bindings the worker only emails, as before", async () => {
  mockFetch();
  const res = await worker.fetch(enquiryFromFreshIp(), ENV);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).jobId, null);
});
