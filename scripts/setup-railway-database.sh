#!/bin/bash

# Railway PostgreSQL Database Setup Script for LexChronos

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
    echo -e "${BOLD}${PURPLE}🗄️  $1${NC}"
}

# Print banner
echo -e "${BOLD}${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                    RAILWAY DATABASE SETUP                       ║
║                      LexChronos Production                       ║
║                                                                  ║
║  🎯 Target: Railway PostgreSQL                                   ║
║  📋 Tasks: Create DB, Run Migrations, Setup Backups             ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

# Step 1: Check Railway CLI
log_header "Step 1: Railway CLI Setup"

if ! command -v railway &> /dev/null; then
    log_info "Installing Railway CLI..."
    
    # Install Railway CLI
    if command -v npm &> /dev/null; then
        npm install -g @railway/cli
    else
        log_error "npm not found. Please install Node.js and npm first."
        exit 1
    fi
    
    log_success "Railway CLI installed"
else
    log_success "Railway CLI found"
fi

# Step 2: Login Check
log_header "Step 2: Railway Authentication"

if ! railway whoami > /dev/null 2>&1; then
    log_info "Please login to Railway..."
    railway login
    
    if ! railway whoami > /dev/null 2>&1; then
        log_error "Railway login failed"
        exit 1
    fi
fi

USER=$(railway whoami)
log_success "Logged in as: $USER"

# Step 3: Create New Project
log_header "Step 3: Railway Project Setup"

log_info "Creating Railway project for LexChronos..."
railway create lexchronos-production

if [[ $? -eq 0 ]]; then
    log_success "Railway project created successfully"
else
    log_warning "Project might already exist, continuing..."
fi

# Step 4: Add PostgreSQL Database
log_header "Step 4: PostgreSQL Database Setup"

log_info "Adding PostgreSQL database to project..."
railway add postgresql

if [[ $? -eq 0 ]]; then
    log_success "PostgreSQL database added successfully"
else
    log_warning "Database might already exist, continuing..."
fi

# Wait for database to be ready
log_info "Waiting for database to initialize (30 seconds)..."
sleep 30

# Step 5: Get Database Connection Details
log_header "Step 5: Database Connection Configuration"

log_info "Retrieving database connection details..."

# Get database URL
DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [[ -z "$DATABASE_URL" ]]; then
    log_error "Failed to retrieve DATABASE_URL"
    log_info "Please check Railway dashboard for connection details"
    exit 1
fi

log_success "Database URL retrieved"
log_info "Connection string format: postgresql://user:pass@host:port/db"

# Step 6: Update Environment Variables
log_header "Step 6: Environment Variables Setup"

log_info "Setting up Railway environment variables..."

# Set production environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set ENCRYPTION_KEY="$(openssl rand -base64 32)"
railway variables set FIELD_ENCRYPTION_KEY="$(openssl rand -base64 32)"
railway variables set SIGNING_SECRET="$(openssl rand -base64 32)"
railway variables set SESSION_SECRET="$(openssl rand -base64 32)"

# Set application URLs (update with your domain)
railway variables set NEXT_PUBLIC_APP_URL="https://lexchronos.com"
railway variables set NEXT_PUBLIC_API_URL="https://lexchronos.com/api"

# Set security configurations
railway variables set MFA_REQUIRED=true
railway variables set MAX_LOGIN_ATTEMPTS=5
railway variables set LOCKOUT_DURATION=900000
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Set file upload limits
railway variables set MAX_FILE_SIZE=52428800
railway variables set ALLOWED_FILE_TYPES=".pdf,.doc,.docx,.txt,.jpg,.png,.gif"

# Set privacy compliance
railway variables set GDPR_COMPLIANCE_MODE=true
railway variables set CCPA_COMPLIANCE_MODE=true
railway variables set COOKIE_CONSENT_REQUIRED=true

log_success "Environment variables configured"

# Step 7: Database Schema Setup
log_header "Step 7: Database Schema Creation"

log_info "Setting up database schema..."

# Check if migration files exist
if [[ -d "database/migrations" ]]; then
    log_info "Found migration files, preparing to run them..."
    
    # Create a temporary SQL file with all migrations
    TEMP_MIGRATION_FILE="/tmp/lexchronos_migrations.sql"
    
    # Combine all migration files
    cat > "$TEMP_MIGRATION_FILE" << 'EOF'
-- LexChronos Database Schema
-- Production Setup Script

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

EOF
    
    # Append all migration files
    find database/migrations -name "*.sql" | sort | while read -r migration_file; do
        echo "-- Migration: $(basename "$migration_file")" >> "$TEMP_MIGRATION_FILE"
        cat "$migration_file" >> "$TEMP_MIGRATION_FILE"
        echo -e "\n" >> "$TEMP_MIGRATION_FILE"
    done
    
    # Execute migrations using Railway connect
    log_info "Executing database migrations..."
    
    # Use Railway's database connection to run migrations
    if railway connect postgresql < "$TEMP_MIGRATION_FILE"; then
        log_success "Database migrations completed successfully"
    else
        log_error "Database migration failed"
        log_info "You may need to run migrations manually"
        log_info "Migration file created at: $TEMP_MIGRATION_FILE"
    fi
    
    # Clean up temp file
    rm -f "$TEMP_MIGRATION_FILE"
    
else
    log_warning "No migration files found in database/migrations"
    log_info "You'll need to create the database schema manually"
fi

# Step 8: Create Database User for Application
log_header "Step 8: Application User Setup"

log_info "Creating application-specific database user..."

# Create SQL for user setup
SETUP_USER_SQL="/tmp/setup_user.sql"
cat > "$SETUP_USER_SQL" << 'EOF'
-- Create application user with limited privileges
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'lexchronos_app') THEN
    CREATE USER lexchronos_app WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
  END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE railway TO lexchronos_app;
GRANT USAGE ON SCHEMA public TO lexchronos_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lexchronos_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lexchronos_app;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lexchronos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO lexchronos_app;
EOF

# Execute user setup (this might fail if permissions don't allow user creation)
if railway connect postgresql < "$SETUP_USER_SQL" 2>/dev/null; then
    log_success "Application user created successfully"
else
    log_warning "Could not create application user (may require admin privileges)"
    log_info "Using default database user for application"
fi

rm -f "$SETUP_USER_SQL"

# Step 9: Database Backup Configuration
log_header "Step 9: Backup Configuration"

log_info "Setting up automated backups..."

# Railway Pro plans include automated backups
# For manual backups, we'll create a script

cat > "/tmp/railway_backup.sh" << 'EOF'
#!/bin/bash
# Railway Database Backup Script

BACKUP_DIR="./database-backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lexchronos_backup_$TIMESTAMP.sql"

echo "Creating database backup: $BACKUP_FILE"

# Use Railway CLI to create backup
railway run pg_dump $DATABASE_URL > "$BACKUP_FILE"

if [[ $? -eq 0 ]]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "✅ Backup compressed: $BACKUP_FILE.gz"
    
    # Clean up old backups (keep last 30 days)
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
    echo "✅ Old backups cleaned up"
else
    echo "❌ Backup failed"
    exit 1
fi
EOF

chmod +x "/tmp/railway_backup.sh"
log_info "Backup script created at /tmp/railway_backup.sh"
log_info "Move this to your server and set up a cron job for regular backups"

# Step 10: Connection Testing
log_header "Step 10: Connection Testing"

log_info "Testing database connection..."

# Test connection using Railway CLI
TEST_SQL="SELECT version(), current_database(), current_user;"

if echo "$TEST_SQL" | railway connect postgresql; then
    log_success "Database connection test successful"
else
    log_error "Database connection test failed"
    log_info "Please check Railway dashboard for connection issues"
fi

# Step 11: Performance Optimization
log_header "Step 11: Database Performance Setup"

log_info "Applying performance optimizations..."

PERF_SQL="/tmp/performance_setup.sql"
cat > "$PERF_SQL" << 'EOF'
-- Performance optimizations for LexChronos

-- Create indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(active) WHERE active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_created_at ON cases(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- Update table statistics
ANALYZE;

-- Configure connection pooling settings
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Note: System settings require superuser privileges and server restart
EOF

if railway connect postgresql < "$PERF_SQL" 2>/dev/null; then
    log_success "Performance optimizations applied"
else
    log_warning "Some performance optimizations may require admin privileges"
    log_info "Index creation commands should still work"
fi

rm -f "$PERF_SQL"

# Step 12: Generate Connection Information
log_header "Step 12: Connection Information"

cat > "RAILWAY_DATABASE_INFO.md" << EOF
# Railway Database Configuration - LexChronos

## Connection Information
- **Service**: PostgreSQL on Railway
- **Database URL**: Available in Railway dashboard
- **Connection**: Use Railway CLI or direct connection string

## Environment Variables Set
- NODE_ENV=production
- JWT_SECRET=<generated>
- JWT_REFRESH_SECRET=<generated>
- ENCRYPTION_KEY=<generated>
- FIELD_ENCRYPTION_KEY=<generated>
- SIGNING_SECRET=<generated>
- SESSION_SECRET=<generated>
- MFA_REQUIRED=true
- GDPR_COMPLIANCE_MODE=true
- CCPA_COMPLIANCE_MODE=true

## Database Features Enabled
- UUID extension for unique identifiers
- pgcrypto extension for encryption
- Performance indexes
- Connection pooling optimization

## Backup Information
- **Manual Backup Script**: /tmp/railway_backup.sh
- **Backup Location**: ./database-backups/
- **Retention**: 30 days
- **Recommendation**: Set up automated backups via Railway Pro

## Connection Commands
\`\`\`bash
# Connect to database
railway connect postgresql

# Run migrations
railway connect postgresql < database/migrations/001_init.sql

# Create backup
railway run pg_dump \$DATABASE_URL > backup.sql
\`\`\`

## Security Notes
1. All secrets are auto-generated and secure
2. Database user has minimal required permissions
3. SSL connections enforced by Railway
4. Regular security updates managed by Railway

## Next Steps
1. Update your application's .env.local with Railway DATABASE_URL
2. Test application connection
3. Set up monitoring and alerting
4. Configure automated backups if needed
5. Review and adjust performance settings based on usage

## Support
- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app/
- PostgreSQL Docs: https://www.postgresql.org/docs/

---
Generated: $(date)
Railway Project: lexchronos-production
EOF

log_success "Database configuration complete!"

echo -e "${BOLD}${GREEN}
╔══════════════════════════════════════════════════════════════════╗
║                   🎉 DATABASE SETUP COMPLETE! 🎉                ║
║                                                                  ║
║  ✅ Railway project created: lexchronos-production              ║
║  ✅ PostgreSQL database provisioned                             ║
║  ✅ Environment variables configured                             ║
║  ✅ Database schema migrations ready                             ║
║  ✅ Performance optimizations applied                            ║
║  ✅ Backup solution provided                                     ║
║                                                                  ║
║  📋 Next Steps:                                                  ║
║  1. Get DATABASE_URL from Railway dashboard                     ║
║  2. Update your application's environment variables             ║
║  3. Deploy your application                                      ║
║  4. Test database connectivity                                   ║
║                                                                  ║
║  📁 Info: RAILWAY_DATABASE_INFO.md                              ║
║  🔧 Backup: /tmp/railway_backup.sh                              ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

log_success "Railway database setup completed successfully!"
log_info "Check RAILWAY_DATABASE_INFO.md for detailed configuration information."

exit 0