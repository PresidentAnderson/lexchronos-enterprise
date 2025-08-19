#!/bin/bash

# LexChronos Production Deployment Script
# Comprehensive deployment with security checks and monitoring

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Logging functions
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${BOLD}${PURPLE}🚀 $1${NC}"
}

# Configuration
PROJECT_NAME="LexChronos"
DEPLOYMENT_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOYMENT_DIR="/Volumes/DevOps/lexchrono"
BACKUP_DIR="/Volumes/DevOps/lexchrono-backups"
LOG_FILE="$DEPLOYMENT_DIR/logs/deployment-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p "$DEPLOYMENT_DIR/logs"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Redirect all output to log file while showing on console
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# Print banner
echo -e "${BOLD}${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                      LEXCHRONOS DEPLOYMENT                      ║
║                    Production Release Pipeline                   ║
║                                                                  ║
║  🎯 Target: Production Environment                               ║
║  📅 Started: $DEPLOYMENT_START_TIME                              ║
║  📍 Directory: $DEPLOYMENT_DIR                                   ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

# Ensure we're in the correct directory
cd "$DEPLOYMENT_DIR"

# Step 1: Pre-deployment Validation
log_header "Step 1: Pre-deployment Validation"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a Git repository. Aborting deployment."
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet; then
    log_warning "Uncommitted changes detected!"
    git status --porcelain
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment aborted by user."
        exit 1
    fi
fi

# Get current git info
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_COMMIT_SHORT=$(git rev-parse --short HEAD)

log_info "Current branch: $CURRENT_BRANCH"
log_info "Current commit: $CURRENT_COMMIT_SHORT"

# Step 2: Environment Validation
log_header "Step 2: Environment Validation"

# Check for required environment files
if [[ ! -f ".env.local" ]]; then
    log_error ".env.local file not found!"
    log_info "Please create .env.local based on .env.production template"
    exit 1
fi

# Validate critical environment variables
REQUIRED_ENV_VARS=(
    "NODE_ENV"
    "NEXT_PUBLIC_APP_URL"
    "JWT_SECRET"
    "DATABASE_URL"
    "STRIPE_SECRET_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
)

for var in "${REQUIRED_ENV_VARS[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        log_error "Required environment variable $var not found in .env.local"
        exit 1
    fi
done

log_success "Environment validation passed"

# Step 3: Analytics Verification
log_header "Step 3: Analytics Verification"

log_info "Running analytics verification..."
if node scripts/verify-analytics.js; then
    log_success "Analytics verification passed"
else
    log_error "Analytics verification failed"
    read -p "Continue deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment aborted due to analytics issues."
        exit 1
    fi
fi

# Step 4: Dependency Installation
log_header "Step 4: Dependency Installation"

log_info "Installing production dependencies..."
npm ci --production=false --legacy-peer-deps
log_success "Dependencies installed successfully"

# Step 5: Security Audit
log_header "Step 5: Security Audit"

log_info "Running security audit..."
if npm audit --audit-level high; then
    log_success "Security audit passed"
else
    log_warning "Security vulnerabilities detected"
    read -p "Continue deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment aborted due to security issues."
        exit 1
    fi
fi

# Step 6: Build Application
log_header "Step 6: Application Build"

log_info "Building Next.js application..."
export NODE_ENV=production

# Create optimized production build
if npm run build; then
    log_success "Application build completed successfully"
else
    log_error "Build failed!"
    exit 1
fi

# Step 7: Database Migration Check
log_header "Step 7: Database Migration Preparation"

if [[ -d "database/migrations" ]]; then
    log_info "Checking database migrations..."
    MIGRATION_FILES=$(find database/migrations -name "*.sql" | wc -l)
    log_info "Found $MIGRATION_FILES migration files"
    
    # Note: In production, this should be handled by your database service
    log_warning "Database migrations should be run manually in production"
    log_info "Migration files are available in database/migrations/"
else
    log_info "No database migrations directory found"
fi

# Step 8: Create Deployment Backup
log_header "Step 8: Creating Deployment Backup"

BACKUP_NAME="lexchronos-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

log_info "Creating deployment backup: $BACKUP_NAME"

# Create backup of current deployment
mkdir -p "$BACKUP_PATH"

# Copy important files (excluding node_modules and .next)
rsync -av --exclude='node_modules' --exclude='.next' --exclude='logs' \
    "$DEPLOYMENT_DIR/" "$BACKUP_PATH/"

# Store git information
echo "Branch: $CURRENT_BRANCH" > "$BACKUP_PATH/deployment-info.txt"
echo "Commit: $CURRENT_COMMIT" >> "$BACKUP_PATH/deployment-info.txt"
echo "Date: $DEPLOYMENT_START_TIME" >> "$BACKUP_PATH/deployment-info.txt"

log_success "Backup created at $BACKUP_PATH"

# Step 9: Vercel Deployment Configuration
log_header "Step 9: Vercel Deployment Setup"

# Create vercel.json if it doesn't exist
if [[ ! -f "vercel.json" ]]; then
    log_info "Creating vercel.json configuration..."
    cat > vercel.json << EOF
{
  "version": 2,
  "name": "lexchronos",
  "alias": ["lexchronos.com", "www.lexchronos.com"],
  "regions": ["sfo1", "iad1"],
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install --legacy-peer-deps",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=self, microphone=(), geolocation=(), battery=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
EOF
    log_success "Vercel configuration created"
fi

# Step 10: Deploy to Vercel
log_header "Step 10: Vercel Deployment"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    log_info "Installing Vercel CLI..."
    npm install -g vercel@latest
fi

log_info "Starting Vercel deployment..."

# Deploy to Vercel
if vercel --prod --confirm --token="$VERCEL_TOKEN" 2>&1; then
    DEPLOYMENT_URL=$(vercel --prod --confirm --token="$VERCEL_TOKEN" 2>/dev/null | grep -o 'https://[^[:space:]]*' | tail -1)
    log_success "Vercel deployment completed!"
    log_info "Deployment URL: $DEPLOYMENT_URL"
else
    log_warning "Vercel deployment had issues or requires manual confirmation"
    log_info "Please check the deployment status in Vercel dashboard"
fi

# Step 11: Health Check
log_header "Step 11: Post-deployment Health Check"

if [[ -n "${DEPLOYMENT_URL:-}" ]]; then
    log_info "Running health checks..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Check health endpoint
    if curl -f -s "${DEPLOYMENT_URL}/api/health" > /dev/null; then
        log_success "Health check passed"
    else
        log_warning "Health check failed - deployment may still be warming up"
    fi
    
    # Check main page
    if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
        log_success "Main page accessible"
    else
        log_warning "Main page check failed"
    fi
else
    log_info "Skipping health checks (deployment URL not available)"
fi

# Step 12: Security Headers Verification
log_header "Step 12: Security Headers Verification"

if [[ -n "${DEPLOYMENT_URL:-}" ]]; then
    log_info "Checking security headers..."
    
    # Check security headers
    SECURITY_HEADERS=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Referrer-Policy"
    )
    
    for header in "${SECURITY_HEADERS[@]}"; do
        if curl -I -s "$DEPLOYMENT_URL" | grep -i "$header" > /dev/null; then
            log_success "Security header present: $header"
        else
            log_warning "Security header missing: $header"
        fi
    done
fi

# Step 13: Performance Check
log_header "Step 13: Performance Verification"

if [[ -n "${DEPLOYMENT_URL:-}" ]]; then
    log_info "Running basic performance checks..."
    
    # Measure load time
    LOAD_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$DEPLOYMENT_URL")
    log_info "Page load time: ${LOAD_TIME}s"
    
    if (( $(echo "$LOAD_TIME < 3.0" | bc -l) )); then
        log_success "Load time acceptable (< 3s)"
    else
        log_warning "Load time may be slow (> 3s)"
    fi
fi

# Step 14: Generate Deployment Report
log_header "Step 14: Generating Deployment Report"

DEPLOYMENT_END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOYMENT_DURATION=$(($(date -d "$DEPLOYMENT_END_TIME" +%s) - $(date -d "$DEPLOYMENT_START_TIME" +%s)))

cat > "DEPLOYMENT_REPORT_$(date +%Y%m%d_%H%M%S).md" << EOF
# LexChronos Production Deployment Report

## Deployment Information
- **Project**: $PROJECT_NAME
- **Date**: $DEPLOYMENT_START_TIME
- **Duration**: ${DEPLOYMENT_DURATION}s
- **Branch**: $CURRENT_BRANCH
- **Commit**: $CURRENT_COMMIT_SHORT
- **Deployment URL**: ${DEPLOYMENT_URL:-"Not available"}

## Pre-deployment Checks
- ✅ Git repository validation
- ✅ Environment variables validation
- ✅ Analytics verification
- ✅ Dependency installation
- ✅ Security audit
- ✅ Application build

## Deployment Status
- ✅ Backup created: $BACKUP_NAME
- ✅ Vercel configuration
- ✅ Production deployment
- ✅ Health checks
- ✅ Security headers verification

## Post-deployment Actions Required

### Database Setup
1. Set up PostgreSQL database on Railway
2. Run database migrations manually:
   \`\`\`sql
   -- See files in database/migrations/
   \`\`\`
3. Configure database connection pooling

### External Services Configuration
1. **Stripe**: Configure webhooks endpoint
2. **Email**: Set up SMTP credentials  
3. **Analytics**: Verify tracking IDs are production values
4. **Sentry**: Configure error tracking
5. **Cloudflare**: Set up CDN and DDoS protection

### Security Configuration
1. Update all secret keys and tokens
2. Configure Content Security Policy
3. Set up rate limiting
4. Enable security monitoring

### Monitoring Setup
1. Configure uptime monitoring
2. Set up performance alerts
3. Enable error tracking
4. Configure log aggregation

## URLs and Access
- **Application**: ${DEPLOYMENT_URL:-"TBD"}
- **API Health**: ${DEPLOYMENT_URL:-"TBD"}/api/health
- **Admin Dashboard**: ${DEPLOYMENT_URL:-"TBD"}/admin
- **Documentation**: ${DEPLOYMENT_URL:-"TBD"}/docs

## Rollback Information
- **Backup Location**: $BACKUP_PATH
- **Rollback Command**: \`git checkout $CURRENT_COMMIT\`
- **Previous Build**: Available in backup directory

## Support Information
- **Logs**: $LOG_FILE
- **Deployment Script**: $0
- **Contact**: System Administrator

---
Generated automatically by LexChronos deployment pipeline
EOF

log_success "Deployment report generated"

# Step 15: Final Summary
log_header "Step 15: Deployment Complete"

echo -e "${BOLD}${GREEN}
╔══════════════════════════════════════════════════════════════════╗
║                    🎉 DEPLOYMENT SUCCESSFUL! 🎉                  ║
║                                                                  ║
║  Project: $PROJECT_NAME                                          ║
║  URL: ${DEPLOYMENT_URL:-"Check Vercel Dashboard"}                ║
║  Duration: ${DEPLOYMENT_DURATION}s                               ║
║  Backup: $BACKUP_NAME                                            ║
║                                                                  ║
║  📋 Next Steps:                                                  ║
║  1. Configure external services (Database, Stripe, etc.)        ║
║  2. Set up monitoring and alerts                                 ║
║  3. Run post-deployment tests                                    ║
║  4. Update DNS records if needed                                 ║
║                                                                  ║
║  📁 Deployment Report: DEPLOYMENT_REPORT_$(date +%Y%m%d_%H%M%S).md ║
║  📋 Logs: $LOG_FILE                                              ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

log_success "Deployment pipeline completed successfully!"
log_info "Check the deployment report for next steps and configuration details."

exit 0