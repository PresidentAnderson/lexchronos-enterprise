# LexChronos Quick Start Guide
**Get Your Legal Case Management Platform Running in 30 Minutes**

---

## 🚀 Prerequisites

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database access (or free Supabase account)
- [ ] Stripe account (free test mode)
- [ ] Vercel account (free tier)
- [ ] GitHub account

---

## 📦 Step 1: Clone and Install (5 minutes)

```bash
# Clone the repository
git clone https://github.com/PresidentAnderson/lexchronos-enterprise.git
cd lexchronos-enterprise

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

---

## 🗄️ Step 2: Database Setup (10 minutes)

### Option A: Supabase (Recommended - Free)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign in with GitHub
   - Click "New project"
   - Name: `lexchronos-db`
   - Password: Generate strong password
   - Region: Choose closest to you
   - Click "Create new project"

2. **Get Database URL**
   - Go to Settings → Database
   - Copy "Connection string" (URI)
   - It looks like: `postgresql://postgres:[password]@[host].supabase.co:5432/postgres`

### Option B: Railway (Alternative - Free)

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Choose "Provision PostgreSQL"
   - Click "Deploy"

2. **Get Database URL**
   - Click on PostgreSQL service
   - Go to "Connect" tab
   - Copy DATABASE_URL

### Option C: Local PostgreSQL

```bash
# If you have PostgreSQL installed locally
createdb lexchronos
# Your URL: postgresql://username:password@localhost:5432/lexchronos
```

---

## 🔐 Step 3: Environment Configuration (5 minutes)

1. **Create Environment File**
```bash
# Copy the example file
cp .env.example .env.local
```

2. **Edit `.env.local`** with your values:

```env
# Database (from Step 2)
DATABASE_URL="postgresql://postgres:[password]@[host].supabase.co:5432/postgres"

# Authentication (generate secrets)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-32-chars-minimum"
JWT_SECRET="same-as-nextauth-secret"

# For production deployment, change NEXTAUTH_URL to your domain:
# NEXTAUTH_URL="https://your-app.vercel.app"

# Generate secrets with this command:
# openssl rand -base64 32
```

3. **Generate Secure Secrets**
```bash
# Generate NEXTAUTH_SECRET and JWT_SECRET
openssl rand -base64 32
# Copy the output and use it for both NEXTAUTH_SECRET and JWT_SECRET
```

---

## 🏗️ Step 4: Database Migration (3 minutes)

```bash
# Push schema to database
npx prisma db push

# Verify the connection
npx prisma studio
# This opens a browser to view your database
```

---

## 💳 Step 5: Stripe Setup (5 minutes)

1. **Get Stripe Keys**
   - Go to [dashboard.stripe.com](https://dashboard.stripe.com)
   - Sign in or create account
   - Toggle "Test mode" ON (top right)
   - Go to Developers → API Keys
   - Copy keys

2. **Add to `.env.local`**
```env
# Stripe (test mode keys)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Webhook secret (create later if needed)
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 🖥️ Step 6: Run Development Server (2 minutes)

```bash
# Start the development server
npm run dev

# Open in browser
open http://localhost:3000
```

### First Run Checklist:
- [ ] Homepage loads without errors
- [ ] Can navigate to /login
- [ ] Can navigate to /register
- [ ] Database connection works (check terminal for errors)

---

## 🌐 Step 7: Deploy to Vercel (5 minutes)

### Option A: Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - What's your project name? lexchronos
# - In which directory? ./
# - Override settings? No
```

### Option B: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Import Git Repository
4. Select `lexchronos-enterprise`
5. Configure environment variables (see below)
6. Click "Deploy"

### Configure Environment Variables in Vercel:

1. Go to Project Settings → Environment Variables
2. Add these variables:

```env
DATABASE_URL=[your-database-url]
NEXTAUTH_URL=https://[your-project].vercel.app
NEXTAUTH_SECRET=[your-secret]
JWT_SECRET=[same-as-nextauth]
STRIPE_SECRET_KEY=[your-stripe-secret]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your-stripe-public]
```

3. Redeploy after adding variables:
```bash
vercel --prod
```

---

## ✅ Step 8: Verify Installation

### Test Basic Functionality:

1. **Create First User**
   - Go to `/register`
   - Create account
   - Login at `/login`

2. **Create Test Case**
   - Go to `/cases/new`
   - Fill in details
   - Save case

3. **Upload Document**
   - Go to case details
   - Click "Documents"
   - Upload test file

4. **Check Billing**
   - Go to `/billing`
   - Add time entry
   - Verify it saves

---

## 🔧 Troubleshooting

### Common Issues and Solutions:

#### Database Connection Error
```
Error: P1001: Can't reach database server
```
**Solution:** Check DATABASE_URL is correct and database is running

#### Prisma Client Error
```
Error: @prisma/client did not initialize yet
```
**Solution:** Run `npx prisma generate`

#### Build Errors on Vercel
```
Error: Module not found
```
**Solution:** Ensure all environment variables are set in Vercel

#### Authentication Not Working
```
Error: NEXTAUTH_URL mismatch
```
**Solution:** Update NEXTAUTH_URL to match your domain

---

## 📱 Mobile Testing

Test responsive design:
```bash
# Open Chrome DevTools
# Toggle device toolbar (Cmd+Shift+M)
# Select iPhone or Android device
# Test all major pages
```

---

## 🎯 Next Steps

### Essential Configuration:
1. **Email Service** (SendGrid/Mailgun)
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-api-key
   ```

2. **File Storage** (Cloudinary/S3)
   ```env
   CLOUDINARY_URL=cloudinary://...
   # or
   AWS_S3_BUCKET=lexchronos-files
   ```

3. **Error Tracking** (Sentry)
   ```env
   SENTRY_DSN=https://...@sentry.io/...
   ```

### Customization:
1. **Update Branding**
   - Edit `/app/layout.tsx` for site title
   - Replace `/public/logo.png`
   - Update colors in `/tailwind.config.js`

2. **Configure Features**
   - Edit `/config/features.ts`
   - Enable/disable modules
   - Set pricing tiers

3. **Add Custom Fields**
   - Edit `/prisma/schema.prisma`
   - Run `npx prisma migrate dev`
   - Update forms and APIs

---

## 🆘 Getting Help

### Resources:
- **Documentation:** `/documentation/`
- **API Reference:** `/documentation/api/`
- **GitHub Issues:** [Report bugs](https://github.com/PresidentAnderson/lexchronos-enterprise/issues)

### Quick Commands:
```bash
# View all available commands
npm run

# Check for issues
npm run lint

# Format code
npm run format

# View database
npx prisma studio

# Check deployment
vercel logs
```

### Debug Mode:
Add to `.env.local`:
```env
DEBUG=true
LOG_LEVEL=verbose
```

---

## 🎉 Success Checklist

Your LexChronos installation is complete when:

- [ ] Application runs locally without errors
- [ ] Can create and login as user
- [ ] Can create and manage cases
- [ ] Can upload documents
- [ ] Can track time/billing
- [ ] Deployed successfully to Vercel
- [ ] Production URL is accessible
- [ ] Database migrations complete
- [ ] Environment variables configured
- [ ] Test payment works (Stripe test mode)

---

## 🚀 Ready for Production?

Before going live:

1. **Security Audit**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Update Dependencies**
   ```bash
   npm update
   ```

3. **Set Production Variables**
   - Use production database
   - Use live Stripe keys
   - Configure custom domain
   - Set up SSL certificate

4. **Enable Monitoring**
   - Set up Sentry
   - Configure analytics
   - Enable performance monitoring

5. **Legal Compliance**
   - Add privacy policy
   - Add terms of service
   - Configure GDPR compliance
   - Set up cookie consent

---

**Congratulations! 🎊 Your LexChronos platform is ready!**

*Need help? Check the [full documentation](./LEXCHRONOS_IMPLEMENTATION_STATUS.md) or [open an issue](https://github.com/PresidentAnderson/lexchronos-enterprise/issues).*

---

*Last Updated: January 20, 2025*  
*Version: 1.0.0*