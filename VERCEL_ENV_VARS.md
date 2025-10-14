# Vercel Environment Variables for LexChronos

## Required Environment Variables

Copy and paste these into your Vercel project settings:

### 1. Database Configuration
```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```
Example for Supabase:
```
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 2. Authentication & Security
```
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-use-random-generator
JWT_EXPIRES_IN=7d
NEXTAUTH_SECRET=your-nextauth-secret-minimum-32-characters-long-use-random-generator
NEXTAUTH_URL=https://lexchronos-55rmzo4y7-axaiinovation.vercel.app
```

### 3. Stripe Payment Processing
```
STRIPE_SECRET_KEY=sk_live_[YOUR_STRIPE_SECRET_KEY]
STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_STRIPE_PUBLISHABLE_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_STRIPE_WEBHOOK_SECRET]
```

For testing (use these first):
```
STRIPE_SECRET_KEY=sk_test_[YOUR_TEST_SECRET_KEY]
STRIPE_PUBLISHABLE_KEY=pk_test_[YOUR_TEST_PUBLISHABLE_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_TEST_WEBHOOK_SECRET]
```

### 4. Email Configuration (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_NAME=LexChronos Legal
FROM_EMAIL=noreply@lexchronos.com
SUPPORT_EMAIL=support@lexchronos.com
```

### 5. Public App URLs
```
NEXT_PUBLIC_APP_URL=https://lexchronos-55rmzo4y7-axaiinovation.vercel.app
NEXT_PUBLIC_API_URL=https://lexchronos-55rmzo4y7-axaiinovation.vercel.app/api
```

### 6. Socket.io Configuration
```
NEXT_PUBLIC_SOCKET_URL=wss://lexchronos-55rmzo4y7-axaiinovation.vercel.app
```

### 7. Analytics (Optional but Recommended)
```
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=XXXXXXXXXXXXXXX
NEXT_PUBLIC_CLARITY_ID=XXXXXXXXXXX
```

### 8. Sentry Error Tracking (Optional)
```
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o4507000000000000.ingest.sentry.io/4507000000000000
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 9. File Storage (Optional - for document management)
```
AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
S3_BUCKET_NAME=lexchronos-documents
```

### 10. Redis Cache (Optional - for performance)
```
REDIS_URL=redis://default:password@redis-host.com:6379
```

## How to Add to Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on your "lexchronos" project
3. Navigate to "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. Add each variable one by one:
   - Enter the Key (e.g., `DATABASE_URL`)
   - Enter the Value
   - Select environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

## Priority Order for Setup

### Phase 1 - Minimum Required (App will run):
1. `DATABASE_URL` - Set up a free PostgreSQL database on Supabase or Railway
2. `JWT_SECRET` - Generate using: `openssl rand -base64 32`
3. `NEXTAUTH_SECRET` - Generate using: `openssl rand -base64 32`
4. `NEXTAUTH_URL` - Use your Vercel URL

### Phase 2 - Core Features:
5. Stripe keys (for billing features)
6. SMTP settings (for email notifications)

### Phase 3 - Enhanced Features:
7. Analytics IDs
8. Sentry DSN
9. AWS S3 (for document storage)
10. Redis (for caching)

## Generate Secure Secrets

Run these commands to generate secure secrets:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate a strong password
openssl rand -base64 24
```

## Database Setup

### Option 1: Supabase (Recommended - Free Tier)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the "Connection string" (URI)
5. Use this as your `DATABASE_URL`

### Option 2: Railway (Alternative - Free Tier)
1. Go to https://railway.app
2. Create a new project
3. Add PostgreSQL plugin
4. Copy the DATABASE_URL from the plugin settings

### Option 3: Neon (Alternative - Free Tier)
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Use this as your `DATABASE_URL`

## After Adding Environment Variables

1. Redeploy your application (it will automatically redeploy when you add env vars)
2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Test the application at your Vercel URL

## Testing Your Configuration

Visit these URLs to verify setup:
- Homepage: https://lexchronos-55rmzo4y7-axaiinovation.vercel.app
- API Health: https://lexchronos-55rmzo4y7-axaiinovation.vercel.app/api/health
- Auth Test: https://lexchronos-55rmzo4y7-axaiinovation.vercel.app/login

## Support

If you encounter any issues:
1. Check Vercel logs: Project > Functions tab > View logs
2. Ensure all required environment variables are set
3. Verify database connection is working
4. Check that JWT_SECRET and NEXTAUTH_SECRET are different values