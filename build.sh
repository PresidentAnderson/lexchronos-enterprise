#!/bin/bash

# LexChronos Build Script for Netlify Demo
echo "🚀 Starting LexChronos demo build process..."

# Step 1: Copy demo configuration files
echo "📁 Copying demo configuration..."
cp next.config.demo.mjs next.config.mjs
cp .env.demo .env.local

# Step 2: Remove postinstall script for demo build (no database needed)
echo "📝 Removing database dependencies for demo..."
sed -i.bak 's/"postinstall": "prisma generate",//g' package.json

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 4: Build static site
echo "🏗️ Building static site..."
npm run build:static

echo "✅ Demo build completed successfully!"