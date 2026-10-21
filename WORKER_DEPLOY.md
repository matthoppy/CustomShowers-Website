# Deploying the `customshowers-design` Worker

This Worker receives a completed shower design from the configurator at
customshowers.uk/design-shower and emails it to the workshop, with the
drawings and the customer's photos attached.

It is deployed by **pasting one file into the Cloudflare dashboard**. There is
no build step and no bundler — `design-worker/worker.js` is the whole thing.

---

## What is being deployed, and why it matters

| | |
| --- | --- |
| Worker name | `customshowers-design` (exact — the configurator posts to it by name) |
| URL | `https://customshowers-design.vcwvk4sm9m.workers.dev` |
| File to paste | `design-worker/worker.js` from this repository |
| Currently live | **v7** |
| This file | **v12** |

The live version is five behind. Until it is updated:

- **Attachments are capped at 4.** Two of those are the plan and elevation
  drawings, so only the first two customer photos arrive. Anything after that
  is dropped silently — no error, no note in the email.
- The measurement summary rows (`openingWidths`, `openingCondition`,
  `measuredBy`) render as raw field names instead of labels.
- Blocking issues the customer was warned about are not shown.
- Cutout positions are missing from the panel table.

Nothing breaks — v7 degrades rather than erroring — but the photos backing up
each measurement are the point of the new flow, and most of them never arrive.

---

## Steps

1. Sign in at **dash.cloudflare.com**.
2. Left sidebar → **Compute (Workers)** → **Workers & Pages**.
3. Open the Worker named **`customshowers-design`**.
4. Top right → **Edit code**. A code editor opens showing the current
   `worker.js`.
5. Click into the editor, **select all** (Ctrl-A / Cmd-A) and **delete**.
6. Paste the entire contents of `design-worker/worker.js` from this
   repository. Paste all 564 lines — the file is self-contained.
7. Top right → **Deploy**. Confirm when prompted.

### Check it took

Open this in a browser:

```
https://customshowers-design.vcwvk4sm9m.workers.dev
```

It should answer:

```
customshowers-design v12 — this endpoint only accepts POST from the configurator.
```

A **405 Method Not Allowed** page showing **v12** is the correct, healthy
response — the Worker only accepts POST from the configurator, and the version
string is there precisely so a browser visit confirms which paste is live.

If it still says **v7**, the deploy did not take. Repeat from step 4.

---

## Do not touch the secrets

The Worker already has these set, and they are **not** in the file:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sends the email. Without it every enquiry fails. |
| `TURNSTILE_SECRET_KEY` | Pairs with the site key in `src/configurator/tenant.ts`. |
| `BUSINESS_EMAIL` | Optional. Defaults to sales@customshowers.uk. |
| `FROM_EMAIL` | Optional. Defaults to noreply@customshowers.uk. |

Pasting the code does not affect them. **Do not delete and recreate the
Worker** — that loses the secrets, and the Turnstile key in particular must be
the exact pair of the site key the page uses, or every submission is rejected
with "Security check failed".

---

## Alternative: command line

If wrangler is set up and authenticated against the right Cloudflare account:

```bash
cd design-worker
npx wrangler deploy
```

`wrangler.toml` already names the Worker and sets the compatibility date.
Secrets are untouched by a deploy.

---

## Afterwards: send one real enquiry

Worth doing from a phone, because the photo capture opens the rear camera and
that path cannot be tested on a desktop.

1. Go to **customshowers.uk/design-shower**.
2. Pick a shape, work through the **Measure** step, attach a photo at one or
   two of the measurements.
3. Fill in your own name and email, and send it.

Then check **sales@customshowers.uk**. The email should contain:

- A **Configuration** table including *Opening measured*, *Walls and floor*
  and *Checked with* — as labels, not as `openingWidths`.
- A **panel schedule** with cut sizes, hinge counts and cutout positions.
- Attachments named for what they show: `plan-view.png`,
  `elevation-view.png`, then `measured-height.jpg`,
  `measured-width-at-floor-run1.jpg`, `measured-wall-lean.jpg` and so on.

If the labels are right but the photos are missing, the paste did not take —
check the version string again.

---

## If something goes wrong

The Worker names its own faults rather than returning a generic error.

| What the browser shows | What it means |
| --- | --- |
| `Could not send the email. The RESEND_API_KEY on this worker is missing or wrong.` | Resend rejected the key. |
| `Resend refused the sender address...` | The domain in `FROM_EMAIL` is not verified in Resend. |
| `Security check failed. The TURNSTILE_SECRET_KEY on this worker does not match the site key...` | The secret and the site key are from different Turnstile widgets. They only work as the pair Turnstile issued. |
| `Too many designs sent from here just now.` | Rate limit: 5 per IP per 10 minutes. Expected while testing — wait it out. |

Live logs: Worker → **Logs** → **Begin log stream**, then submit an enquiry.
