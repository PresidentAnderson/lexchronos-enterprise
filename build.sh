#!/usr/bin/env bash
set -Eeuo pipefail
# If available, propagate ERR into subshells (best-effort)
shopt -s inherit_errexit || true
trap 'echo "::error:: failed on line $LINENO: $BASH_COMMAND" >&2' ERR

echo "Node: $(node -v)  npm: $(npm -v)"
echo "CI on Netlify? ${NETLIFY:-no}"

# Make Next builds deterministic in CI
export NEXT_TELEMETRY_DISABLED=1

# Default demo/static mode (overridable in Netlify env)
export DEMO_MODE="${DEMO_MODE:-true}"
export DISABLE_DATABASE="${DISABLE_DATABASE:-true}"
export NEXT_PUBLIC_DEMO_MODE="${NEXT_PUBLIC_DEMO_MODE:-true}"

# Ensure we use the static-export config
if [[ -f "next.config.demo.mjs" ]]; then
  echo "📁 Using next.config.demo.mjs → next.config.mjs"
  cp -f next.config.demo.mjs next.config.mjs
fi

echo "📦 Installing dependencies…"
npm ci --no-audit --no-fund

# Optional / non-fatal Prisma client generation (keeps builds green in demo)
if npx --yes prisma -v >/dev/null 2>&1; then
  echo "🗄️ Generating Prisma client (non-fatal)…"
  npx prisma generate || echo "⚠️ prisma generate failed; continuing (static demo mode)"
fi

echo "🏗️ next build…"
npm run build

# With output:'export' we expect an 'out/' directory; if missing, try export explicitly
if [[ ! -d "out" ]]; then
  echo "🔁 'out/' not found after build — running 'next export' as a fallback…"
  npx next export
fi

# Final verification
if [[ -d "out" ]]; then
  echo "✅ Build produced 'out/'. Listing top-level files:"
  ls -la out | head -50
else
  echo "❌ No 'out/' directory; cannot publish. Check the lines above for the exact failing step."
  exit 1
fi
