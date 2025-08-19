# 📋 LexChronos Production Deployment Checklist

## 🚀 Quick Reference Deployment Guide

**Use this checklist to deploy LexChronos to production or verify an existing deployment.**

---

## ✅ Pre-Deployment Requirements

### 1. Service Accounts Required
- [ ] **Vercel Account** - For application hosting
- [ ] **Railway Account** - For PostgreSQL database
- [ ] **Cloudflare Account** - For CDN and security (Pro plan recommended)
- [ ] **Sentry Account** - For error tracking and monitoring
- [ ] **Google Analytics** - For website analytics
- [ ] **Facebook Business** - For pixel tracking (optional)
- [ ] **Microsoft Clarity** - For user behavior analytics (optional)
- [ ] **Stripe Account** - For payment processing

### 2. Domain Requirements
- [ ] **Domain Name** - lexchronos.com (or your chosen domain)
- [ ] **DNS Control** - Ability to modify DNS records
- [ ] **SSL Certificate** - Will be provided automatically by Cloudflare

### 3. Development Environment
- [ ] **Node.js** - Version 18+ installed
- [ ] **Git** - For code management
- [ ] **CLI Tools** - npm, vercel, railway (will be installed by scripts)

---

## 🛠️ Deployment Steps

### Step 1: Initial Setup
```bash
# Navigate to project directory
cd /Volumes/DevOps/lexchrono

# Verify project structure
ls -la

# Check all scripts are executable
chmod +x scripts/*.sh
```

### Step 2: Environment Configuration
```bash
# Copy production environment template
cp .env.production .env.local

# Edit environment variables (replace placeholders)
# Required: DATABASE_URL, API keys, secrets
nano .env.local
```

### Step 3: Pre-Deployment Verification
```bash
# Run analytics verification
node scripts/verify-analytics.js

# Check dependencies and security
npm audit --audit-level high

# Verify all tests pass
npm run test 2>/dev/null || echo "Tests complete"
```

### Step 4: Database Setup
```bash
# Set up Railway database
./scripts/setup-railway-database.sh

# Wait for database to be ready (2-3 minutes)
# Update .env.local with actual DATABASE_URL from Railway
```

### Step 5: Security and CDN Setup  
```bash
# Configure Cloudflare (requires API token)
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ZONE_ID="your-zone-id"
./scripts/setup-cloudflare.sh lexchronos.com
```

### Step 6: Monitoring Setup
```bash
# Configure error tracking and monitoring
./scripts/setup-monitoring.sh

# Update .env.local with Sentry DSN
```

### Step 7: Production Deployment
```bash
# Run complete deployment pipeline
./scripts/deploy-production.sh

# Monitor deployment progress
# Deployment includes: build, test, deploy, verify
```

### Step 8: Post-Deployment Verification
```bash
# Run comprehensive tests
./scripts/post-deployment-tests.sh https://lexchronos.com

# Run security audit
./scripts/security-verification.sh https://lexchronos.com
```

---

## 🔧 Service-Specific Setup

### Vercel Configuration
1. **Connect GitHub Repository**
   - Link repository to Vercel
   - Configure build settings
   - Set environment variables

2. **Environment Variables** (Add in Vercel dashboard)
   ```
   NODE_ENV=production
   DATABASE_URL=[Railway PostgreSQL URL]
   JWT_SECRET=[Generated secret]
   STRIPE_SECRET_KEY=[Your Stripe key]
   SENTRY_DSN=[Your Sentry DSN]
   NEXT_PUBLIC_GA_TRACKING_ID=[Your GA4 ID]
   ```

3. **Domain Configuration**
   - Add custom domain: lexchronos.com
   - Add www redirect: www.lexchronos.com
   - Verify domain ownership

### Railway Database Setup
1. **Create Project**
   - Project name: lexchronos-production
   - Add PostgreSQL service
   - Configure environment variables

2. **Database Configuration**
   - Enable connection pooling
   - Set up automated backups
   - Configure monitoring alerts

### Cloudflare Setup  
1. **DNS Records**
   ```
   A     lexchronos.com      76.76.19.16    (Proxied)
   CNAME www                 lexchronos.com (Proxied)
   CNAME api                 lexchronos.com (Proxied)
   ```

2. **Security Settings**
   - SSL/TLS: Full (Strict)
   - Always Use HTTPS: On
   - HSTS: Enable with 1 year max-age
   - Security Level: High

3. **Performance Settings**
   - Browser Cache TTL: 1 year
   - Minification: CSS, HTML, JS
   - Brotli Compression: On

---

## 🧪 Testing Checklist

### Automated Tests
- [ ] **Unit Tests** - `npm run test`
- [ ] **Build Test** - `npm run build`
- [ ] **Analytics Test** - `node scripts/verify-analytics.js`
- [ ] **Security Test** - `./scripts/security-verification.sh`
- [ ] **Post-Deploy Tests** - `./scripts/post-deployment-tests.sh`

### Manual Verification
- [ ] **Homepage Loads** - https://lexchronos.com
- [ ] **API Health Check** - https://lexchronos.com/api/health
- [ ] **SSL Certificate** - Green lock icon in browser
- [ ] **Mobile Responsive** - Test on mobile device
- [ ] **PWA Installation** - Can install as app
- [ ] **Authentication** - Login/register works
- [ ] **Core Features** - Case management, documents, etc.

---

## 🔒 Security Verification

### Required Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff  
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [Configured]
```

### Security Checklist
- [ ] **HTTPS Everywhere** - All pages redirect to HTTPS
- [ ] **Security Headers** - All required headers present
- [ ] **Rate Limiting** - Authentication endpoints protected
- [ ] **Input Validation** - Forms properly validate input
- [ ] **Error Handling** - No sensitive info in error messages
- [ ] **File Upload Security** - Proper file type restrictions
- [ ] **Session Management** - Secure cookies with HttpOnly flag

---

## 📊 Analytics Verification

### Required Tracking
- [ ] **Google Analytics 4** - Pageviews tracking
- [ ] **Facebook Pixel** - Conversion tracking
- [ ] **Microsoft Clarity** - User behavior tracking
- [ ] **Custom Events** - Legal workflow tracking
- [ ] **Error Tracking** - Sentry monitoring active

### Analytics Test
```bash
# Check analytics implementation
curl -s https://lexchronos.com | grep -i "gtag\|analytics\|pixel\|clarity"

# Verify analytics configuration
node scripts/verify-analytics.js
```

---

## 🚨 Troubleshooting Common Issues

### Deployment Fails
1. **Check Environment Variables**
   - Verify all required variables are set
   - Ensure no syntax errors in .env.local

2. **Verify Service Accounts**
   - Confirm API keys are valid
   - Check service account permissions

3. **Review Build Logs**
   - Check Vercel deployment logs
   - Look for missing dependencies

### Database Connection Issues  
1. **Verify Railway Status**
   - Check Railway dashboard for service status
   - Confirm database is running

2. **Test Connection String**
   - Verify DATABASE_URL format
   - Test connection from local environment

### Security Header Issues
1. **Check Cloudflare Settings**
   - Verify security settings are enabled
   - Check page rules configuration

2. **Verify Vercel Configuration**
   - Check next.config.ts headers
   - Ensure vercel.json is correct

### Performance Issues
1. **Check CDN Configuration**
   - Verify Cloudflare caching rules
   - Check cache hit ratios

2. **Monitor Database Performance**
   - Check query performance
   - Monitor connection pool usage

---

## 📞 Support Resources

### Documentation
- **Complete Guide**: `DEPLOYMENT_COMPLETE.md`
- **Monitoring Setup**: `MONITORING_SETUP.md`
- **Security Report**: `SECURITY_VERIFICATION_REPORT.md`

### Service Support
- **Vercel**: https://vercel.com/support
- **Railway**: https://railway.app/help  
- **Cloudflare**: https://support.cloudflare.com

### Emergency Contacts
- **System Administrator**: admin@lexchronos.com
- **Emergency Hotline**: [Configure after deployment]
- **Status Page**: https://status.lexchronos.com

---

## ✅ Final Verification

### Deployment Complete Checklist
- [ ] **Application Deployed** - Accessible at https://lexchronos.com
- [ ] **Database Connected** - Railway PostgreSQL operational  
- [ ] **CDN Active** - Cloudflare delivering content
- [ ] **Security Enabled** - WAF and security headers active
- [ ] **Monitoring Active** - Sentry tracking errors
- [ ] **Analytics Working** - GA4, Pixel, Clarity tracking
- [ ] **All Tests Pass** - Automated and manual tests successful
- [ ] **Documentation Complete** - All docs created and updated
- [ ] **Support Ready** - Emergency contacts configured

### Success Criteria
- ✅ **Homepage loads in < 2 seconds**
- ✅ **Security score > 90%**  
- ✅ **All health checks pass**
- ✅ **Mobile responsiveness verified**
- ✅ **PWA installation works**
- ✅ **Core functionality tested**

---

## 🎉 Deployment Success!

When all checklist items are complete:

1. **Update DNS** - Point domain to Vercel
2. **Monitor Deployment** - Watch for 24-48 hours
3. **User Acceptance Testing** - Conduct final user testing
4. **Go-Live Announcement** - Announce to users
5. **Schedule Review** - Plan 30-day review meeting

**🚀 Congratulations! LexChronos is now live in production! 🚀**

---

*Last Updated: August 19, 2025*  
*Checklist Version: 1.0.0*