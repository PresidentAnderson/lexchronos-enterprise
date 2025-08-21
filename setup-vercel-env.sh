#!/bin/bash

# Essential environment variables for LexChronos on Vercel
# This script adds the minimum required environment variables to get the app running

echo "Setting up Vercel environment variables for LexChronos..."

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set the Vercel URL (update this after deployment)
VERCEL_URL="https://lexchronos-55rmzo4y7-axaiinovation.vercel.app"

# Add environment variables
echo "Adding JWT_SECRET..."
echo "$JWT_SECRET" | vercel env add JWT_SECRET production --force

echo "Adding NEXTAUTH_SECRET..."
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production --force

echo "Adding NEXTAUTH_URL..."
echo "$VERCEL_URL" | vercel env add NEXTAUTH_URL production --force

echo "Adding JWT_EXPIRES_IN..."
echo "7d" | vercel env add JWT_EXPIRES_IN production --force

echo "Adding NEXT_PUBLIC_APP_URL..."
echo "$VERCEL_URL" | vercel env add NEXT_PUBLIC_APP_URL production --force

echo "Adding NEXT_PUBLIC_API_URL..."
echo "$VERCEL_URL/api" | vercel env add NEXT_PUBLIC_API_URL production --force

echo "Adding NEXT_PUBLIC_SOCKET_URL..."
echo "wss://${VERCEL_URL#https://}" | vercel env add NEXT_PUBLIC_SOCKET_URL production --force

# Placeholder database URL (needs to be updated with actual database)
echo "Adding placeholder DATABASE_URL (UPDATE THIS!)..."
echo "postgresql://user:password@host:5432/database?sslmode=require" | vercel env add DATABASE_URL production --force

# Email placeholders
echo "Adding email placeholders..."
echo "smtp.gmail.com" | vercel env add SMTP_HOST production --force
echo "587" | vercel env add SMTP_PORT production --force
echo "false" | vercel env add SMTP_SECURE production --force
echo "your-email@gmail.com" | vercel env add SMTP_USER production --force
echo "your-app-password" | vercel env add SMTP_PASS production --force
echo "LexChronos Legal" | vercel env add FROM_NAME production --force
echo "noreply@lexchronos.com" | vercel env add FROM_EMAIL production --force
echo "support@lexchronos.com" | vercel env add SUPPORT_EMAIL production --force

echo ""
echo "✅ Basic environment variables added!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Set up a PostgreSQL database (Supabase, Railway, or Neon)"
echo "2. Update DATABASE_URL with your actual database connection string"
echo "3. Update email settings with your SMTP credentials"
echo "4. Add Stripe keys when ready for payments"
echo ""
echo "To update DATABASE_URL:"
echo "vercel env rm DATABASE_URL production"
echo "echo 'your-actual-database-url' | vercel env add DATABASE_URL production"
echo ""
echo "Your app will redeploy automatically after adding environment variables."