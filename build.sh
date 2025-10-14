#!/bin/bash

# LexChronos Build Script for Netlify Demo
echo "🚀 Starting LexChronos demo build process..."

# Step 1: Copy demo configuration files
echo "📁 Copying demo configuration..."
cp next.config.demo.mjs next.config.mjs
cp .env.demo .env.local

# Step 2: Temporarily remove postinstall script for demo build
echo "📝 Temporarily removing database dependencies for demo..."
# Create backup and remove postinstall line
cp package.json package.json.backup
sed -i 's/"postinstall": "prisma generate",//g' package.json

# Step 3: Install dependencies without postinstall
echo "📦 Installing dependencies..."
npm install

# Step 4: Generate minimal Prisma client (suppress warnings)
echo "🗄️ Generating minimal Prisma client..."
npx prisma generate >/dev/null 2>&1 || echo "⚠️ Prisma generation skipped"

# Step 5: Build static site with Next.js
echo "🏗️ Building static site..."
npx next build

# Step 6: Export static site to 'out' directory
echo "📤 Exporting to static files..."
npx next export

# Step 7: Verify out directory exists
echo "✅ Verifying export directory..."
if [ -d "out" ]; then
    echo "✅ Export directory 'out' created successfully"
    ls -la out/ | head -10
else
    echo "❌ Export directory 'out' not found"
    exit 1
fi

echo "✅ Demo build completed successfully!"