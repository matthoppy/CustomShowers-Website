# Deploying the `customshowers-design` Worker (Dashboard Paste)

This Worker receives completed shower designs from the configurator and emails
them to the workshop. It now includes **Gemini photo recognition** endpoints for
measurement analysis and configuration suggestions.

It is deployed by **pasting one file into the Cloudflare dashboard**. There is
no build step and no bundler — `design-worker/worker.paste.js` is the whole thing.

---

## What is being deployed

| | |
| --- | --- |
| Worker name | `customshowers-design` (exact — the configurator posts to it by name) |
| URL | `https://customshowers-design.vcwvk4sm9m.workers.dev` |
| File to paste | `design-worker/worker.paste.js` from this repository |
| Current version | **v14** |

---

## Steps

1. Sign in at **dash.cloudflare.com**.
2. Left sidebar → **Compute (Workers)** → **Workers & Pages**.
3. Open the Worker named **`customshowers-design`**.
4. Top right → **Edit code**. A code editor opens showing the current worker.
5. Click into the editor, **select all** (Ctrl-A / Cmd-A) and **delete**.
6. Paste the entire contents of `design-worker/worker.paste.js` from this
   repository. The file is self-contained (approximately 1014 lines).
7. Top right → **Deploy**. Confirm when prompted.

### Check it took

Open this in a browser:

```
https://customshowers-design.vcwvk4sm9m.workers.dev
```

It should answer:

```
customshowers-design v14 — this endpoint only accepts POST from the configurator.
```

A **405 Method Not Allowed** page showing **v14** is the correct, healthy
response — the Worker only accepts POST from the configurator, and the version
string is there precisely so a browser visit confirms which paste is live.

If it still says an older version, the deploy did not take. Repeat from step 4.

---

## Secrets and Environment Variables

The Worker requires these secrets to be set in the dashboard. Pasting the code
does not affect them.

### Required Secrets

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sends the email. Without it every enquiry fails. |
| `TURNSTILE_SECRET_KEY` | Pairs with the site key in `src/configurator/tenant.ts`. |

### Optional Secrets

| Variable | Purpose | Default |
| --- | --- | --- |
| `GEMINI_API_KEY` | Enables photo recognition features (/analyse and /suggest endpoints). | None (features disabled) |
| `BUSINESS_EMAIL` | Destination for workshop notifications. | sales@customshowers.uk |
| `FROM_EMAIL` | Sender address for emails. | noreply@customshowers.uk |

### Adding GEMINI_API_KEY

If you want to enable Gemini photo recognition:

1. In the Worker page, click **Settings** → **Variables and Secrets**.
2. Under **Environment Variables**, click **Add**.
3. Select **Secret** (not Variable — the API key must be encrypted).
4. Name: `GEMINI_API_KEY`
5. Value: Your Gemini API key from Google AI Studio.
6. Click **Deploy** to save.

The `/analyse` and `/suggest` endpoints will now respond with
`{ "available": true, ... }` instead of `{ "available": false, "reason": "Feature not configured" }`.

**Do not delete and recreate the Worker** — that loses all secrets, and the
Turnstile key in particular must be the exact pair of the site key the page
uses, or every submission is rejected with "Security check failed".

---

## New Endpoints in v14

### POST /analyse

Analyses uploaded measurement photos and extracts visible measurements:
- Opening height
- Floor width
- Wall lean or out-of-plumb
- Tape measure or laser readings

**Request:**
```json
{
  "images": [
    { "mimeType": "image/jpeg", "data": "base64..." }
  ],
  "turnstileToken": "..."
}
```

**Response (success):**
```json
{
  "available": true,
  "readings": [
    {
      "value": 1850,
      "unit": "mm",
      "confidence": 0.95,
      "source": "tape measure showing 1850mm on left wall"
    }
  ],
  "notes": "Clear measurements visible"
}
```

**Response (unavailable):**
```json
{
  "available": false,
  "reason": "Feature not configured"
}
```

### POST /suggest

Suggests shower configuration from a room photo:
- Panel count and arrangement
- Mounting options
- Glass type and finish
- Handle placement

**Request:**
```json
{
  "images": [
    { "mimeType": "image/jpeg", "data": "base64..." }
  ],
  "turnstileToken": "..."
}
```

**Response (success):**
```json
{
  "available": true,
  "config": {
    "panelCount": 3,
    "mounting": "wall-to-wall",
    "finish": "chrome",
    "heightMm": 2000
  },
  "notes": "Suitable for standard alcove installation"
}
```

**Limits:**
- Maximum 4 images per request
- Maximum 5MB per image
- Allowed formats: JPEG, PNG, WebP, HEIC, HEIF
- 20-second timeout
- Requires valid Turnstile token (if TURNSTILE_SECRET_KEY is set)

---

## Rollback

If v14 causes problems, you can roll back by pasting an older version of the
worker from git history:

1. Find the previous version in the repository:
   ```bash
   git log --oneline design-worker/worker.js
   git show <commit-hash>:design-worker/worker.js > /tmp/old-worker.js
   ```

2. Follow the deployment steps above, but paste the contents of
   `/tmp/old-worker.js` instead.

3. Verify the version string changes back to the expected version (e.g., v13).

Alternatively, use Cloudflare's built-in rollback:
1. Worker page → **Deployments**
2. Find the previous working deployment
3. Click **⋯** → **Rollback to this deployment**

---

## Testing

After deploying v14:

1. **Test the main enquiry flow:**
   - Go to customshowers.uk/design-shower
   - Complete a design and submit
   - Check that emails arrive with all attachments

2. **Test Gemini endpoints (if GEMINI_API_KEY is set):**
   - POST to `https://customshowers-design.vcwvk4sm9m.workers.dev/analyse` with test images
   - POST to `https://customshowers-design.vcwvk4sm9m.workers.dev/suggest` with test images
   - Verify responses return `{ "available": true, ... }` with structured data

3. **Test graceful degradation (if GEMINI_API_KEY is not set):**
   - POST to the Gemini endpoints
   - Verify responses return `{ "available": false, "reason": "Feature not configured" }`
   - Confirm the main enquiry flow still works normally

---

## If something goes wrong

The Worker names its own faults rather than returning a generic error.

| What the browser shows | What it means |
| --- | --- |
| `Could not send the email. The RESEND_API_KEY on this worker is missing or wrong.` | Resend rejected the key. |
| `Resend refused the sender address...` | The domain in `FROM_EMAIL` is not verified in Resend. |
| `Security check failed. The TURNSTILE_SECRET_KEY on this worker does not match the site key...` | The secret and the site key are from different Turnstile widgets. |
| `Too many designs sent from here just now.` | Rate limit: 5 per IP per 10 minutes. Wait it out. |
| `{ "available": false, "reason": "Feature not configured" }` | GEMINI_API_KEY is not set (Gemini endpoints only). |
| `{ "available": false, "reason": "Request timed out" }` | Gemini API took longer than 20 seconds. |

Live logs: Worker → **Logs** → **Begin log stream**, then submit a request.
