#!/bin/bash
set -euo pipefail

echo "🚀 Starting LexChronos build for Netlify..."

# Set up environment variables for demo mode
export DEMO_MODE=true
export DISABLE_DATABASE=true
export NEXT_PUBLIC_DEMO_MODE=true
export NEXT_PUBLIC_SUPABASE_URL=https://ouwobhnebqznsdtldozm.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_peJGFf8kaUw0HwPYxJ-uZA_gZLsUzAD

# Prevent Prisma from downloading engines in static builds
export PRISMA_SKIP_POSTINSTALL_GENERATE=true
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
export npm_config_ignore_scripts=true

# Ensure deterministic npm behavior in CI
export NPM_CONFIG_PROGRESS=false

# Skip expensive checks for demo builds
export NEXT_SKIP_TYPECHECK=1
export NEXT_DISABLE_ESLINT=1
export TSC_COMPILE_ON_ERROR=true
export OPENAI_API_KEY=demo-openai-key

echo "📦 Installing dependencies..."
npm install --include=dev --legacy-peer-deps --no-audit --no-fund --ignore-scripts

echo "🔧 Setting up demo configuration..."
cp next.config.demo.mjs next.config.mjs

TMP_API_DIR="$(mktemp -d)"
declare -a DISABLED_API_ROUTES=()

cleanup() {
  for entry in "${DISABLED_API_ROUTES[@]}"; do
    src="${entry%%:*}"
    dest="${entry#*:}"
    if [ -d "$src" ]; then
      rm -rf "$dest"
      mv "$src" "$dest"
    fi
  done
  rm -rf "$TMP_API_DIR"
}

trap cleanup EXIT

if [ -d "app/api" ]; then
  temp_path="$TMP_API_DIR/app_api"
  mv "app/api" "$temp_path"
  DISABLED_API_ROUTES+=("$temp_path:app/api")
fi

echo "🏗️ Building Next.js application..."
npm run build:static

if [ ! -d "out" ]; then
  echo "❌ Expected Next.js export directory 'out' was not generated."
  exit 1
fi

echo "✅ Build completed successfully!"
ls -la out
