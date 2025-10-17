#!/usr/bin/env bash
set -Eeuo pipefail
shopt -s inherit_errexit || true

trap 'echo "::error:: failed on line $LINENO: $BASH_COMMAND" >&2' ERR

echo "🚀 Starting LexChronos build for Netlify..."
echo "Node: $(node -v)  npm: $(npm -v)"
echo "On Netlify? ${NETLIFY:-no}"

# Set up environment variables for demo mode
export DEMO_MODE=true
export DISABLE_DATABASE=true
export NEXT_PUBLIC_DEMO_MODE=true
export NEXT_PUBLIC_SUPABASE_URL=https://ouwobhnebqznsdtldozm.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_peJGFf8kaUw0HwPYxJ-uZA_gZLsUzAD
export NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED:-1}

echo "📦 Installing dependencies..."
npm ci --no-audit --no-fund --include=dev

echo "🔧 Setting up demo configuration..."
cp next.config.demo.mjs next.config.mjs

echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"

if [[ -d .next ]]; then
  echo "Contents of .next directory:"
  ls -la .next
else
  echo "Warning: .next directory not found after build." >&2
fi
