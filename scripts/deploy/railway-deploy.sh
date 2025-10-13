#!/bin/bash

# Railway Deployment Script for LexChronos
# Description: Complete deployment automation for Railway with database migration and verification

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
DEPLOYMENT_TIMEOUT=900 # 15 minutes for Railway
DEFAULT_SERVICE="web"

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
SERVICE_NAME="$DEFAULT_SERVICE"
FORCE_DEPLOY=false
SKIP_TESTS=false
RUN_MIGRATIONS=true
SKIP_BUILD_VERIFICATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --env|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --service)
            SERVICE_NAME="$2"
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
        --skip-migrations)
            RUN_MIGRATIONS=false
            shift
            ;;
        --skip-build-verification)
            SKIP_BUILD_VERIFICATION=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env, --environment ENV    Deployment environment (production|staging|development)"
            echo "  --service NAME              Railway service name (default: $DEFAULT_SERVICE)"
            echo "  --force                     Force deployment even if checks fail"
            echo "  --skip-tests               Skip running tests"
            echo "  --skip-migrations          Skip database migrations"
            echo "  --skip-build-verification  Skip build verification"
            echo "  --help, -h                 Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

log_info "Starting Railway deployment for LexChronos"
log_info "Environment: $ENVIRONMENT"
log_info "Service: $SERVICE_NAME"

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
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI not found. Install with: npm install -g @railway/cli"
        exit 1
    fi
    
    # Check if user is logged in to Railway
    if ! railway whoami &> /dev/null; then
        log_error "Not logged in to Railway. Run: railway login"
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

# Setup Railway project
setup_railway_project() {
    log_info "Setting up Railway project..."
    
    # Check if railway.json exists
    if [ ! -f "railway.json" ]; then
        log_info "Creating railway.json configuration..."
        cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF
        log_success "railway.json created"
    fi
    
    # Link to project if not already linked
    if [ ! -f ".railway" ]; then
        log_info "Linking to Railway project..."
        railway link
    fi
    
    # Select environment
    railway environment use "$ENVIRONMENT"
    
    log_success "Railway project setup completed"
}

# Check environment variables
check_environment_variables() {
    log_info "Checking required environment variables..."
    
    local required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "SESSION_SECRET"
        "NODE_ENV"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! railway variables get "$var" &> /dev/null; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        
        if [ "$FORCE_DEPLOY" = false ]; then
            log_error "Set missing variables with: railway variables set KEY=value"
            exit 1
        else
            log_warning "Force deploy enabled - proceeding with missing variables"
        fi
    fi
    
    # Set NODE_ENV if not set
    if ! railway variables get NODE_ENV &> /dev/null; then
        log_info "Setting NODE_ENV to $ENVIRONMENT"
        railway variables set NODE_ENV="$ENVIRONMENT"
    fi
    
    log_success "Environment variables check completed"
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

# Database connectivity check
check_database_connectivity() {
    log_info "Checking database connectivity..."
    
    # Get database URL from Railway
    local db_url
    if db_url=$(railway variables get DATABASE_URL 2>/dev/null); then
        # Test connection using Node.js
        cat > db_test.js << EOF
const { Client } = require('pg');
const client = new Client({ connectionString: process.argv[2] });

client.connect()
  .then(() => {
    console.log('Database connection successful');
    return client.query('SELECT NOW()');
  })
  .then(() => client.end())
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
EOF
        
        if node db_test.js "$db_url" > /dev/null 2>&1; then
            log_success "Database connectivity verified"
        else
            log_error "Database connection failed"
            if [ "$FORCE_DEPLOY" = false ]; then
                rm -f db_test.js
                exit 1
            fi
        fi
        
        rm -f db_test.js
    else
        log_warning "DATABASE_URL not found in Railway variables"
    fi
}

# Run database migrations
run_database_migrations() {
    if [ "$RUN_MIGRATIONS" = false ]; then
        log_warning "Database migrations skipped (--skip-migrations used)"
        return 0
    fi
    
    log_info "Running database migrations..."
    
    # Check if migration script exists
    if [ -f "scripts/migrate.js" ]; then
        # Get database URL from Railway
        local db_url
        if db_url=$(railway variables get DATABASE_URL 2>/dev/null); then
            export DATABASE_URL="$db_url"
            
            if node scripts/migrate.js up > migration.log 2>&1; then
                log_success "Database migrations completed"
                rm -f migration.log
            else
                log_error "Database migrations failed. Check migration.log for details"
                tail -n 10 migration.log
                if [ "$FORCE_DEPLOY" = false ]; then
                    exit 1
                fi
            fi
        else
            log_warning "DATABASE_URL not available for migrations"
        fi
    else
        log_warning "Migration script not found (scripts/migrate.js)"
    fi
}

# Deploy to Railway
deploy_to_railway() {
    log_info "Deploying to Railway ($ENVIRONMENT)..."
    
    local deployment_start=$(date +%s)
    local deployment_id=""
    
    # Start deployment
    log_info "Starting deployment..."
    
    if deployment_id=$(railway up --detach --service="$SERVICE_NAME" 2>&1); then
        # Extract deployment ID from output
        deployment_id=$(echo "$deployment_id" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -n1)
        
        if [ -n "$deployment_id" ]; then
            log_success "Deployment started with ID: $deployment_id"
            export DEPLOYMENT_ID="$deployment_id"
            
            # Monitor deployment progress
            monitor_deployment "$deployment_id"
            
        else
            log_error "Failed to extract deployment ID"
            exit 1
        fi
    else
        log_error "Failed to start deployment"
        echo "$deployment_id" | tail -n 10
        exit 1
    fi
    
    local deployment_end=$(date +%s)
    local deployment_time=$((deployment_end - deployment_start))
    log_success "Deployment process completed in ${deployment_time}s"
}

# Monitor deployment progress
monitor_deployment() {
    local deployment_id="$1"
    local max_wait_time=$DEPLOYMENT_TIMEOUT
    local check_interval=30
    local elapsed_time=0
    
    log_info "Monitoring deployment progress..."
    
    while [ $elapsed_time -lt $max_wait_time ]; do
        local status
        if status=$(railway status --service="$SERVICE_NAME" --json 2>/dev/null); then
            local deployment_status=$(echo "$status" | jq -r '.deployments[0].status' 2>/dev/null)
            local deployment_state=$(echo "$status" | jq -r '.deployments[0].meta.buildStatus' 2>/dev/null)
            
            case "$deployment_status" in
                "SUCCESS")
                    log_success "Deployment completed successfully"
                    return 0
                    ;;
                "FAILED"|"CRASHED")
                    log_error "Deployment failed with status: $deployment_status"
                    # Get deployment logs
                    railway logs --service="$SERVICE_NAME" | tail -n 20
                    return 1
                    ;;
                "BUILDING"|"DEPLOYING"|"WAITING")
                    log_info "Deployment status: $deployment_status ($deployment_state)"
                    ;;
                *)
                    log_info "Deployment status: $deployment_status"
                    ;;
            esac
        else
            log_warning "Failed to get deployment status"
        fi
        
        sleep $check_interval
        elapsed_time=$((elapsed_time + check_interval))
        
        # Show progress
        local progress=$((elapsed_time * 100 / max_wait_time))
        log_info "Progress: ${progress}% (${elapsed_time}s/${max_wait_time}s)"
    done
    
    log_error "Deployment monitoring timed out after ${max_wait_time}s"
    return 1
}

# Get deployment URL
get_deployment_url() {
    log_info "Getting deployment URL..."
    
    local status
    if status=$(railway status --service="$SERVICE_NAME" --json 2>/dev/null); then
        local deployment_url=$(echo "$status" | jq -r '.service.deployments[0].url' 2>/dev/null)
        
        if [ "$deployment_url" != "null" ] && [ -n "$deployment_url" ]; then
            export DEPLOYMENT_URL="$deployment_url"
            log_success "Deployment URL: $deployment_url"
        else
            # Try alternative method
            deployment_url=$(railway domain --service="$SERVICE_NAME" 2>/dev/null | head -n1)
            if [ -n "$deployment_url" ]; then
                export DEPLOYMENT_URL="https://$deployment_url"
                log_success "Deployment URL: https://$deployment_url"
            else
                log_warning "Could not determine deployment URL"
                export DEPLOYMENT_URL=""
            fi
        fi
    else
        log_warning "Failed to get deployment status for URL extraction"
        export DEPLOYMENT_URL=""
    fi
}

# Post-deployment verification
verify_deployment() {
    get_deployment_url
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        log_warning "No deployment URL available for verification"
        return 0
    fi
    
    log_info "Verifying deployment at $DEPLOYMENT_URL"
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    sleep 60
    
    # Health check with retries
    local max_attempts=15
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s --max-time 30 "$DEPLOYMENT_URL/api/health" > /dev/null; then
            log_success "Health check passed"
            break
        elif [ $attempt -eq $max_attempts ]; then
            log_error "Health check failed after $max_attempts attempts"
            
            # Get recent logs for debugging
            log_info "Recent application logs:"
            railway logs --service="$SERVICE_NAME" | tail -n 10
            
            return 1
        else
            log_warning "Health check failed, retrying in 20s..."
            sleep 20
        fi
        
        ((attempt++))
    done
    
    # Check if homepage loads
    if curl -f -s --max-time 30 "$DEPLOYMENT_URL" > /dev/null; then
        log_success "Homepage loads successfully"
    else
        log_warning "Homepage failed to load"
    fi
    
    # Database connectivity check from deployed app
    if curl -f -s --max-time 30 "$DEPLOYMENT_URL/api/health?detailed=true" | grep -q '"database":{"status":"healthy"' 2>/dev/null; then
        log_success "Database connectivity verified from deployed application"
    else
        log_warning "Database connectivity could not be verified from deployed application"
    fi
    
    log_success "Deployment verification completed"
}

# Update deployment status
update_deployment_status() {
    local status="$1"
    local message="$2"
    
    # Create deployment record
    local deployment_record="./deployments/railway-deployment-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$(dirname "$deployment_record")"
    
    cat > "$deployment_record" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "platform": "railway",
    "environment": "$ENVIRONMENT",
    "service": "$SERVICE_NAME",
    "status": "$status",
    "message": "$message",
    "deployment_url": "${DEPLOYMENT_URL:-""}",
    "deployment_id": "${DEPLOYMENT_ID:-""}",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo "unknown")",
    "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")",
    "deployed_by": "$(git config user.name 2>/dev/null || echo "unknown")",
    "node_version": "$(node --version)",
    "railway_cli_version": "$(railway version 2>/dev/null || echo "unknown")"
}
EOF
    
    log_info "Deployment record saved: $deployment_record"
}

# Rollback function
rollback_deployment() {
    log_error "Deployment failed. Checking rollback options..."
    
    # Get previous deployments
    local deployments
    if deployments=$(railway status --service="$SERVICE_NAME" --json 2>/dev/null); then
        local previous_deployment=$(echo "$deployments" | jq -r '.deployments[1].id' 2>/dev/null)
        
        if [ "$previous_deployment" != "null" ] && [ -n "$previous_deployment" ]; then
            log_info "Rolling back to previous deployment: $previous_deployment"
            railway rollback "$previous_deployment" --service="$SERVICE_NAME"
            log_success "Rollback initiated"
        else
            log_error "No previous deployment found for rollback"
        fi
    else
        log_error "Could not retrieve deployment history for rollback"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove temporary files
    rm -f build.log
    rm -f migration.log
    rm -f db_test.js
    
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
    setup_railway_project
    check_environment_variables
    run_tests
    verify_build
    check_database_connectivity
    run_database_migrations
    deploy_to_railway
    verify_deployment
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    update_deployment_status "success" "Deployment completed successfully in ${total_time}s"
    
    log_success "🎉 LexChronos Railway deployment completed successfully!"
    log_success "⏱️  Total deployment time: ${total_time}s"
    if [ -n "$DEPLOYMENT_URL" ]; then
        log_success "🌐 Deployment URL: $DEPLOYMENT_URL"
    fi
    
    # Final summary
    echo ""
    echo "=================================="
    echo "RAILWAY DEPLOYMENT SUMMARY"
    echo "=================================="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "Service: $SERVICE_NAME"
    if [ -n "$DEPLOYMENT_URL" ]; then
        echo "URL: $DEPLOYMENT_URL"
    fi
    echo "Time: ${total_time}s"
    echo "Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
    echo "Deployed by: $(git config user.name 2>/dev/null || echo "unknown")"
    echo "Timestamp: $(date)"
    echo "=================================="
}

# Run main function
main "$@"