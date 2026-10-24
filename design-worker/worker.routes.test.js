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
