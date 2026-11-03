/**
 * The quote form handler: kept in D1, emailed, never dependent on Supabase.
 * Run with: node contact-worker/worker.test.js
 */
import { test, afterEach } from "node:test";
import assert from "node:assert";
import worker, { newQuoteId, readEnquiry } from "./worker.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function request(body, origin = "https://customshowers.uk") {
  return new Request("https://worker.test/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
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

function mockFetch({ turnstile = true, resend = true, supabase = true } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u.includes("turnstile")) return new Response(JSON.stringify({ success: turnstile }));
    if (u.includes("resend.com")) return new Response(JSON.stringify({ id: "mail" }), { status: resend ? 200 : 500 });
    if (u.includes("supabase")) return new Response(supabase ? "" : "paused", { status: supabase ? 201 : 503 });
    return new Response("", { status: 200 });
  };
  return calls;
}

const ENV = { RESEND_API_KEY: "re_test", TURNSTILE_SECRET_KEY: "ts_test" };
const form = {
  name: "Jo Bloggs",
  email: "jo@example.com",
  phone: "07000 000000",
  address: "1 Street, London, SW6 1AA",
  serviceType: "London",
  message: "Walk-in screen please",
  turnstileToken: "tok",
  utm_source: "google",
  gclid: "abc",
};

test("quote ids read as Q-YYYYMMDD-XXXX without confusable letters", () => {
  assert.match(newQuoteId(new Date("2026-11-03T10:00:00Z")), /^Q-20261103-[A-HJ-NP-Z2-9]{4}$/);
});

test("the form's fields are read whichever casing the client used", () => {
  const q = readEnquiry({ name: " A ", email: "a@b.c", service_type: "Outside London", photo: { name: "x.jpg", type: "image/jpeg", data: "aGk=" } });
  assert.strictEqual(q.name, "A");
  assert.strictEqual(q.serviceType, "Outside London");
  assert.strictEqual(q.photo.name, "x.jpg");
  assert.strictEqual(readEnquiry({ photo: { name: "x" } }).photo, null);
});

test("a good enquiry is kept, emailed with the photo attached, and the quote number travels", async () => {
  const calls = mockFetch();
  const runs = [];
  const puts = [];
  const env = { ...ENV, JOBS: fakeD1(runs), FILES_KV: { put: async (key, bytes, opts) => puts.push({ key, bytes: bytes.length, opts }) } };
  const res = await worker.fetch(request({ ...form, photo: { name: "my sketch.png", type: "image/png", data: btoa("png") } }), env);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.success, true);
  assert.match(body.quoteId, /^Q-/);
  assert.strictEqual(puts[0].key, `quotes/${body.quoteId}/my_sketch.png`);
  assert.ok(runs[0].sql.includes("INSERT INTO quotes"));
  assert.ok(runs[1].sql.includes("UPDATE quotes SET emailed = 1"));
  const mails = calls.filter((c) => c.url.includes("resend.com")).map((c) => JSON.parse(c.init.body));
  assert.strictEqual(mails.length, 2);
  assert.ok(mails[0].subject.includes(body.quoteId));
  assert.strictEqual(mails[0].attachments[0].filename, "my sketch.png");
  assert.ok(calls.some((c) => c.url.includes("googleadservices.com")));
});

test("a paused Supabase does not fail the form any more", async () => {
  mockFetch({ supabase: false });
  const runs = [];
  const env = { ...ENV, SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_KEY: "k", JOBS: fakeD1(runs) };
  const res = await worker.fetch(request(form), env);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(runs[0].args[11], 0, "supabase_ok recorded as false");
});

test("without a database the email alone counts as received; with neither it fails", async () => {
  mockFetch();
  const res = await worker.fetch(request(form), ENV);
  assert.strictEqual((await res.json()).success, true);
  mockFetch({ resend: false });
  const dead = await worker.fetch(request(form), { ...ENV, JOBS: fakeD1([], { fail: true }) });
  assert.strictEqual(dead.status, 500);
});

test("a bad or missing security token is refused before anything is kept", async () => {
  mockFetch({ turnstile: false });
  const runs = [];
  const env = { ...ENV, JOBS: fakeD1(runs) };
  assert.strictEqual((await worker.fetch(request(form), env)).status, 403);
  assert.strictEqual((await worker.fetch(request({ ...form, turnstileToken: "" }), env)).status, 403);
  assert.strictEqual(runs.length, 0);
});

test("name and email are required", async () => {
  mockFetch();
  assert.strictEqual((await worker.fetch(request({ email: "a@b.c" }), ENV)).status, 400);
});
