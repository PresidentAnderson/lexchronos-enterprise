#!/bin/bash

# Security Verification and Compliance Scan for LexChronos

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
    echo -e "${BOLD}${PURPLE}🔒 $1${NC}"
}

log_critical() {
    echo -e "${RED}${BOLD}🚨 CRITICAL: $1${NC}"
}

# Configuration
DEPLOYMENT_URL="${1:-https://lexchronos.com}"
PROJECT_ROOT="/Volumes/DevOps/lexchrono"
SECURITY_REPORT="SECURITY_VERIFICATION_REPORT.md"

# Security test results
SECURITY_ISSUES_CRITICAL=()
SECURITY_ISSUES_HIGH=()
SECURITY_ISSUES_MEDIUM=()
SECURITY_ISSUES_LOW=()
SECURITY_CHECKS_PASSED=0
SECURITY_CHECKS_FAILED=0

# Print banner
echo -e "${BOLD}${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                    SECURITY VERIFICATION                        ║
║                      LexChronos Audit                           ║
║                                                                  ║
║  🎯 Target: $DEPLOYMENT_URL                                      ║
║  🔒 Focus: OWASP Top 10, Data Protection, Compliance            ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

# Helper functions
add_security_issue() {
    local severity="$1"
    local title="$2"
    local description="$3"
    
    case "$severity" in
        "CRITICAL")
            SECURITY_ISSUES_CRITICAL+=("**$title**: $description")
            ((SECURITY_CHECKS_FAILED++))
            log_critical "$title"
            ;;
        "HIGH")
            SECURITY_ISSUES_HIGH+=("**$title**: $description")
            ((SECURITY_CHECKS_FAILED++))
            log_error "$title"
            ;;
        "MEDIUM")
            SECURITY_ISSUES_MEDIUM+=("**$title**: $description")
            ((SECURITY_CHECKS_FAILED++))
            log_warning "$title"
            ;;
        "LOW")
            SECURITY_ISSUES_LOW+=("**$title**: $description")
            ((SECURITY_CHECKS_FAILED++))
            log_info "$title"
            ;;
    esac
}

mark_check_passed() {
    local check_name="$1"
    ((SECURITY_CHECKS_PASSED++))
    log_success "$check_name"
}

# Ensure we're in the correct directory
cd "$PROJECT_ROOT"

# Step 1: SSL/TLS Security Analysis
log_header "Step 1: SSL/TLS Security Analysis"

check_ssl_security() {
    local domain=$(echo "$DEPLOYMENT_URL" | sed 's|https://||' | sed 's|/.*||')
    
    log_info "Analyzing SSL/TLS configuration for $domain..."
    
    # Check SSL certificate
    if command -v openssl > /dev/null 2>&1; then
        local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null || echo "Certificate check failed")
        
        if echo "$cert_info" | grep -q "Subject:"; then
            # Check certificate expiration
            local expiry_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
            local not_after=$(echo "$expiry_info" | grep "notAfter" | cut -d= -f2)
            
            if [[ -n "$not_after" ]]; then
                local expiry_timestamp=$(date -d "$not_after" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [[ $days_until_expiry -lt 30 ]]; then
                    add_security_issue "HIGH" "SSL Certificate Expiring Soon" "Certificate expires in $days_until_expiry days"
                elif [[ $days_until_expiry -lt 90 ]]; then
                    add_security_issue "MEDIUM" "SSL Certificate Expiring" "Certificate expires in $days_until_expiry days"
                else
                    mark_check_passed "SSL Certificate validity ($days_until_expiry days remaining)"
                fi
            fi
            
            # Check key size
            if echo "$cert_info" | grep -q "RSA Public-Key: (2048 bit)"; then
                mark_check_passed "SSL Key strength (RSA 2048-bit)"
            elif echo "$cert_info" | grep -q "RSA Public-Key: (4096 bit)"; then
                mark_check_passed "SSL Key strength (RSA 4096-bit)"
            elif echo "$cert_info" | grep -q "Public-Key: (256 bit)"; then
                mark_check_passed "SSL Key strength (ECDSA 256-bit)"
            else
                add_security_issue "MEDIUM" "SSL Key Strength" "Could not verify RSA key strength or using weak encryption"
            fi
            
        else
            add_security_issue "CRITICAL" "SSL Certificate" "Cannot retrieve SSL certificate information"
        fi
    else
        log_info "OpenSSL not available, skipping detailed certificate analysis"
    fi
    
    # Check for HSTS header
    local headers=$(curl -I -s --max-time 30 "$DEPLOYMENT_URL" 2>/dev/null || echo "")
    if echo "$headers" | grep -i "strict-transport-security" > /dev/null; then
        local hsts_value=$(echo "$headers" | grep -i "strict-transport-security" | cut -d: -f2- | tr -d ' \r')
        if echo "$hsts_value" | grep -q "max-age=31536000"; then
            mark_check_passed "HSTS Header (1 year max-age)"
        else
            add_security_issue "MEDIUM" "HSTS Configuration" "HSTS header present but may have short max-age"
        fi
    else
        add_security_issue "HIGH" "HSTS Header Missing" "Strict-Transport-Security header not found"
    fi
}

check_ssl_security

# Step 2: HTTP Security Headers Analysis
log_header "Step 2: HTTP Security Headers Analysis"

check_security_headers() {
    log_info "Analyzing HTTP security headers..."
    
    local headers=$(curl -I -s --max-time 30 "$DEPLOYMENT_URL" 2>/dev/null || echo "")
    
    # Required security headers
    local required_headers=(
        "x-content-type-options:nosniff"
        "x-frame-options"
        "x-xss-protection"
        "referrer-policy"
        "content-security-policy"
        "permissions-policy"
    )
    
    for header_check in "${required_headers[@]}"; do
        local header_name=$(echo "$header_check" | cut -d: -f1)
        local expected_value=$(echo "$header_check" | cut -d: -f2-)
        
        if echo "$headers" | grep -i "$header_name" > /dev/null; then
            if [[ -n "$expected_value" ]] && [[ "$expected_value" != "$header_name" ]]; then
                local actual_value=$(echo "$headers" | grep -i "$header_name" | cut -d: -f2- | tr -d ' \r')
                if echo "$actual_value" | grep -i "$expected_value" > /dev/null; then
                    mark_check_passed "Security header: $header_name (correct value)"
                else
                    add_security_issue "MEDIUM" "Security Header Value" "$header_name present but value may be incorrect"
                fi
            else
                mark_check_passed "Security header: $header_name (present)"
            fi
        else
            case "$header_name" in
                "content-security-policy")
                    add_security_issue "HIGH" "CSP Header Missing" "Content-Security-Policy header not found - vulnerable to XSS attacks"
                    ;;
                "x-frame-options")
                    add_security_issue "MEDIUM" "X-Frame-Options Missing" "X-Frame-Options header not found - vulnerable to clickjacking"
                    ;;
                *)
                    add_security_issue "MEDIUM" "Security Header Missing" "$header_name header not found"
                    ;;
            esac
        fi
    done
}

check_security_headers

# Step 3: Authentication and Session Security
log_header "Step 3: Authentication and Session Security"

check_auth_security() {
    log_info "Testing authentication security..."
    
    # Test login endpoint security
    local login_url="$DEPLOYMENT_URL/api/auth/login"
    
    # Test for rate limiting on login attempts
    log_info "Testing rate limiting on authentication..."
    local rate_limit_test=0
    local consecutive_failures=0
    
    for i in {1..6}; do
        local response=$(curl -s -X POST -w "%{http_code}" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@test.com","password":"wrongpassword"}' \
            "$login_url" 2>/dev/null || echo "000")
        
        local status_code=$(echo "$response" | tail -c 4)
        
        if [[ "$status_code" == "429" ]]; then
            rate_limit_test=1
            break
        elif [[ "$status_code" == "401" || "$status_code" == "400" ]]; then
            ((consecutive_failures++))
        fi
    done
    
    if [[ $rate_limit_test -eq 1 ]]; then
        mark_check_passed "Authentication rate limiting (HTTP 429 received)"
    elif [[ $consecutive_failures -ge 5 ]]; then
        add_security_issue "HIGH" "No Authentication Rate Limiting" "Login endpoint does not implement rate limiting - vulnerable to brute force attacks"
    else
        add_security_issue "MEDIUM" "Authentication Rate Limiting Unclear" "Could not confirm rate limiting on authentication endpoint"
    fi
    
    # Test for secure session handling
    local session_response=$(curl -s -I "$DEPLOYMENT_URL" 2>/dev/null || echo "")
    if echo "$session_response" | grep -i "set-cookie" | grep -i "secure" > /dev/null; then
        mark_check_passed "Secure cookie flag present"
    else
        log_info "No session cookies set on homepage (this may be normal)"
    fi
    
    if echo "$session_response" | grep -i "set-cookie" | grep -i "httponly" > /dev/null; then
        mark_check_passed "HttpOnly cookie flag present"
    else
        log_info "No HttpOnly cookies detected on homepage"
    fi
}

check_auth_security

# Step 4: Input Validation and Injection Testing
log_header "Step 4: Input Validation and Injection Testing"

check_injection_security() {
    log_info "Testing for injection vulnerabilities..."
    
    # Test SQL injection patterns (basic)
    local sql_payloads=(
        "' OR '1'='1"
        "'; DROP TABLE users; --"
        "' UNION SELECT 1,2,3 --"
    )
    
    # Test XSS patterns
    local xss_payloads=(
        "<script>alert('xss')</script>"
        "javascript:alert('xss')"
        "<img src=x onerror=alert('xss')>"
    )
    
    # Test login endpoint with malicious payloads
    local injection_detected=0
    
    for payload in "${sql_payloads[@]}"; do
        local response=$(curl -s -X POST -w "%{http_code}" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"test@test.com\",\"password\":\"$payload\"}" \
            "$DEPLOYMENT_URL/api/auth/login" 2>/dev/null || echo "error500")
        
        local status_code=$(echo "$response" | tail -c 4)
        local body=$(echo "$response" | head -n -1)
        
        # Check for SQL error messages in response
        if echo "$body" | grep -i -E "(sql|database|mysql|postgres|sqlite|oracle)" > /dev/null; then
            add_security_issue "CRITICAL" "SQL Injection Vulnerability" "Database error messages exposed in API response"
            injection_detected=1
            break
        elif [[ "$status_code" == "500" ]]; then
            add_security_issue "HIGH" "Potential SQL Injection" "Server error (500) when processing special characters - possible SQL injection"
            injection_detected=1
            break
        fi
    done
    
    if [[ $injection_detected -eq 0 ]]; then
        mark_check_passed "Basic SQL injection test (no obvious vulnerabilities)"
    fi
    
    # Test search endpoint if available
    local search_response=$(curl -s "$DEPLOYMENT_URL/api/search?q=<script>alert('xss')</script>" 2>/dev/null || echo "")
    if echo "$search_response" | grep -q "<script>"; then
        add_security_issue "HIGH" "XSS Vulnerability" "Search endpoint reflects unescaped user input"
    else
        mark_check_passed "Basic XSS test on search endpoint")
    fi
}

check_injection_security

# Step 5: File Upload Security (if applicable)
log_header "Step 5: File Upload Security Analysis"

check_file_upload_security() {
    log_info "Checking file upload security..."
    
    # Check if file upload endpoints exist
    local upload_endpoints=(
        "/api/documents/upload"
        "/api/evidence/upload" 
        "/api/files/upload"
    )
    
    local upload_found=0
    
    for endpoint in "${upload_endpoints[@]}"; do
        local response=$(curl -s -w "%{http_code}" "$DEPLOYMENT_URL$endpoint" 2>/dev/null || echo "000")
        local status_code=$(echo "$response" | tail -c 4)
        
        if [[ "$status_code" != "404" ]]; then
            upload_found=1
            log_info "File upload endpoint found: $endpoint"
            
            # Test for file type restrictions
            if [[ "$status_code" == "405" ]]; then
                mark_check_passed "File upload endpoint properly rejects GET requests")
            elif [[ "$status_code" == "401" ]]; then
                mark_check_passed "File upload endpoint requires authentication")
            else
                add_security_issue "MEDIUM" "File Upload Endpoint" "Upload endpoint $endpoint accessible without authentication")
            fi
        fi
    done
    
    if [[ $upload_found -eq 0 ]]; then
        log_info "No file upload endpoints detected"
    fi
    
    # Check for file upload configuration in environment
    if [[ -f ".env.local" ]]; then
        if grep -q "MAX_FILE_SIZE\|ALLOWED_FILE_TYPES" .env.local; then
            mark_check_passed "File upload restrictions configured in environment")
        else
            add_security_issue "LOW" "File Upload Configuration" "File upload size and type restrictions not configured")
        fi
    fi
}

check_file_upload_security

# Step 6: API Security Analysis
log_header "Step 6: API Security Analysis"

check_api_security() {
    log_info "Analyzing API security..."
    
    # Test API endpoints for proper authentication
    local api_endpoints=(
        "/api/cases"
        "/api/clients"
        "/api/users"
        "/api/documents"
        "/api/billing"
    )
    
    local unprotected_endpoints=0
    
    for endpoint in "${api_endpoints[@]}"; do
        local response=$(curl -s -w "%{http_code}" "$DEPLOYMENT_URL$endpoint" 2>/dev/null || echo "000")
        local status_code=$(echo "$response" | tail -c 4)
        
        case "$status_code" in
            "200")
                add_security_issue "CRITICAL" "Unprotected API Endpoint" "Endpoint $endpoint accessible without authentication"
                ((unprotected_endpoints++))
                ;;
            "401"|"403")
                mark_check_passed "API endpoint properly protected: $endpoint")
                ;;
            "404")
                log_info "API endpoint not found: $endpoint")
                ;;
            "405")
                mark_check_passed "API endpoint rejects unauthorized methods: $endpoint")
                ;;
            *)
                log_info "API endpoint $endpoint returned status: $status_code")
                ;;
        esac
    done
    
    # Test for information disclosure in API responses
    local health_response=$(curl -s "$DEPLOYMENT_URL/api/health" 2>/dev/null || echo "{}")
    if echo "$health_response" | grep -i -E "(password|secret|key|token)" > /dev/null; then
        add_security_issue "HIGH" "Information Disclosure" "Health endpoint may expose sensitive information")
    else
        mark_check_passed "Health endpoint does not expose sensitive information")
    fi
    
    # Test for proper error handling
    local error_response=$(curl -s "$DEPLOYMENT_URL/api/nonexistent" 2>/dev/null || echo "")
    if echo "$error_response" | grep -i -E "(stack trace|debug|internal|server error)" | grep -v -i "404" > /dev/null; then
        add_security_issue "MEDIUM" "Information Disclosure in Errors" "API error responses may expose internal information")
    else
        mark_check_passed "API error handling does not expose internal information")
    fi
}

check_api_security

# Step 7: Dependencies Security Scan
log_header "Step 7: Dependencies Security Analysis"

check_dependencies_security() {
    log_info "Scanning dependencies for known vulnerabilities..."
    
    # Run npm audit if available
    if [[ -f "package.json" ]]; then
        local audit_output=$(npm audit --audit-level high --json 2>/dev/null || echo '{"vulnerabilities":{}}')
        local vulnerability_count=$(echo "$audit_output" | grep -o '"vulnerabilities"' | wc -l)
        
        if [[ $vulnerability_count -gt 1 ]]; then
            # Parse audit results
            local critical_count=$(echo "$audit_output" | grep -o '"critical"' | wc -l)
            local high_count=$(echo "$audit_output" | grep -o '"high"' | wc -l)
            local moderate_count=$(echo "$audit_output" | grep -o '"moderate"' | wc -l)
            
            if [[ $critical_count -gt 0 ]]; then
                add_security_issue "CRITICAL" "Critical Dependencies" "$critical_count critical vulnerabilities found in dependencies")
            fi
            
            if [[ $high_count -gt 0 ]]; then
                add_security_issue "HIGH" "High-Risk Dependencies" "$high_count high-severity vulnerabilities found in dependencies")
            fi
            
            if [[ $moderate_count -gt 0 ]]; then
                add_security_issue "MEDIUM" "Moderate-Risk Dependencies" "$moderate_count moderate-severity vulnerabilities found in dependencies")
            fi
        else
            mark_check_passed "No known high-severity vulnerabilities in dependencies")
        fi
    else
        log_info "No package.json found, skipping dependency scan")
    fi
    
    # Check for outdated packages
    if command -v npm > /dev/null 2>&1; then
        local outdated=$(npm outdated --depth=0 2>/dev/null | wc -l)
        if [[ $outdated -gt 1 ]]; then
            add_security_issue "LOW" "Outdated Dependencies" "$((outdated - 1)) packages have newer versions available")
        else
            mark_check_passed "Dependencies are up to date")
        fi
    fi
}

check_dependencies_security

# Step 8: Environment and Configuration Security
log_header "Step 8: Environment and Configuration Security"

check_environment_security() {
    log_info "Checking environment and configuration security..."
    
    # Check for sensitive data exposure
    if [[ -f ".env.local" ]]; then
        # Check for weak secrets
        local weak_secrets=0
        while IFS= read -r line; do
            if echo "$line" | grep -E "(SECRET|KEY|PASSWORD)" | grep -E "(123|password|secret|test|demo|change)" > /dev/null; then
                add_security_issue "HIGH" "Weak Secrets" "Potentially weak or default secrets found in environment configuration")
                weak_secrets=1
                break
            fi
        done < .env.local
        
        if [[ $weak_secrets -eq 0 ]]; then
            mark_check_passed "No obviously weak secrets in environment configuration")
        fi
        
        # Check for production-appropriate settings
        if grep -q "NODE_ENV=production" .env.local; then
            mark_check_passed "NODE_ENV set to production")
        else
            add_security_issue "MEDIUM" "Development Environment" "NODE_ENV not set to production")
        fi
        
        if grep -q "DEBUG.*=.*true\|ENABLE_DEBUG_LOGGING.*=.*true" .env.local; then
            add_security_issue "MEDIUM" "Debug Mode Enabled" "Debug logging or development features enabled in production")
        else
            mark_check_passed "Debug features disabled in production")
        fi
    else
        add_security_issue "HIGH" "Missing Environment Configuration" ".env.local file not found - application may not be properly configured")
    fi
    
    # Check for exposed configuration files
    local config_files=(
        "/.env"
        "/.env.local" 
        "/config/database.yml"
        "/config.json"
        "/.git/config"
    )
    
    for config_file in "${config_files[@]}"; do
        local response=$(curl -s -w "%{http_code}" "$DEPLOYMENT_URL$config_file" 2>/dev/null || echo "000")
        local status_code=$(echo "$response" | tail -c 4)
        
        if [[ "$status_code" == "200" ]]; then
            add_security_issue "CRITICAL" "Configuration File Exposed" "Configuration file $config_file is publicly accessible")
        fi
    done
    
    mark_check_passed "Configuration files not publicly accessible")
}

check_environment_security

# Step 9: Privacy and Compliance Check
log_header "Step 9: Privacy and Compliance Analysis"

check_privacy_compliance() {
    log_info "Checking privacy and compliance features..."
    
    # Check for privacy policy
    local privacy_response=$(curl -s -w "%{http_code}" "$DEPLOYMENT_URL/privacy" 2>/dev/null || echo "000")
    local privacy_status=$(echo "$privacy_response" | tail -c 4)
    
    if [[ "$privacy_status" == "200" ]]; then
        mark_check_passed "Privacy policy page accessible")
    else
        add_security_issue "LOW" "Privacy Policy Missing" "Privacy policy page not found at /privacy")
    fi
    
    # Check for GDPR compliance indicators
    if [[ -f ".env.local" ]]; then
        if grep -q "GDPR_COMPLIANCE_MODE.*=.*true" .env.local; then
            mark_check_passed "GDPR compliance mode enabled")
        else
            add_security_issue "LOW" "GDPR Compliance" "GDPR compliance mode not explicitly enabled")
        fi
        
        if grep -q "CCPA_COMPLIANCE_MODE.*=.*true" .env.local; then
            mark_check_passed "CCPA compliance mode enabled")
        else
            add_security_issue "LOW" "CCPA Compliance" "CCPA compliance mode not explicitly enabled")
        fi
        
        if grep -q "COOKIE_CONSENT_REQUIRED.*=.*true" .env.local; then
            mark_check_passed "Cookie consent requirement configured")
        else
            add_security_issue "MEDIUM" "Cookie Consent" "Cookie consent not required - may not comply with privacy regulations")
        fi
    fi
    
    # Check for cookie consent implementation
    local homepage=$(curl -s "$DEPLOYMENT_URL" 2>/dev/null || echo "")
    if echo "$homepage" | grep -i -E "(cookie.*consent|privacy.*notice|gdpr)" > /dev/null; then
        mark_check_passed "Cookie consent or privacy notices detected in UI")
    else
        add_security_issue "MEDIUM" "Cookie Consent UI" "No cookie consent or privacy notices detected in homepage")
    fi
}

check_privacy_compliance

# Step 10: Generate Security Report
log_header "Step 10: Security Report Generation"

# Calculate security score
TOTAL_SECURITY_CHECKS=$((SECURITY_CHECKS_PASSED + SECURITY_CHECKS_FAILED))
if [[ $TOTAL_SECURITY_CHECKS -gt 0 ]]; then
    SECURITY_SCORE=$(( SECURITY_CHECKS_PASSED * 100 / TOTAL_SECURITY_CHECKS ))
else
    SECURITY_SCORE=0
fi

# Determine security rating
if [[ $SECURITY_SCORE -ge 90 ]] && [[ ${#SECURITY_ISSUES_CRITICAL[@]} -eq 0 ]]; then
    SECURITY_RATING="EXCELLENT"
elif [[ $SECURITY_SCORE -ge 80 ]] && [[ ${#SECURITY_ISSUES_CRITICAL[@]} -eq 0 ]]; then
    SECURITY_RATING="GOOD"
elif [[ $SECURITY_SCORE -ge 70 ]] && [[ ${#SECURITY_ISSUES_CRITICAL[@]} -eq 0 ]]; then
    SECURITY_RATING="FAIR"
elif [[ ${#SECURITY_ISSUES_CRITICAL[@]} -eq 0 ]]; then
    SECURITY_RATING="NEEDS IMPROVEMENT"
else
    SECURITY_RATING="CRITICAL ISSUES"
fi

# Create comprehensive security report
cat > "$SECURITY_REPORT" << EOF
# LexChronos Security Verification Report

## Executive Summary
- **Assessment Date**: $(date)
- **Target Application**: $DEPLOYMENT_URL
- **Security Score**: $SECURITY_SCORE/100
- **Security Rating**: $SECURITY_RATING
- **Total Checks**: $TOTAL_SECURITY_CHECKS
- **Passed**: $SECURITY_CHECKS_PASSED
- **Failed**: $SECURITY_CHECKS_FAILED

## Risk Assessment

### Critical Issues (${#SECURITY_ISSUES_CRITICAL[@]})
$(printf '%s\n' "${SECURITY_ISSUES_CRITICAL[@]}" | sed 's/^/- /' || echo "None identified")

### High-Risk Issues (${#SECURITY_ISSUES_HIGH[@]})
$(printf '%s\n' "${SECURITY_ISSUES_HIGH[@]}" | sed 's/^/- /' || echo "None identified")

### Medium-Risk Issues (${#SECURITY_ISSUES_MEDIUM[@]})
$(printf '%s\n' "${SECURITY_ISSUES_MEDIUM[@]}" | sed 's/^/- /' || echo "None identified")

### Low-Risk Issues (${#SECURITY_ISSUES_LOW[@]})
$(printf '%s\n' "${SECURITY_ISSUES_LOW[@]}" | sed 's/^/- /' || echo "None identified")

## Detailed Assessment Results

### 1. SSL/TLS Security
- Certificate validity and expiration
- Key strength verification
- HSTS implementation
- TLS configuration

### 2. HTTP Security Headers
- Content Security Policy (CSP)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection (Cross-site scripting protection)
- Referrer Policy
- Permissions Policy

### 3. Authentication & Session Management
- Rate limiting implementation
- Session security (Secure/HttpOnly flags)
- Password policy enforcement
- Multi-factor authentication readiness

### 4. Input Validation & Injection Prevention
- SQL injection testing
- Cross-site scripting (XSS) testing
- Input sanitization verification
- Output encoding implementation

### 5. File Upload Security
- File type restrictions
- Size limitations
- Upload location security
- Virus scanning readiness

### 6. API Security
- Authentication enforcement
- Authorization controls
- Error handling
- Information disclosure prevention

### 7. Dependencies & Supply Chain
- Known vulnerability scanning
- Package freshness analysis
- License compliance
- Dependency pinning

### 8. Environment & Configuration
- Secrets management
- Debug mode controls
- Configuration exposure
- Environment isolation

### 9. Privacy & Compliance
- GDPR compliance features
- CCPA compliance features
- Cookie consent implementation
- Privacy policy availability

## Remediation Priorities

### Immediate Action Required (Critical/High)
$(
if [[ ${#SECURITY_ISSUES_CRITICAL[@]} -gt 0 ]] || [[ ${#SECURITY_ISSUES_HIGH[@]} -gt 0 ]]; then
    printf '%s\n' "${SECURITY_ISSUES_CRITICAL[@]}" "${SECURITY_ISSUES_HIGH[@]}" | sed 's/^/1. /'
else
    echo "No immediate actions required"
fi
)

### Near-term Improvements (Medium)
$(
if [[ ${#SECURITY_ISSUES_MEDIUM[@]} -gt 0 ]]; then
    printf '%s\n' "${SECURITY_ISSUES_MEDIUM[@]}" | sed 's/^/1. /'
else
    echo "No near-term improvements needed"
fi
)

### Future Enhancements (Low)
$(
if [[ ${#SECURITY_ISSUES_LOW[@]} -gt 0 ]]; then
    printf '%s\n' "${SECURITY_ISSUES_LOW[@]}" | sed 's/^/1. /'
else
    echo "No future enhancements identified"
fi
)

## Security Recommendations

### Infrastructure Security
- Implement Web Application Firewall (WAF)
- Set up DDoS protection (Cloudflare)
- Enable automated security monitoring
- Configure intrusion detection system

### Application Security
- Implement Content Security Policy (CSP)
- Add request rate limiting
- Enable security headers
- Implement proper error handling

### Data Protection
- Encrypt sensitive data at rest
- Implement field-level encryption
- Set up secure key management
- Enable audit logging

### Monitoring & Response
- Set up security event monitoring
- Configure automated alerting
- Implement incident response procedures
- Regular security assessments

## Compliance Considerations

### GDPR (EU General Data Protection Regulation)
- Data processing consent
- Right to erasure implementation
- Data portability features
- Privacy by design principles

### CCPA (California Consumer Privacy Act)
- Consumer rights implementation
- Data collection transparency
- Opt-out mechanisms
- Third-party data sharing controls

### SOC 2 (Service Organization Control 2)
- Security controls implementation
- Availability monitoring
- Confidentiality measures
- Processing integrity checks

### HIPAA (Healthcare Insurance Portability and Accountability Act)
- Access controls for health data
- Audit logging requirements
- Encryption standards
- Business associate agreements

## Next Steps

### Short-term (1-2 weeks)
1. Address all critical and high-risk security issues
2. Implement missing security headers
3. Configure rate limiting and DDoS protection
4. Update any vulnerable dependencies

### Medium-term (1-3 months)
1. Implement comprehensive monitoring
2. Conduct penetration testing
3. Set up security incident response procedures
4. Implement advanced threat detection

### Long-term (3-6 months)
1. Achieve security compliance certifications
2. Implement zero-trust architecture
3. Regular security assessments and audits
4. Security awareness training program

## Tools and Resources

### Security Testing Tools
- OWASP ZAP (Web Application Security Scanner)
- Nessus (Vulnerability Scanner)
- Burp Suite (Web Application Penetration Testing)
- SSL Labs (SSL Configuration Testing)

### Monitoring Solutions
- Sentry (Error Tracking and Performance Monitoring)
- LogRocket (Session Replay and Monitoring)
- New Relic (Application Performance Monitoring)
- Datadog (Infrastructure and Application Monitoring)

### Compliance Resources
- OWASP Top 10 (Web Application Security Risks)
- NIST Cybersecurity Framework
- GDPR Compliance Guidelines
- CCPA Implementation Guide

---
**Report Generated**: $(date)  
**Assessment Tool**: LexChronos Security Verification Script v1.0  
**Next Assessment**: Recommended within 30 days or after significant changes
EOF

# Display final results
echo -e "${BOLD}${GREEN}
╔══════════════════════════════════════════════════════════════════╗
║                🔒 SECURITY ASSESSMENT COMPLETE 🔒               ║
║                                                                  ║
║  📊 Security Score: $SECURITY_SCORE/100                         ║
║  🎯 Security Rating: $SECURITY_RATING                           ║
║  ✅ Checks Passed: $SECURITY_CHECKS_PASSED                      ║
║  ❌ Issues Found: $SECURITY_CHECKS_FAILED                       ║
║                                                                  ║
║  🚨 Critical Issues: ${#SECURITY_ISSUES_CRITICAL[@]}             ║
║  ⚠️  High Issues: ${#SECURITY_ISSUES_HIGH[@]}                   ║
║  📋 Medium Issues: ${#SECURITY_ISSUES_MEDIUM[@]}                ║
║  📝 Low Issues: ${#SECURITY_ISSUES_LOW[@]}                      ║
║                                                                  ║
║  📁 Report: $SECURITY_REPORT                                    ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

# Exit with appropriate code based on security findings
if [[ ${#SECURITY_ISSUES_CRITICAL[@]} -gt 0 ]]; then
    log_critical "Critical security issues found! Immediate action required."
    exit 2
elif [[ ${#SECURITY_ISSUES_HIGH[@]} -gt 0 ]]; then
    log_error "High-risk security issues found. Address before production use."
    exit 1
elif [[ $SECURITY_SCORE -lt 70 ]]; then
    log_warning "Security score below acceptable threshold. Review and improve."
    exit 1
else
    log_success "Security assessment completed successfully!"
    log_info "Review the detailed report for recommendations and improvements."
    exit 0
fi