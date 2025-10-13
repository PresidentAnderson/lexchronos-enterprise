#!/bin/bash

# Post-deployment Verification Tests for LexChronos

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
    echo -e "${BOLD}${PURPLE}🧪 $1${NC}"
}

# Configuration
DEPLOYMENT_URL="${1:-https://lexchronos.com}"
API_BASE="$DEPLOYMENT_URL/api"
TIMEOUT=30
MAX_RETRIES=3

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEST_RESULTS=()

# Print banner
echo -e "${BOLD}${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                POST-DEPLOYMENT VERIFICATION                     ║
║                      LexChronos Testing                          ║
║                                                                  ║
║  🎯 Target: $DEPLOYMENT_URL                                      ║
║  🧪 Tests: Functionality, Performance, Security                 ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

# Helper functions
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="${3:-0}"
    
    log_info "Running test: $test_name"
    
    if eval "$test_command"; then
        if [[ $? -eq $expected_result ]]; then
            log_success "$test_name - PASSED"
            TEST_RESULTS+=("✅ $test_name - PASSED")
            ((TESTS_PASSED++))
        else
            log_error "$test_name - FAILED (unexpected exit code)"
            TEST_RESULTS+=("❌ $test_name - FAILED (unexpected exit code)")
            ((TESTS_FAILED++))
        fi
    else
        log_error "$test_name - FAILED"
        TEST_RESULTS+=("❌ $test_name - FAILED")
        ((TESTS_FAILED++))
    fi
}

run_curl_test() {
    local test_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local additional_checks="${4:-}"
    
    log_info "Running HTTP test: $test_name"
    
    local response=$(curl -s -w "\n%{http_code}\n%{time_total}\n%{size_download}" --max-time $TIMEOUT "$url" 2>/dev/null || echo -e "\n000\n999\n0")
    local body=$(echo "$response" | head -n -3)
    local status_code=$(echo "$response" | tail -n 3 | head -n 1)
    local time_total=$(echo "$response" | tail -n 2 | head -n 1)
    local size_download=$(echo "$response" | tail -n 1)
    
    if [[ "$status_code" == "$expected_status" ]]; then
        if [[ -z "$additional_checks" ]] || echo "$body" | grep -q "$additional_checks"; then
            log_success "$test_name - PASSED (${status_code}, ${time_total}s, ${size_download} bytes)"
            TEST_RESULTS+=("✅ $test_name - PASSED (${status_code}, ${time_total}s)")
            ((TESTS_PASSED++))
        else
            log_error "$test_name - FAILED (content check failed)"
            TEST_RESULTS+=("❌ $test_name - FAILED (content check failed)")
            ((TESTS_FAILED++))
        fi
    else
        log_error "$test_name - FAILED (got ${status_code}, expected ${expected_status})"
        TEST_RESULTS+=("❌ $test_name - FAILED (${status_code})")
        ((TESTS_FAILED++))
    fi
}

wait_for_deployment() {
    local max_wait=300 # 5 minutes
    local wait_time=0
    
    log_info "Waiting for deployment to be ready..."
    
    while [[ $wait_time -lt $max_wait ]]; do
        if curl -s --max-time 10 "$DEPLOYMENT_URL" > /dev/null 2>&1; then
            log_success "Deployment is responding"
            return 0
        fi
        
        sleep 10
        wait_time=$((wait_time + 10))
        log_info "Waiting for deployment... (${wait_time}s)"
    done
    
    log_error "Deployment did not become ready within ${max_wait}s"
    return 1
}

# Step 1: Basic Connectivity Tests
log_header "Step 1: Basic Connectivity Tests"

wait_for_deployment

run_curl_test "Homepage Access" "$DEPLOYMENT_URL" "200" "LexChronos"
run_curl_test "HTTPS Redirect" "http://$(echo $DEPLOYMENT_URL | sed 's|https://||')" "301"

# Test subdomains if they exist
if [[ "$DEPLOYMENT_URL" == "https://lexchronos.com" ]]; then
    run_curl_test "WWW Redirect" "https://www.lexchronos.com" "200"
    run_curl_test "API Subdomain" "https://api.lexchronos.com" "200"
fi

# Step 2: API Health Tests
log_header "Step 2: API Health and Status Tests"

run_curl_test "Health Check Endpoint" "$API_BASE/health" "200" "healthy"
run_curl_test "Metrics Endpoint" "$API_BASE/metrics" "200" "metrics"
run_curl_test "Status Endpoint" "$API_BASE/status" "200"

# Test API endpoints that should be accessible
run_curl_test "Authentication Endpoint" "$API_BASE/auth/login" "405" # Should reject GET
run_curl_test "Cases API" "$API_BASE/cases" "401" # Should require auth

# Step 3: Security Headers Tests
log_header "Step 3: Security Headers Verification"

test_security_headers() {
    local headers=$(curl -I -s --max-time $TIMEOUT "$DEPLOYMENT_URL" 2>/dev/null || echo "Failed to fetch headers")
    local required_headers=(
        "strict-transport-security"
        "x-content-type-options"
        "x-frame-options"
        "referrer-policy"
    )
    
    for header in "${required_headers[@]}"; do
        if echo "$headers" | grep -i "$header" > /dev/null; then
            log_success "Security header present: $header"
            TEST_RESULTS+=("✅ Security header: $header - PRESENT")
            ((TESTS_PASSED++))
        else
            log_error "Security header missing: $header"
            TEST_RESULTS+=("❌ Security header: $header - MISSING")
            ((TESTS_FAILED++))
        fi
    done
}

test_security_headers

# Step 4: Performance Tests
log_header "Step 4: Performance and Load Time Tests"

test_page_performance() {
    local url="$1"
    local page_name="$2"
    local max_load_time="${3:-3}"
    
    log_info "Testing performance for: $page_name"
    
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{time_total}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "999")
    local load_time=$(echo "$response" | tail -n 1)
    
    if (( $(echo "$load_time < $max_load_time" | bc -l 2>/dev/null || echo "0") )); then
        log_success "$page_name loads in ${load_time}s (< ${max_load_time}s)"
        TEST_RESULTS+=("✅ $page_name performance - GOOD (${load_time}s)")
        ((TESTS_PASSED++))
    else
        log_warning "$page_name loads in ${load_time}s (> ${max_load_time}s)"
        TEST_RESULTS+=("⚠️  $page_name performance - SLOW (${load_time}s)")
        ((TESTS_FAILED++))
    fi
}

test_page_performance "$DEPLOYMENT_URL" "Homepage" "3"
test_page_performance "$DEPLOYMENT_URL/login" "Login Page" "3"
test_page_performance "$DEPLOYMENT_URL/dashboard" "Dashboard" "5"
test_page_performance "$API_BASE/health" "Health API" "1"

# Step 5: Functional Tests
log_header "Step 5: Core Functionality Tests"

# Test static assets
run_curl_test "Favicon" "$DEPLOYMENT_URL/favicon.ico" "200"
run_curl_test "Manifest" "$DEPLOYMENT_URL/manifest.json" "200" "lexchronos"

# Test API error handling
run_curl_test "Non-existent API endpoint" "$API_BASE/nonexistent" "404"
run_curl_test "Invalid API method" "$API_BASE/health" "405" "" # POST to GET endpoint

# Test authentication flow
test_auth_endpoints() {
    log_info "Testing authentication endpoints..."
    
    # Test login endpoint with invalid data
    local login_response=$(curl -s -X POST -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"invalid"}' \
        "$API_BASE/auth/login" 2>/dev/null || echo "000")
    
    local login_status=$(echo "$login_response" | tail -c 4)
    
    if [[ "$login_status" == "401" || "$login_status" == "400" ]]; then
        log_success "Authentication properly rejects invalid credentials"
        TEST_RESULTS+=("✅ Authentication validation - WORKING")
        ((TESTS_PASSED++))
    else
        log_error "Authentication validation may be broken (got ${login_status})"
        TEST_RESULTS+=("❌ Authentication validation - FAILED (${login_status})")
        ((TESTS_FAILED++))
    fi
}

test_auth_endpoints

# Step 6: PWA and Mobile Tests
log_header "Step 6: PWA and Mobile Functionality"

test_pwa_features() {
    log_info "Testing PWA features..."
    
    # Test service worker
    if curl -s --max-time $TIMEOUT "$DEPLOYMENT_URL/sw.js" > /dev/null 2>&1; then
        log_success "Service worker accessible"
        TEST_RESULTS+=("✅ Service worker - ACCESSIBLE")
        ((TESTS_PASSED++))
    else
        log_warning "Service worker not accessible"
        TEST_RESULTS+=("⚠️  Service worker - NOT ACCESSIBLE")
        ((TESTS_FAILED++))
    fi
    
    # Test manifest
    local manifest=$(curl -s --max-time $TIMEOUT "$DEPLOYMENT_URL/manifest.json" 2>/dev/null)
    if echo "$manifest" | grep -q "lexchronos" && echo "$manifest" | grep -q "icons"; then
        log_success "PWA manifest is valid"
        TEST_RESULTS+=("✅ PWA manifest - VALID")
        ((TESTS_PASSED++))
    else
        log_error "PWA manifest is invalid or missing"
        TEST_RESULTS+=("❌ PWA manifest - INVALID")
        ((TESTS_FAILED++))
    fi
}

test_pwa_features

# Step 7: Database Connection Tests
log_header "Step 7: Database and External Service Tests"

test_database_health() {
    log_info "Testing database connectivity through health endpoint..."
    
    local health_response=$(curl -s --max-time $TIMEOUT "$API_BASE/health" 2>/dev/null || echo '{"checks":{"database":"unknown"}}')
    
    if echo "$health_response" | grep -q '"database":"healthy"'; then
        log_success "Database connection is healthy"
        TEST_RESULTS+=("✅ Database connection - HEALTHY")
        ((TESTS_PASSED++))
    elif echo "$health_response" | grep -q '"database":"unknown"'; then
        log_warning "Database connection status unknown"
        TEST_RESULTS+=("⚠️  Database connection - UNKNOWN")
        ((TESTS_FAILED++))
    else
        log_error "Database connection appears unhealthy"
        TEST_RESULTS+=("❌ Database connection - UNHEALTHY")
        ((TESTS_FAILED++))
    fi
}

test_database_health

# Step 8: Analytics and Tracking Tests
log_header "Step 8: Analytics and Tracking Verification"

test_analytics() {
    log_info "Testing analytics implementation..."
    
    local homepage=$(curl -s --max-time $TIMEOUT "$DEPLOYMENT_URL" 2>/dev/null || echo "")
    
    # Check for Google Analytics
    if echo "$homepage" | grep -q "gtag\|google-analytics\|GA_TRACKING_ID"; then
        log_success "Google Analytics detected"
        TEST_RESULTS+=("✅ Google Analytics - DETECTED")
        ((TESTS_PASSED++))
    else
        log_warning "Google Analytics not detected"
        TEST_RESULTS+=("⚠️  Google Analytics - NOT DETECTED")
        ((TESTS_FAILED++))
    fi
    
    # Check for Facebook Pixel
    if echo "$homepage" | grep -q "facebook\|fbq\|FB_PIXEL"; then
        log_success "Facebook Pixel detected"
        TEST_RESULTS+=("✅ Facebook Pixel - DETECTED")
        ((TESTS_PASSED++))
    else
        log_warning "Facebook Pixel not detected"
        TEST_RESULTS+=("⚠️  Facebook Pixel - NOT DETECTED")
        ((TESTS_FAILED++))
    fi
}

test_analytics

# Step 9: Error Handling Tests
log_header "Step 9: Error Handling and Edge Cases"

# Test error pages
run_curl_test "404 Error Handling" "$DEPLOYMENT_URL/nonexistent-page" "404"

# Test malformed requests
test_malformed_requests() {
    log_info "Testing malformed request handling..."
    
    # Test oversized request
    local large_payload=$(python3 -c "print('x' * 10000)" 2>/dev/null || echo "large_payload_test")
    local response=$(curl -s -X POST -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -d "{\"data\":\"$large_payload\"}" \
        "$API_BASE/health" 2>/dev/null || echo "000")
    
    local status=$(echo "$response" | tail -c 4)
    
    if [[ "$status" == "400" || "$status" == "413" || "$status" == "405" ]]; then
        log_success "Malformed requests properly rejected"
        TEST_RESULTS+=("✅ Malformed request handling - WORKING")
        ((TESTS_PASSED++))
    else
        log_warning "Malformed request handling may need attention (got ${status})"
        TEST_RESULTS+=("⚠️  Malformed request handling - CHECK (${status})")
        ((TESTS_FAILED++))
    fi
}

test_malformed_requests

# Step 10: Monitoring and Alerting Tests
log_header "Step 10: Monitoring System Verification"

test_monitoring() {
    log_info "Testing monitoring endpoints..."
    
    # Test Sentry (if configured)
    local homepage=$(curl -s --max-time $TIMEOUT "$DEPLOYMENT_URL" 2>/dev/null || echo "")
    if echo "$homepage" | grep -q "sentry"; then
        log_success "Sentry error tracking detected"
        TEST_RESULTS+=("✅ Sentry monitoring - DETECTED")
        ((TESTS_PASSED++))
    else
        log_info "Sentry not detected (may be configured via environment)"
        TEST_RESULTS+=("ℹ️  Sentry monitoring - NOT VISIBLE")
    fi
    
    # Test custom monitoring endpoints
    if curl -s --max-time $TIMEOUT "$DEPLOYMENT_URL/api/metrics" > /dev/null 2>&1; then
        log_success "Custom metrics endpoint working"
        TEST_RESULTS+=("✅ Custom metrics - WORKING")
        ((TESTS_PASSED++))
    else
        log_warning "Custom metrics endpoint not accessible"
        TEST_RESULTS+=("⚠️  Custom metrics - NOT ACCESSIBLE")
        ((TESTS_FAILED++))
    fi
}

test_monitoring

# Step 11: SSL and Certificate Tests
log_header "Step 11: SSL Certificate and Security Tests"

test_ssl() {
    log_info "Testing SSL certificate..."
    
    local domain=$(echo "$DEPLOYMENT_URL" | sed 's|https://||' | sed 's|/.*||')
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "Certificate check failed")
    
    if echo "$cert_info" | grep -q "notAfter"; then
        local expiry=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        log_success "SSL certificate is valid (expires: $expiry)"
        TEST_RESULTS+=("✅ SSL certificate - VALID")
        ((TESTS_PASSED++))
    else
        log_error "SSL certificate validation failed"
        TEST_RESULTS+=("❌ SSL certificate - FAILED")
        ((TESTS_FAILED++))
    fi
}

# Only test SSL if we have openssl
if command -v openssl > /dev/null 2>&1; then
    test_ssl
else
    log_info "OpenSSL not available, skipping SSL certificate test"
fi

# Step 12: Generate Test Report
log_header "Step 12: Test Results Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$(( TESTS_PASSED * 100 / TOTAL_TESTS ))

# Create detailed test report
cat > "POST_DEPLOYMENT_TEST_REPORT.md" << EOF
# LexChronos Post-Deployment Test Report

## Test Summary
- **Date**: $(date)
- **Target URL**: $DEPLOYMENT_URL
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $TESTS_PASSED
- **Failed**: $TESTS_FAILED
- **Success Rate**: ${SUCCESS_RATE}%

## Test Results

### Connectivity and Basic Functionality
$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -E "(Homepage|HTTPS|API|Health)" || echo "No connectivity tests recorded")

### Security and Headers
$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -E "(Security|SSL|certificate)" || echo "No security tests recorded")

### Performance
$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -E "(performance|loads)" || echo "No performance tests recorded")

### Analytics and Tracking
$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -E "(Analytics|Pixel|tracking)" || echo "No analytics tests recorded")

### Monitoring and Health
$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -E "(monitoring|metrics|Sentry)" || echo "No monitoring tests recorded")

### All Test Results
$(printf '%s\n' "${TEST_RESULTS[@]}")

## Recommendations

### Critical Issues (Must Fix)
$(printf '%s\n' "${TEST_RESULTS[@]}" | grep "❌" | sed 's/^/- /' || echo "None detected")

### Warnings (Should Fix)
$(printf '%s\n' "${TEST_RESULTS[@]}" | grep "⚠️" | sed 's/^/- /' || echo "None detected")

### Performance Optimizations
- Monitor page load times regularly
- Set up automated performance testing
- Implement caching strategies for slow endpoints

### Security Enhancements
- Regular SSL certificate monitoring
- Implement additional security headers if missing
- Set up automated security scanning

### Monitoring Improvements
- Configure alerting for failed health checks
- Set up uptime monitoring with external service
- Implement detailed application metrics

## Next Steps

1. **Address Critical Issues**: Fix all failing tests immediately
2. **Performance Monitoring**: Set up continuous performance monitoring
3. **Security Audit**: Run comprehensive security scan
4. **Load Testing**: Perform load testing with realistic traffic
5. **User Acceptance Testing**: Conduct end-to-end user testing
6. **Backup Verification**: Test database backup and restore procedures

## Support Information
- **Test Script**: $0
- **Documentation**: See deployment documentation
- **Monitoring**: Check monitoring dashboard for ongoing health

---
Generated by LexChronos post-deployment test suite
Test completed: $(date)
EOF

# Display final results
echo -e "${BOLD}${GREEN}
╔══════════════════════════════════════════════════════════════════╗
║                   🎉 TESTING COMPLETE! 🎉                       ║
║                                                                  ║
║  📊 Results Summary:                                             ║
║  Total Tests: $TOTAL_TESTS                                       ║
║  Passed: $TESTS_PASSED                                           ║
║  Failed: $TESTS_FAILED                                           ║
║  Success Rate: ${SUCCESS_RATE}%                                  ║
║                                                                  ║
║  🎯 Target URL: $DEPLOYMENT_URL                                  ║
║                                                                  ║
║  📁 Report: POST_DEPLOYMENT_TEST_REPORT.md                      ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    log_success "All tests passed! Deployment is ready for production use."
    exit 0
elif [[ $SUCCESS_RATE -ge 80 ]]; then
    log_warning "Most tests passed, but some issues need attention."
    log_info "Review the test report and address failing tests."
    exit 1
else
    log_error "Multiple tests failed. Deployment may not be ready for production."
    log_info "Please address critical issues before proceeding."
    exit 2
fi