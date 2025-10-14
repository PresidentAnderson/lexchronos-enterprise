#!/bin/bash
set -e

echo "🚀 Starting LexChronos build for Netlify..."

# Set up environment variables for demo mode
export DEMO_MODE=true
export DISABLE_DATABASE=true
export NEXT_PUBLIC_DEMO_MODE=true
export NEXT_PUBLIC_SUPABASE_URL=https://ouwobhnebqznsdtldozm.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_peJGFf8kaUw0HwPYxJ-uZA_gZLsUzAD

echo "📦 Installing dependencies..."
npm ci --production=false

echo "🔧 Setting up demo configuration..."
cp next.config.demo.mjs next.config.mjs

echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
ls -la out/