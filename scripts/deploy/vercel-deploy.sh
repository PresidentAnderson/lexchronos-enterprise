#!/bin/bash

# Vercel Deployment Script for LexChronos
# Description: Complete deployment automation for Vercel with pre/post deployment checks

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lexchronos"
REQUIRED_NODE_VERSION="20"
DEPLOYMENT_TIMEOUT=600 # 10 minutes

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
ENVIRONMENT="production"
FORCE_DEPLOY=false
SKIP_TESTS=false
SKIP_BUILD_VERIFICATION=false
ANALYTICS_CHECK=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --env|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build-verification)
            SKIP_BUILD_VERIFICATION=true
            shift
            ;;
        --no-analytics-check)
            ANALYTICS_CHECK=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env, --environment ENV    Deployment environment (production|staging|development)"
            echo "  --force                     Force deployment even if checks fail"
            echo "  --skip-tests               Skip running tests"
            echo "  --skip-build-verification  Skip build verification"
            echo "  --no-analytics-check       Skip analytics verification"
            echo "  --help, -h                 Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

log_info "Starting Vercel deployment for LexChronos"
log_info "Environment: $ENVIRONMENT"

# Pre-deployment checks
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || ! grep -q "lexchrono" package.json; then
        log_error "Not in LexChronos project directory"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        log_error "Node.js version $REQUIRED_NODE_VERSION or higher required (current: v$NODE_VERSION)"
        exit 1
    fi
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not found. Install with: npm install -g vercel"
        exit 1
    fi
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        log_error "Not logged in to Vercel. Run: vercel login"
        exit 1
    fi
    
    # Check if git is clean (unless forced)
    if [ "$FORCE_DEPLOY" = false ]; then
        if ! git diff-index --quiet HEAD --; then
            log_error "Working directory not clean. Commit changes or use --force"
            exit 1
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Verify analytics implementation (CRITICAL REQUIREMENT)
verify_analytics() {
    if [ "$ANALYTICS_CHECK" = false ]; then
        log_warning "Analytics verification skipped (--no-analytics-check used)"
        return 0
    fi
    
    log_info "Verifying analytics implementation..."
    
    # Check for required analytics environment variables
    local missing_analytics=()
    
    # Check for GA4
    if [ -z "$NEXT_PUBLIC_GA4_ID" ] && [ -z "$GA4_ID" ]; then
        missing_analytics+=("GA4_ID or NEXT_PUBLIC_GA4_ID")
    fi
    
    # Check for at least one analytics provider
    if [ ${#missing_analytics[@]} -gt 0 ] && [ -z "$NEXT_PUBLIC_GTM_ID" ] && [ -z "$NEXT_PUBLIC_FB_PIXEL_ID" ] && [ -z "$NEXT_PUBLIC_CLARITY_PROJECT_ID" ]; then
        log_error "No analytics providers configured!"
        log_error "At least one of the following must be set:"
        log_error "  - GA4_ID / NEXT_PUBLIC_GA4_ID"
        log_error "  - NEXT_PUBLIC_GTM_ID"
        log_error "  - NEXT_PUBLIC_FB_PIXEL_ID"
        log_error "  - NEXT_PUBLIC_CLARITY_PROJECT_ID"
        
        if [ "$FORCE_DEPLOY" = false ]; then
            log_error "Deployment blocked. Use --force to override or configure analytics."
            exit 1
        else
            log_warning "Force deploy enabled - deploying without analytics"
        fi
    fi
    
    # Check for analytics files in the codebase
    local analytics_files=(
        "lib/analytics/index.ts"
        "app/layout.tsx"
    )
    
    for file in "${analytics_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_warning "Analytics file not found: $file"
        fi
    done
    
    # Check if analytics is imported in layout
    if [ -f "app/layout.tsx" ]; then
        if ! grep -q "analytics" app/layout.tsx; then
            log_warning "Analytics may not be properly integrated in app/layout.tsx"
        fi
    fi
    
    log_success "Analytics verification completed"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Tests skipped (--skip-tests used)"
        return 0
    fi
    
    log_info "Running tests..."
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    # Run linting
    if npm run lint --silent > /dev/null 2>&1; then
        log_success "Linting passed"
    else
        log_error "Linting failed"
        if [ "$FORCE_DEPLOY" = false ]; then
            exit 1
        fi
    fi
    
    # Run type checking
    if npx tsc --noEmit > /dev/null 2>&1; then
        log_success "Type checking passed"
    else
        log_error "Type checking failed"
        if [ "$FORCE_DEPLOY" = false ]; then
            exit 1
        fi
    fi
    
    # Run unit tests (if they exist)
    if npm run test --silent > /dev/null 2>&1; then
        log_success "Tests passed"
    else
        log_warning "Tests failed or not configured"
        if [ "$FORCE_DEPLOY" = false ] && [ -f "jest.config.js" ]; then
            exit 1
        fi
    fi
}

# Build verification
verify_build() {
    if [ "$SKIP_BUILD_VERIFICATION" = true ]; then
        log_warning "Build verification skipped (--skip-build-verification used)"
        return 0
    fi
    
    log_info "Verifying build..."
    
    # Run build locally to catch issues early
    if npm run build > build.log 2>&1; then
        log_success "Local build successful"
        rm -f build.log
    else
        log_error "Local build failed. Check build.log for details"
        tail -n 20 build.log
        if [ "$FORCE_DEPLOY" = false ]; then
            exit 1
        fi
    fi
}

# Create deployment backup
create_deployment_backup() {
    log_info "Creating deployment backup..."
    
    local backup_dir="./deployments/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup important files
    local backup_files=(
        ".vercel"
        "vercel.json"
        ".env*"
        "package.json"
        "package-lock.json"
    )
    
    for file in "${backup_files[@]}"; do
        if ls $file 1> /dev/null 2>&1; then
            cp -r $file "$backup_dir/" 2>/dev/null || true
        fi
    done
    
    log_success "Deployment backup created: $backup_dir"
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel ($ENVIRONMENT)..."
    
    local vercel_args=()
    
    # Set environment-specific flags
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel_args+=("--prod")
    fi
    
    # Add force flag if needed
    if [ "$FORCE_DEPLOY" = true ]; then
        vercel_args+=("--force")
    fi
    
    # Set timeout
    export VERCEL_TIMEOUT=$DEPLOYMENT_TIMEOUT
    
    # Run deployment with timeout
    local deployment_start=$(date +%s)
    local deployment_url=""
    
    log_info "Running: vercel ${vercel_args[*]}"
    
    if deployment_url=$(timeout $DEPLOYMENT_TIMEOUT vercel "${vercel_args[@]}" 2>&1); then
        local deployment_end=$(date +%s)
        local deployment_time=$((deployment_end - deployment_start))
        
        log_success "Deployment completed in ${deployment_time}s"
        log_success "Deployment URL: $deployment_url"
        
        # Export URL for post-deployment checks
        export DEPLOYMENT_URL="$deployment_url"
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            log_error "Deployment timed out after ${DEPLOYMENT_TIMEOUT}s"
        else
            log_error "Deployment failed with exit code $exit_code"
            echo "$deployment_url" | tail -n 10
        fi
        exit $exit_code
    fi
}

# Post-deployment verification
verify_deployment() {
    if [ -z "$DEPLOYMENT_URL" ]; then
        log_error "No deployment URL available for verification"
        return 1
    fi
    
    log_info "Verifying deployment at $DEPLOYMENT_URL"
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    sleep 30
    
    # Health check
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s "$DEPLOYMENT_URL/api/health" > /dev/null; then
            log_success "Health check passed"
            break
        elif [ $attempt -eq $max_attempts ]; then
            log_error "Health check failed after $max_attempts attempts"
            return 1
        else
            log_warning "Health check failed, retrying in 10s..."
            sleep 10
        fi
        
        ((attempt++))
    done
    
    # Check if homepage loads
    if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
        log_success "Homepage loads successfully"
    else
        log_error "Homepage failed to load"
        return 1
    fi
    
    # Check analytics (if enabled)
    if [ "$ANALYTICS_CHECK" = true ]; then
        log_info "Verifying analytics integration..."
        
        local page_source=$(curl -s "$DEPLOYMENT_URL")
        local analytics_found=false
        
        # Check for various analytics implementations
        if echo "$page_source" | grep -q "gtag\|google-analytics\|googletagmanager"; then
            log_success "Google Analytics detected"
            analytics_found=true
        fi
        
        if echo "$page_source" | grep -q "fbq\|facebook.*pixel"; then
            log_success "Facebook Pixel detected"
            analytics_found=true
        fi
        
        if echo "$page_source" | grep -q "clarity.*microsoft"; then
            log_success "Microsoft Clarity detected"
            analytics_found=true
        fi
        
        if [ "$analytics_found" = false ]; then
            log_warning "No analytics implementations detected on deployed site"
        fi
    fi
    
    log_success "Deployment verification completed"
}

# Update deployment status
update_deployment_status() {
    local status="$1"
    local message="$2"
    
    # Create deployment record
    local deployment_record="./deployments/deployment-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$(dirname "$deployment_record")"
    
    cat > "$deployment_record" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "environment": "$ENVIRONMENT",
    "status": "$status",
    "message": "$message",
    "deployment_url": "${DEPLOYMENT_URL:-""}",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo "unknown")",
    "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")",
    "deployed_by": "$(git config user.name 2>/dev/null || echo "unknown")",
    "node_version": "$(node --version)",
    "vercel_version": "$(vercel --version 2>/dev/null || echo "unknown")"
}
EOF
    
    log_info "Deployment record saved: $deployment_record"
}

# Rollback function
rollback_deployment() {
    log_error "Deployment failed. Starting rollback procedure..."
    
    # Get the previous successful deployment
    local previous_deployment=$(vercel ls --max-age=1d | grep -E "READY.*ago" | head -n 2 | tail -n 1 | awk '{print $2}')
    
    if [ -n "$previous_deployment" ]; then
        log_info "Rolling back to previous deployment: $previous_deployment"
        vercel promote "$previous_deployment" --prod
        log_success "Rollback completed"
    else
        log_error "No previous deployment found for rollback"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove temporary files
    rm -f build.log
    rm -f deployment.log
    
    # Clean npm cache if needed
    if [ "$FORCE_DEPLOY" = true ]; then
        npm cache clean --force > /dev/null 2>&1 || true
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    # Trap errors for cleanup and rollback
    trap 'cleanup; rollback_deployment; update_deployment_status "failed" "Deployment failed"; exit 1' ERR
    trap 'cleanup' EXIT
    
    # Run all deployment steps
    check_prerequisites
    verify_analytics
    run_tests
    verify_build
    create_deployment_backup
    deploy_to_vercel
    verify_deployment
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    update_deployment_status "success" "Deployment completed successfully in ${total_time}s"
    
    log_success "🎉 LexChronos deployment completed successfully!"
    log_success "⏱️  Total deployment time: ${total_time}s"
    log_success "🌐 Deployment URL: $DEPLOYMENT_URL"
    
    # Final summary
    echo ""
    echo "=================================="
    echo "DEPLOYMENT SUMMARY"
    echo "=================================="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "URL: $DEPLOYMENT_URL"
    echo "Time: ${total_time}s"
    echo "Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
    echo "Deployed by: $(git config user.name 2>/dev/null || echo "unknown")"
    echo "Timestamp: $(date)"
    echo "=================================="
}

# Run main function
main "$@"