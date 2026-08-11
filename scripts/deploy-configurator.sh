#!/usr/bin/env bash
#
# Deploys the shower configurator's enquiry function.
#
# Run this BEFORE shipping the front end. The configurator's "Send my design"
# button posts to this function; if the site goes live without it, every
# customer who finishes a design hits a failure.
#
#   ./scripts/deploy-configurator.sh
#
# Secrets are read from your environment, never stored in this file. Export
# them for the session, or the script will prompt:
#
#   export RESEND_API_KEY=...
#   export TURNSTILE_SECRET_KEY=...
#   export BUSINESS_EMAIL=enquiries@customshowers.uk
#
set -euo pipefail

cd "$(dirname "$0")/.."

FUNCTION_NAME="send-design-enquiry"

info()  { printf '\033[0;36m%s\033[0m\n' "$*"; }
ok()    { printf '\033[0;32m✓ %s\033[0m\n' "$*"; }
warn()  { printf '\033[0;33m! %s\033[0m\n' "$*"; }
fail()  { printf '\033[0;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Project ref
#
# Taken from .env rather than hardcoded. .env is what the built front end
# actually connects to, so the function has to land in that same project —
# the older deployment guides in this repo name a different one.
# ---------------------------------------------------------------------------
[ -f .env ] || fail ".env not found. It holds the project ref this site connects to."

PROJECT_REF="$(grep -E '^VITE_SUPABASE_PROJECT_ID=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')"
[ -n "$PROJECT_REF" ] || fail "VITE_SUPABASE_PROJECT_ID missing from .env"

info "Project ref from .env: $PROJECT_REF"

command -v supabase >/dev/null 2>&1 || fail "Supabase CLI not found. Install it: npm install -g supabase"

# ---------------------------------------------------------------------------
# Auth and link
# ---------------------------------------------------------------------------
if ! supabase projects list >/dev/null 2>&1; then
  warn "Not logged in. Opening the Supabase login flow."
  supabase login
fi

info "Linking to $PROJECT_REF ..."
supabase link --project-ref "$PROJECT_REF"
ok "Linked"

# ---------------------------------------------------------------------------
# Secrets
#
# Only set what is missing, so re-running this never clobbers a value that is
# already correct in the dashboard.
# ---------------------------------------------------------------------------
EXISTING="$(supabase secrets list 2>/dev/null || true)"

ensure_secret() {
  local name="$1" prompt="$2" value="${!1:-}"

  if grep -q "^ *$name " <<<"$EXISTING"; then
    ok "$name already set"
    return
  fi

  if [ -z "$value" ]; then
    warn "$name is not set on the project and not in your environment."
    read -r -p "  $prompt: " value
  fi

  [ -n "$value" ] || fail "$name is required."
  supabase secrets set "$name=$value" >/dev/null
  ok "$name set"
}

info ""
info "Checking secrets ..."
ensure_secret RESEND_API_KEY      "Resend API key"
ensure_secret TURNSTILE_SECRET_KEY "Cloudflare Turnstile secret key"
ensure_secret BUSINESS_EMAIL       "Where enquiries should land (email address)"

# FROM_EMAIL is optional — the function falls back to a sensible default.
if [ -n "${FROM_EMAIL:-}" ] && ! grep -q '^ *FROM_EMAIL ' <<<"$EXISTING"; then
  supabase secrets set "FROM_EMAIL=$FROM_EMAIL" >/dev/null
  ok "FROM_EMAIL set"
fi

# ---------------------------------------------------------------------------
# Deploy
#
# JWT verification stays on: the configurator calls this through supabase-js,
# which sends the publishable key automatically.
# ---------------------------------------------------------------------------
info ""
info "Deploying $FUNCTION_NAME ..."
supabase functions deploy "$FUNCTION_NAME"
ok "Deployed"

cat <<EOF

$(info "Next: send one real test enquiry before shipping the front end.")

  1. npm run dev
  2. Open http://localhost:8080/design-shower
  3. Design anything, fill in your own email, send it.
  4. Check that BOTH arrive:
       - the spec email, with plan-view.png and elevation-view.png attached
       - the customer copy, to the address you entered

  Function logs if anything fails:
    supabase functions logs $FUNCTION_NAME

Once that works, merge the branch to main and Cloudflare Pages will build
and ship the site.
EOF
