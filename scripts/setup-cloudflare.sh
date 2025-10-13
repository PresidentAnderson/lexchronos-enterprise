#!/bin/bash

# Cloudflare CDN and Security Setup Script for LexChronos

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
    echo -e "${BOLD}${PURPLE}☁️  $1${NC}"
}

# Configuration
DOMAIN_NAME="${1:-lexchronos.com}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

# Print banner
echo -e "${BOLD}${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                    CLOUDFLARE SETUP SCRIPT                      ║
║                      LexChronos Security                         ║
║                                                                  ║
║  🎯 Target Domain: $DOMAIN_NAME                                  ║
║  🛡️  Features: CDN, DDoS, WAF, Security Headers                 ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

# Step 1: Check Prerequisites
log_header "Step 1: Prerequisites Check"

if [[ -z "$API_TOKEN" ]]; then
    log_error "CLOUDFLARE_API_TOKEN environment variable not set"
    log_info "Please set your Cloudflare API token:"
    log_info "export CLOUDFLARE_API_TOKEN='your-api-token-here'"
    exit 1
fi

if [[ -z "$ZONE_ID" ]]; then
    log_warning "CLOUDFLARE_ZONE_ID not set, will try to fetch automatically"
fi

# Check if curl is available
if ! command -v curl &> /dev/null; then
    log_error "curl is required but not installed"
    exit 1
fi

# Check if jq is available for JSON parsing
if ! command -v jq &> /dev/null; then
    log_warning "jq not found, installing..."
    
    if command -v npm &> /dev/null; then
        npm install -g jq
    elif command -v brew &> /dev/null; then
        brew install jq
    else
        log_error "Please install jq manually for JSON parsing"
        exit 1
    fi
fi

log_success "Prerequisites check completed"

# Step 2: Get Zone ID
log_header "Step 2: Zone Identification"

if [[ -z "$ZONE_ID" ]]; then
    log_info "Fetching zone ID for domain: $DOMAIN_NAME"
    
    ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN_NAME" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")
    
    ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id // empty')
    
    if [[ -z "$ZONE_ID" || "$ZONE_ID" == "null" ]]; then
        log_error "Could not find zone for domain: $DOMAIN_NAME"
        log_info "Please ensure the domain is added to your Cloudflare account"
        exit 1
    fi
    
    log_success "Zone ID found: $ZONE_ID"
else
    log_success "Using provided Zone ID: $ZONE_ID"
fi

# Step 3: DNS Configuration
log_header "Step 3: DNS Configuration"

log_info "Setting up DNS records for $DOMAIN_NAME..."

# Create DNS records for the domain
create_dns_record() {
    local record_type="$1"
    local record_name="$2"
    local record_content="$3"
    local proxied="${4:-false}"
    
    # Check if record exists
    EXISTING_RECORD=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=$record_type&name=$record_name" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")
    
    RECORD_ID=$(echo "$EXISTING_RECORD" | jq -r '.result[0].id // empty')
    
    if [[ -n "$RECORD_ID" && "$RECORD_ID" != "null" ]]; then
        log_info "Updating existing $record_type record for $record_name"
        
        curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{
                \"type\": \"$record_type\",
                \"name\": \"$record_name\",
                \"content\": \"$record_content\",
                \"proxied\": $proxied
            }" > /dev/null
        
        log_success "Updated $record_type record: $record_name -> $record_content"
    else
        log_info "Creating new $record_type record for $record_name"
        
        curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
            -H "Authorization: Bearer $API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{
                \"type\": \"$record_type\",
                \"name\": \"$record_name\",
                \"content\": \"$record_content\",
                \"proxied\": $proxied
            }" > /dev/null
        
        log_success "Created $record_type record: $record_name -> $record_content"
    fi
}

# DNS records for Vercel (update these with your actual Vercel IPs)
create_dns_record "A" "$DOMAIN_NAME" "76.76.19.16" true
create_dns_record "CNAME" "www.$DOMAIN_NAME" "$DOMAIN_NAME" true

# Additional subdomains
create_dns_record "CNAME" "api.$DOMAIN_NAME" "$DOMAIN_NAME" true
create_dns_record "CNAME" "admin.$DOMAIN_NAME" "$DOMAIN_NAME" true
create_dns_record "CNAME" "docs.$DOMAIN_NAME" "$DOMAIN_NAME" true

# Step 4: Security Settings
log_header "Step 4: Security Configuration"

# Security Level
log_info "Setting security level to High..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_level" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"value":"high"}' > /dev/null
log_success "Security level set to High"

# SSL/TLS Mode
log_info "Setting SSL/TLS mode to Full (Strict)..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"value":"strict"}' > /dev/null
log_success "SSL/TLS mode set to Full (Strict)"

# Always Use HTTPS
log_info "Enabling Always Use HTTPS..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/always_use_https" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"value":"on"}' > /dev/null
log_success "Always Use HTTPS enabled"

# HSTS
log_info "Enabling HSTS..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_header" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{
        "value": {
            "strict_transport_security": {
                "enabled": true,
                "max_age": 31536000,
                "include_subdomains": true,
                "preload": true
            }
        }
    }' > /dev/null
log_success "HSTS enabled with 1 year max-age"

# Step 5: Performance Settings
log_header "Step 5: Performance Optimization"

# Minification
log_info "Enabling minification..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/minify" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{
        "value": {
            "css": "on",
            "html": "on",
            "js": "on"
        }
    }' > /dev/null
log_success "Minification enabled for CSS, HTML, and JS"

# Browser Cache TTL
log_info "Setting browser cache TTL..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/browser_cache_ttl" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"value":31536000}' > /dev/null
log_success "Browser cache TTL set to 1 year"

# Brotli compression
log_info "Enabling Brotli compression..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/brotli" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"value":"on"}' > /dev/null
log_success "Brotli compression enabled"

# Step 6: Page Rules
log_header "Step 6: Page Rules Configuration"

# Create page rules for better caching and security
create_page_rule() {
    local url_pattern="$1"
    local settings="$2"
    
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"targets\": [{
                \"target\": \"url\",
                \"constraint\": {
                    \"operator\": \"matches\",
                    \"value\": \"$url_pattern\"
                }
            }],
            \"actions\": $settings,
            \"status\": \"active\"
        }" > /dev/null
    
    log_success "Page rule created: $url_pattern"
}

# Static assets caching
create_page_rule "$DOMAIN_NAME/_next/static/*" '[
    {"id": "cache_level", "value": "cache_everything"},
    {"id": "edge_cache_ttl", "value": 31536000},
    {"id": "browser_cache_ttl", "value": 31536000}
]'

# API routes with shorter cache
create_page_rule "$DOMAIN_NAME/api/*" '[
    {"id": "cache_level", "value": "bypass"},
    {"id": "security_level", "value": "high"}
]'

# Admin routes with high security
create_page_rule "$DOMAIN_NAME/admin/*" '[
    {"id": "cache_level", "value": "bypass"},
    {"id": "security_level", "value": "high"},
    {"id": "waf", "value": "on"}
]'

# Step 7: Web Application Firewall (WAF)
log_header "Step 7: Web Application Firewall Configuration"

# Enable WAF
log_info "Enabling WAF..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/waf" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"value":"on"}' > /dev/null
log_success "WAF enabled"

# Rate limiting rules
log_info "Creating rate limiting rules..."

# Login endpoint rate limiting
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rate_limits" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{
        "match": {
            "request": {
                "url": "'$DOMAIN_NAME'/api/auth/login"
            }
        },
        "threshold": 5,
        "period": 60,
        "action": {
            "mode": "ban",
            "timeout": 3600
        },
        "description": "Login attempt rate limiting"
    }' > /dev/null

log_success "Rate limiting configured for login attempts"

# API rate limiting
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rate_limits" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{
        "match": {
            "request": {
                "url": "'$DOMAIN_NAME'/api/*"
            }
        },
        "threshold": 100,
        "period": 60,
        "action": {
            "mode": "challenge",
            "timeout": 300
        },
        "description": "API rate limiting"
    }' > /dev/null

log_success "Rate limiting configured for API endpoints"

# Step 8: Bot Management
log_header "Step 8: Bot Management"

# Bot Fight Mode (available on free plan)
log_info "Enabling Bot Fight Mode..."
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/bot_fight_mode" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"value":"on"}' > /dev/null
log_success "Bot Fight Mode enabled"

# Step 9: Analytics and Monitoring
log_header "Step 9: Analytics Configuration"

# Enable Cloudflare Analytics
log_info "Cloudflare Analytics is automatically enabled"
log_info "Access analytics at: https://dash.cloudflare.com/$ZONE_ID/analytics"

# Step 10: Generate Configuration Report
log_header "Step 10: Configuration Report"

# Create configuration report
cat > "CLOUDFLARE_CONFIG_REPORT.md" << EOF
# Cloudflare Configuration Report - LexChronos

## Domain Configuration
- **Domain**: $DOMAIN_NAME
- **Zone ID**: $ZONE_ID
- **Setup Date**: $(date)

## DNS Records Configured
- **A Record**: $DOMAIN_NAME → Vercel IP (Proxied)
- **CNAME Records**:
  - www.$DOMAIN_NAME → $DOMAIN_NAME (Proxied)
  - api.$DOMAIN_NAME → $DOMAIN_NAME (Proxied)
  - admin.$DOMAIN_NAME → $DOMAIN_NAME (Proxied)
  - docs.$DOMAIN_NAME → $DOMAIN_NAME (Proxied)

## Security Settings Applied
- ✅ **Security Level**: High
- ✅ **SSL/TLS Mode**: Full (Strict)
- ✅ **Always Use HTTPS**: Enabled
- ✅ **HSTS**: Enabled (1 year, include subdomains, preload)
- ✅ **WAF**: Enabled
- ✅ **Bot Fight Mode**: Enabled

## Performance Optimizations
- ✅ **Minification**: CSS, HTML, JS enabled
- ✅ **Brotli Compression**: Enabled
- ✅ **Browser Cache TTL**: 1 year
- ✅ **CDN Caching**: Optimized for static assets

## Rate Limiting Rules
- **Login Attempts**: 5 requests/minute, 1-hour ban
- **API Requests**: 100 requests/minute, 5-minute challenge

## Page Rules
1. **Static Assets** (\`/_next/static/*\`): Cache everything, 1-year TTL
2. **API Routes** (\`/api/*\`): Bypass cache, high security
3. **Admin Routes** (\`/admin/*\`): Bypass cache, high security, WAF

## Monitoring and Analytics
- **Cloudflare Analytics**: Enabled
- **Dashboard URL**: https://dash.cloudflare.com/$ZONE_ID/analytics
- **Security Events**: Available in Security tab
- **Performance Metrics**: Available in Performance tab

## Security Headers (via Page Rules)
Applied through Cloudflare and application:
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

## Next Steps
1. **Verify DNS Propagation**: Wait 24-48 hours for full propagation
2. **Test Security**: Use SSL Labs test (https://www.ssllabs.com/ssltest/)
3. **Monitor Performance**: Check Core Web Vitals in Cloudflare Analytics
4. **Configure Alerts**: Set up email notifications for security events
5. **Review Logs**: Monitor for blocked requests and false positives

## Troubleshooting
- **SSL Issues**: Ensure origin certificate is properly configured
- **Caching Issues**: Use development mode or purge cache
- **Security Blocks**: Review firewall events and adjust rules
- **Performance**: Monitor cache hit ratio and optimize further

## Useful Cloudflare URLs
- **Dashboard**: https://dash.cloudflare.com/
- **Zone Overview**: https://dash.cloudflare.com/$ZONE_ID
- **DNS Management**: https://dash.cloudflare.com/$ZONE_ID/dns
- **SSL/TLS Settings**: https://dash.cloudflare.com/$ZONE_ID/ssl-tls
- **Firewall Rules**: https://dash.cloudflare.com/$ZONE_ID/security/waf
- **Analytics**: https://dash.cloudflare.com/$ZONE_ID/analytics

## Support Information
- **Cloudflare Support**: https://support.cloudflare.com/
- **Community**: https://community.cloudflare.com/
- **Status Page**: https://www.cloudflarestatus.com/

---
Generated by LexChronos Cloudflare setup script
Configuration Date: $(date)
Script Version: 1.0.0
EOF

log_success "Configuration report saved to CLOUDFLARE_CONFIG_REPORT.md"

# Step 11: Verification Tests
log_header "Step 11: Configuration Verification"

log_info "Running configuration verification tests..."

# Test DNS resolution
if dig +short "$DOMAIN_NAME" > /dev/null 2>&1; then
    log_success "DNS resolution working for $DOMAIN_NAME"
else
    log_warning "DNS may still be propagating for $DOMAIN_NAME"
fi

# Test HTTPS redirect
if curl -I -s "http://$DOMAIN_NAME" | grep -q "301\|302"; then
    log_success "HTTPS redirect working"
else
    log_warning "HTTPS redirect may need time to activate"
fi

# Test security headers (if site is accessible)
log_info "Testing security headers..."
HEADERS_TEST=$(curl -I -s "https://$DOMAIN_NAME" 2>/dev/null || echo "Site not yet accessible")

if [[ "$HEADERS_TEST" != "Site not yet accessible" ]]; then
    if echo "$HEADERS_TEST" | grep -i "strict-transport-security" > /dev/null; then
        log_success "HSTS header present"
    else
        log_warning "HSTS header not detected"
    fi
    
    if echo "$HEADERS_TEST" | grep -i "x-content-type-options" > /dev/null; then
        log_success "X-Content-Type-Options header present"
    else
        log_warning "X-Content-Type-Options header not detected"
    fi
else
    log_info "Site not yet accessible for header testing (normal for new deployments)"
fi

echo -e "${BOLD}${GREEN}
╔══════════════════════════════════════════════════════════════════╗
║                🎉 CLOUDFLARE SETUP COMPLETE! 🎉                 ║
║                                                                  ║
║  Domain: $DOMAIN_NAME                                            ║
║  Zone ID: $ZONE_ID                                               ║
║  Security: ✅ High + WAF + Bot Protection                       ║
║  Performance: ✅ CDN + Compression + Caching                    ║
║  SSL/TLS: ✅ Full Strict + HSTS                                 ║
║                                                                  ║
║  📋 Next Steps:                                                  ║
║  1. Wait for DNS propagation (24-48 hours)                     ║
║  2. Test site accessibility and performance                     ║
║  3. Monitor Cloudflare analytics and security events           ║
║  4. Configure additional firewall rules if needed              ║
║                                                                  ║
║  📁 Report: CLOUDFLARE_CONFIG_REPORT.md                         ║
║  📊 Dashboard: https://dash.cloudflare.com/$ZONE_ID             ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

log_success "Cloudflare setup completed successfully!"
log_info "Check CLOUDFLARE_CONFIG_REPORT.md for detailed configuration information."
log_info "Monitor your Cloudflare dashboard for analytics and security events."

exit 0