#!/bin/bash

# LexChronos Build Script for Netlify
echo "🚀 Starting LexChronos build process..."

# Step 1: Copy demo configuration files
echo "📁 Copying demo configuration..."
cp next.config.demo.mjs next.config.mjs
cp .env.demo .env.local

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Build static site
echo "🏗️ Building static site..."
npm run build:static

echo "✅ Build completed successfully!"