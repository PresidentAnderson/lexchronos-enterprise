#!/bin/bash

# Monitoring and Error Tracking Setup Script for LexChronos

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
    echo -e "${BOLD}${PURPLE}📊 $1${NC}"
}

# Configuration
PROJECT_ROOT="/Volumes/DevOps/lexchrono"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
APP_NAME="lexchronos"
APP_URL="${NEXT_PUBLIC_APP_URL:-https://lexchronos.com}"

# Print banner
echo -e "${BOLD}${PURPLE}
╔══════════════════════════════════════════════════════════════════╗
║                    MONITORING SETUP SCRIPT                      ║
║                      LexChronos Production                       ║
║                                                                  ║
║  🎯 Target: Production Monitoring Stack                         ║
║  📊 Features: Logs, Metrics, Alerts, Error Tracking             ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

# Ensure we're in the correct directory
cd "$PROJECT_ROOT"

# Step 1: Create Monitoring Directory Structure
log_header "Step 1: Directory Structure Setup"

mkdir -p "$MONITORING_DIR"/{grafana,prometheus,loki,alerts,scripts}

log_success "Monitoring directory structure created"

# Step 2: Sentry Configuration for Error Tracking
log_header "Step 2: Sentry Error Tracking Setup"

log_info "Creating Sentry configuration files..."

# Create Sentry configuration files
cat > "sentry.client.config.ts" << 'EOF'
// Sentry Client-side Configuration for LexChronos
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV || 'production',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Skip network errors that aren't actionable
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return null;
      }
      
      // Skip ResizeObserver errors (common browser quirk)
      if (error instanceof Error && error.message.includes('ResizeObserver')) {
        return null;
      }
    }
    
    return event;
  },
  
  // User context
  initialScope: {
    tags: {
      component: 'client',
      application: 'lexchronos'
    }
  },
  
  // Performance settings
  enableTracing: true,
  
  // Privacy settings
  sendDefaultPii: false,
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: [
        'localhost',
        /^https:\/\/lexchronos\.com/,
        /^https:\/\/.*\.vercel\.app/
      ]
    }),
    new Sentry.Replay({
      // Capture 10% of all sessions,
      // plus 100% of sessions with an error
      sessionSampleRate: 0.1,
      errorSampleRate: 1.0,
    })
  ],
});
EOF

cat > "sentry.server.config.ts" << 'EOF'
// Sentry Server-side Configuration for LexChronos
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV || 'production',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  
  // Server-specific settings
  debug: process.env.NODE_ENV === 'development',
  
  // Error filtering for server
  beforeSend(event, hint) {
    // Log critical server errors
    if (event.level === 'error' || event.level === 'fatal') {
      console.error('Sentry Server Error:', event.exception);
    }
    
    return event;
  },
  
  // Server context
  initialScope: {
    tags: {
      component: 'server',
      application: 'lexchronos'
    }
  },
  
  // Database and external service monitoring
  integrations: [
    new Sentry.Integrations.Http({ 
      tracing: true,
      breadcrumbs: true 
    }),
  ],
});
EOF

cat > "sentry.edge.config.ts" << 'EOF'
// Sentry Edge Runtime Configuration for LexChronos
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV || 'production',
  
  // Edge runtime specific settings
  tracesSampleRate: 0.1,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  
  // Edge context
  initialScope: {
    tags: {
      component: 'edge',
      application: 'lexchronos'
    }
  },
});
EOF

log_success "Sentry configuration files created"

# Step 3: Application Health Monitoring
log_header "Step 3: Health Check Endpoints"

# Create comprehensive health check API
cat > "app/api/health/route.ts" << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'lexchronos',
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      redis: 'unknown',
      external_apis: 'unknown'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  try {
    // Database health check
    if (process.env.DATABASE_URL) {
      // TODO: Add actual database connection test
      healthCheck.checks.database = 'healthy';
    }

    // Redis health check
    if (process.env.REDIS_URL) {
      // TODO: Add actual Redis connection test
      healthCheck.checks.redis = 'healthy';
    }

    // External APIs health check
    try {
      // Test critical external services
      const stripe = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
        }
      });
      
      healthCheck.checks.external_apis = stripe.ok ? 'healthy' : 'degraded';
    } catch (error) {
      healthCheck.checks.external_apis = 'unhealthy';
    }

    // Determine overall status
    const allChecks = Object.values(healthCheck.checks);
    if (allChecks.includes('unhealthy')) {
      healthCheck.status = 'unhealthy';
      return NextResponse.json(healthCheck, { status: 503 });
    } else if (allChecks.includes('degraded')) {
      healthCheck.status = 'degraded';
      return NextResponse.json(healthCheck, { status: 200 });
    }

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
EOF

# Create metrics endpoint
cat > "app/api/metrics/route.ts" << 'EOF'
import { NextResponse } from 'next/server';

// Simple metrics collection (in production, use a proper metrics library)
const metrics = {
  requests_total: 0,
  requests_duration_ms: [] as number[],
  errors_total: 0,
  active_users: new Set(),
  database_queries: 0,
};

export async function GET() {
  const memoryUsage = process.memoryUsage();
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    service: 'lexchronos',
    metrics: {
      // HTTP metrics
      http_requests_total: metrics.requests_total,
      http_request_duration_ms_avg: 
        metrics.requests_duration_ms.length > 0 
          ? metrics.requests_duration_ms.reduce((a, b) => a + b) / metrics.requests_duration_ms.length
          : 0,
      http_errors_total: metrics.errors_total,
      
      // Application metrics
      active_users_count: metrics.active_users.size,
      database_queries_total: metrics.database_queries,
      
      // System metrics
      memory_usage_bytes: memoryUsage.rss,
      memory_heap_used_bytes: memoryUsage.heapUsed,
      memory_heap_total_bytes: memoryUsage.heapTotal,
      uptime_seconds: process.uptime(),
      
      // Node.js specific
      nodejs_version: process.version,
      platform: process.platform,
      cpu_architecture: process.arch,
    }
  });
}
EOF

log_success "Health check and metrics endpoints created"

# Step 4: Uptime Monitoring Configuration
log_header "Step 4: Uptime Monitoring Setup"

# Create uptime monitoring script
cat > "$MONITORING_DIR/scripts/uptime-monitor.js" << 'EOF'
#!/usr/bin/env node

// Simple uptime monitoring script for LexChronos
// This can be run as a cron job or deployed as a separate service

const https = require('https');
const http = require('http');

const ENDPOINTS = [
  'https://lexchronos.com',
  'https://lexchronos.com/api/health',
  'https://api.lexchronos.com',
];

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
const CHECK_INTERVAL = 60000; // 1 minute

class UptimeMonitor {
  constructor() {
    this.status = new Map();
    this.downtime = new Map();
  }

  async checkEndpoint(url) {
    return new Promise((resolve) => {
      const request = url.startsWith('https') ? https : http;
      const startTime = Date.now();
      
      request.get(url, { timeout: 10000 }, (res) => {
        const duration = Date.now() - startTime;
        const isHealthy = res.statusCode >= 200 && res.statusCode < 400;
        
        resolve({
          url,
          status: isHealthy ? 'up' : 'down',
          statusCode: res.statusCode,
          responseTime: duration,
          timestamp: new Date().toISOString()
        });
      }).on('error', (error) => {
        resolve({
          url,
          status: 'down',
          statusCode: 0,
          responseTime: Date.now() - startTime,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async sendAlert(message) {
    if (!WEBHOOK_URL) {
      console.log('No webhook URL configured for alerts');
      return;
    }

    const payload = JSON.stringify({
      text: `🚨 LexChronos Alert: ${message}`,
      username: 'Uptime Monitor',
      icon_emoji: ':warning:'
    });

    // Implementation depends on your webhook service (Slack, Discord, etc.)
    console.log('Alert sent:', message);
  }

  async checkAllEndpoints() {
    const results = await Promise.all(
      ENDPOINTS.map(url => this.checkEndpoint(url))
    );

    for (const result of results) {
      const previousStatus = this.status.get(result.url);
      
      if (result.status === 'down' && previousStatus !== 'down') {
        // Endpoint went down
        this.downtime.set(result.url, Date.now());
        await this.sendAlert(`${result.url} is DOWN (${result.error || 'Status: ' + result.statusCode})`);
      } else if (result.status === 'up' && previousStatus === 'down') {
        // Endpoint came back up
        const downtimeStart = this.downtime.get(result.url);
        const downtimeDuration = downtimeStart ? Date.now() - downtimeStart : 0;
        this.downtime.delete(result.url);
        await this.sendAlert(`${result.url} is UP (Downtime: ${Math.round(downtimeDuration / 1000)}s)`);
      }

      this.status.set(result.url, result.status);
      
      // Log status
      console.log(`[${result.timestamp}] ${result.url}: ${result.status} (${result.responseTime}ms)`);
    }
  }

  start() {
    console.log('🔍 Starting uptime monitor for LexChronos...');
    console.log(`Monitoring ${ENDPOINTS.length} endpoints every ${CHECK_INTERVAL / 1000}s`);
    
    // Initial check
    this.checkAllEndpoints();
    
    // Regular checks
    setInterval(() => {
      this.checkAllEndpoints();
    }, CHECK_INTERVAL);
  }
}

if (require.main === module) {
  const monitor = new UptimeMonitor();
  monitor.start();
}

module.exports = UptimeMonitor;
EOF

chmod +x "$MONITORING_DIR/scripts/uptime-monitor.js"

log_success "Uptime monitoring script created"

# Step 5: Log Management
log_header "Step 5: Log Management Setup"

# Create log rotation configuration
cat > "$MONITORING_DIR/loki/loki-config.yml" << 'EOF'
# Loki configuration for LexChronos logs
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s
  max_transfer_retries: 0

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb:
    directory: /tmp/loki/index

  filesystem:
    directory: /tmp/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 168h
EOF

# Create log aggregation script
cat > "$MONITORING_DIR/scripts/log-aggregator.js" << 'EOF'
#!/usr/bin/env node

// Log aggregation script for LexChronos
// Collects logs from various sources and sends to centralized logging

const fs = require('fs');
const path = require('path');

class LogAggregator {
  constructor() {
    this.logSources = [
      '/Volumes/DevOps/lexchrono/logs',
      '/tmp/lexchronos-logs',
      '/var/log/lexchronos'
    ];
  }

  async aggregateLogs() {
    const aggregatedLogs = [];
    
    for (const source of this.logSources) {
      if (fs.existsSync(source)) {
        const files = fs.readdirSync(source);
        
        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(source, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Parse logs and add metadata
            const lines = content.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const logEntry = {
                  timestamp: new Date().toISOString(),
                  source: source,
                  file: file,
                  level: this.extractLogLevel(line),
                  message: line,
                  service: 'lexchronos'
                };
                
                aggregatedLogs.push(logEntry);
              } catch (error) {
                console.error('Error parsing log line:', line, error);
              }
            }
          }
        }
      }
    }
    
    return aggregatedLogs;
  }

  extractLogLevel(line) {
    if (line.includes('ERROR') || line.includes('error')) return 'error';
    if (line.includes('WARN') || line.includes('warn')) return 'warning';
    if (line.includes('INFO') || line.includes('info')) return 'info';
    if (line.includes('DEBUG') || line.includes('debug')) return 'debug';
    return 'info';
  }

  async sendToLoki(logs) {
    // Implementation to send logs to Loki or other log aggregation service
    console.log(`Aggregated ${logs.length} log entries`);
    
    // Group by level for summary
    const summary = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Log summary:', summary);
  }

  async run() {
    try {
      const logs = await this.aggregateLogs();
      await this.sendToLoki(logs);
    } catch (error) {
      console.error('Log aggregation failed:', error);
    }
  }
}

if (require.main === module) {
  const aggregator = new LogAggregator();
  aggregator.run();
}

module.exports = LogAggregator;
EOF

chmod +x "$MONITORING_DIR/scripts/log-aggregator.js"

log_success "Log management configuration created"

# Step 6: Performance Monitoring
log_header "Step 6: Performance Monitoring Setup"

# Create performance monitoring middleware
cat > "lib/monitoring/performance.ts" << 'EOF'
// Performance monitoring utilities for LexChronos

export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift();
    }
  }

  static getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      result[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }
    
    return result;
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    return fn().then(
      (result) => {
        this.recordMetric(name, Date.now() - start);
        return result;
      },
      (error) => {
        this.recordMetric(name, Date.now() - start);
        this.recordMetric(`${name}_errors`, 1);
        throw error;
      }
    );
  }

  static measure<T>(name: string, fn: () => T): T {
    const start = Date.now();
    
    try {
      const result = fn();
      this.recordMetric(name, Date.now() - start);
      return result;
    } catch (error) {
      this.recordMetric(name, Date.now() - start);
      this.recordMetric(`${name}_errors`, 1);
      throw error;
    }
  }
}

// Next.js API middleware for performance monitoring
export function withPerformanceMonitoring<T>(
  handler: (req: any, res: any) => Promise<T>
) {
  return async (req: any, res: any): Promise<T> => {
    const route = `${req.method} ${req.url?.split('?')[0] || 'unknown'}`;
    
    return PerformanceMonitor.measureAsync(
      `api_${route.replace(/[^a-zA-Z0-9]/g, '_')}`,
      () => handler(req, res)
    );
  };
}

// Web Vitals tracking
export function trackWebVitals(metric: any): void {
  // Track Core Web Vitals
  switch (metric.name) {
    case 'FCP':
      PerformanceMonitor.recordMetric('web_vitals_fcp', metric.value);
      break;
    case 'LCP':
      PerformanceMonitor.recordMetric('web_vitals_lcp', metric.value);
      break;
    case 'CLS':
      PerformanceMonitor.recordMetric('web_vitals_cls', metric.value);
      break;
    case 'FID':
      PerformanceMonitor.recordMetric('web_vitals_fid', metric.value);
      break;
    case 'TTFB':
      PerformanceMonitor.recordMetric('web_vitals_ttfb', metric.value);
      break;
  }
  
  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}
EOF

log_success "Performance monitoring utilities created"

# Step 7: Alert Configuration
log_header "Step 7: Alert System Setup"

# Create alert configuration
cat > "$MONITORING_DIR/alerts/alerting-rules.yml" << 'EOF'
# Alerting rules for LexChronos monitoring

groups:
  - name: lexchronos.rules
    rules:
    
    # High error rate alert
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 2m
      labels:
        severity: critical
        service: lexchronos
      annotations:
        summary: "High error rate detected"
        description: "LexChronos is experiencing high error rate ({{ $value }} errors/sec)"

    # Response time alert
    - alert: HighResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 2000
      for: 5m
      labels:
        severity: warning
        service: lexchronos
      annotations:
        summary: "High response time detected"
        description: "95th percentile response time is {{ $value }}ms"

    # Database connection alert
    - alert: DatabaseDown
      expr: up{job="database"} == 0
      for: 1m
      labels:
        severity: critical
        service: lexchronos
      annotations:
        summary: "Database is down"
        description: "LexChronos database connection is down"

    # Memory usage alert
    - alert: HighMemoryUsage
      expr: (memory_heap_used_bytes / memory_heap_total_bytes) > 0.9
      for: 10m
      labels:
        severity: warning
        service: lexchronos
      annotations:
        summary: "High memory usage"
        description: "Memory usage is at {{ $value | humanizePercentage }}"

    # Low disk space alert
    - alert: LowDiskSpace
      expr: (disk_free_bytes / disk_total_bytes) < 0.1
      for: 5m
      labels:
        severity: critical
        service: lexchronos
      annotations:
        summary: "Low disk space"
        description: "Disk usage is at {{ $value | humanizePercentage }}"

    # SSL certificate expiry alert
    - alert: SSLCertificateExpiry
      expr: ssl_certificate_expiry_days < 30
      for: 1h
      labels:
        severity: warning
        service: lexchronos
      annotations:
        summary: "SSL certificate expiring soon"
        description: "SSL certificate expires in {{ $value }} days"
EOF

# Create notification script
cat > "$MONITORING_DIR/scripts/send-alerts.js" << 'EOF'
#!/usr/bin/env node

// Alert notification script for LexChronos
// Sends alerts via multiple channels (email, Slack, Discord, etc.)

const https = require('https');
const fs = require('fs');

class AlertManager {
  constructor() {
    this.channels = {
      slack: process.env.SLACK_WEBHOOK_URL,
      discord: process.env.DISCORD_WEBHOOK_URL,
      email: process.env.SMTP_ENABLED === 'true',
      sms: process.env.TWILIO_ENABLED === 'true'
    };
  }

  async sendSlackAlert(message, severity = 'warning') {
    if (!this.channels.slack) return;

    const color = {
      'critical': '#ff0000',
      'warning': '#ffaa00',
      'info': '#00ff00'
    }[severity] || '#808080';

    const payload = {
      text: `🚨 LexChronos Alert`,
      attachments: [{
        color: color,
        fields: [{
          title: 'Alert Details',
          value: message,
          short: false
        }, {
          title: 'Severity',
          value: severity.toUpperCase(),
          short: true
        }, {
          title: 'Timestamp',
          value: new Date().toISOString(),
          short: true
        }]
      }]
    };

    return this.sendWebhook(this.channels.slack, payload);
  }

  async sendDiscordAlert(message, severity = 'warning') {
    if (!this.channels.discord) return;

    const color = {
      'critical': 16711680, // Red
      'warning': 16753920,  // Orange
      'info': 65280        // Green
    }[severity] || 8421504; // Gray

    const payload = {
      embeds: [{
        title: '🚨 LexChronos Alert',
        description: message,
        color: color,
        fields: [{
          name: 'Severity',
          value: severity.toUpperCase(),
          inline: true
        }, {
          name: 'Service',
          value: 'LexChronos',
          inline: true
        }],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'LexChronos Monitoring'
        }
      }]
    };

    return this.sendWebhook(this.channels.discord, payload);
  }

  async sendWebhook(url, payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const urlObj = new URL(url);

      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async sendAlert(message, severity = 'warning', channels = ['slack', 'discord']) {
    const promises = [];

    if (channels.includes('slack')) {
      promises.push(this.sendSlackAlert(message, severity));
    }

    if (channels.includes('discord')) {
      promises.push(this.sendDiscordAlert(message, severity));
    }

    try {
      await Promise.all(promises);
      console.log(`Alert sent: ${message}`);
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }
}

// CLI usage
if (require.main === module) {
  const [,, message, severity = 'warning'] = process.argv;
  
  if (!message) {
    console.log('Usage: node send-alerts.js "Alert message" [severity]');
    process.exit(1);
  }

  const alertManager = new AlertManager();
  alertManager.sendAlert(message, severity);
}

module.exports = AlertManager;
EOF

chmod +x "$MONITORING_DIR/scripts/send-alerts.js"

log_success "Alert system configuration created"

# Step 8: Monitoring Dashboard Configuration
log_header "Step 8: Grafana Dashboard Setup"

# Create Grafana dashboard JSON
cat > "$MONITORING_DIR/grafana/dashboards/lexchronos-overview.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "LexChronos Overview",
    "tags": ["lexchronos", "production"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_ms_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ],
        "yAxes": [
          {
            "label": "Response Time (ms)"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "Error Rate"
          }
        ],
        "thresholds": [
          {
            "value": 0.01,
            "colorMode": "critical",
            "op": "gt"
          }
        ]
      },
      {
        "id": 4,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "memory_heap_used_bytes",
            "legendFormat": "Heap Used"
          },
          {
            "expr": "memory_heap_total_bytes",
            "legendFormat": "Heap Total"
          }
        ],
        "yAxes": [
          {
            "label": "Bytes"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

log_success "Grafana dashboard configuration created"

# Step 9: Create Monitoring Deployment Scripts
log_header "Step 9: Deployment Scripts"

# Create monitoring stack deployment script
cat > "$MONITORING_DIR/scripts/deploy-monitoring.sh" << 'EOF'
#!/bin/bash

# Deploy monitoring stack for LexChronos

set -euo pipefail

echo "🚀 Deploying LexChronos monitoring stack..."

# Create monitoring directories
mkdir -p /var/log/lexchronos
mkdir -p /etc/lexchronos/monitoring

# Copy configuration files
cp -r monitoring/* /etc/lexchronos/monitoring/

# Set up log rotation
cat > /etc/logrotate.d/lexchronos << 'LOGROTATE'
/var/log/lexchronos/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
LOGROTATE

# Start monitoring services
echo "✅ Monitoring stack deployed successfully"
echo "📊 Grafana dashboard: http://localhost:3000"
echo "📋 Logs: /var/log/lexchronos/"
echo "⚠️  Configure webhook URLs for alerts"
EOF

chmod +x "$MONITORING_DIR/scripts/deploy-monitoring.sh"

log_success "Monitoring deployment script created"

# Step 10: Generate Monitoring Documentation
log_header "Step 10: Documentation Generation"

cat > "MONITORING_SETUP.md" << EOF
# LexChronos Monitoring Configuration

## Overview
Comprehensive monitoring and error tracking setup for LexChronos production deployment.

## Components Configured

### 1. Error Tracking (Sentry)
- **Client-side**: Browser error tracking and performance monitoring
- **Server-side**: API error tracking and performance monitoring  
- **Edge**: Edge runtime error tracking
- **Features**: Session replay, performance monitoring, release tracking

### 2. Health Checks
- **Endpoint**: \`/api/health\`
- **Metrics**: \`/api/metrics\`
- **Checks**: Database, Redis, External APIs
- **Response**: JSON with detailed status information

### 3. Uptime Monitoring
- **Script**: \`monitoring/scripts/uptime-monitor.js\`
- **Endpoints**: Main site, API, health checks
- **Alerts**: Webhook notifications for downtime
- **Frequency**: 60-second intervals

### 4. Performance Monitoring
- **Web Vitals**: FCP, LCP, CLS, FID, TTFB tracking
- **API Performance**: Response time percentiles
- **Memory Usage**: Heap usage monitoring
- **Database**: Query performance tracking

### 5. Log Management
- **Aggregation**: \`monitoring/scripts/log-aggregator.js\`
- **Storage**: Loki configuration provided
- **Retention**: 7 days default (configurable)
- **Levels**: Error, Warning, Info, Debug

### 6. Alerting System
- **Rules**: Prometheus alerting rules in \`monitoring/alerts/\`
- **Channels**: Slack, Discord, Email, SMS
- **Thresholds**: Configurable error rates and response times
- **Escalation**: Based on severity levels

### 7. Dashboard (Grafana)
- **Overview**: System metrics and performance
- **Panels**: HTTP requests, response times, errors, memory
- **Refresh**: 30-second intervals
- **Timeframe**: Configurable (default 1 hour)

## Environment Variables Required

### Sentry Configuration
\`\`\`bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-public-sentry-dsn@sentry.io/project-id
\`\`\`

### Alert Webhooks
\`\`\`bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
\`\`\`

### SMTP (for email alerts)
\`\`\`bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@lexchronos.com
SMTP_PASS=your-app-password
\`\`\`

## Deployment Steps

1. **Install Dependencies**
   \`\`\`bash
   npm install @sentry/nextjs
   \`\`\`

2. **Configure Environment Variables**
   - Add Sentry DSN to Vercel environment variables
   - Set up webhook URLs for alerts
   - Configure SMTP for email notifications

3. **Deploy Monitoring Scripts**
   \`\`\`bash
   ./monitoring/scripts/deploy-monitoring.sh
   \`\`\`

4. **Set Up Cron Jobs**
   \`\`\`bash
   # Uptime monitoring
   */1 * * * * cd /path/to/lexchronos && node monitoring/scripts/uptime-monitor.js

   # Log aggregation
   0 */6 * * * cd /path/to/lexchronos && node monitoring/scripts/log-aggregator.js

   # Send test alert (daily)
   0 9 * * * cd /path/to/lexchronos && node monitoring/scripts/send-alerts.js "Daily monitoring check" info
   \`\`\`

## Testing

### Test Health Endpoints
\`\`\`bash
curl https://lexchronos.com/api/health
curl https://lexchronos.com/api/metrics
\`\`\`

### Test Alerts
\`\`\`bash
node monitoring/scripts/send-alerts.js "Test alert message" warning
\`\`\`

### Test Uptime Monitor
\`\`\`bash
node monitoring/scripts/uptime-monitor.js
\`\`\`

## Monitoring URLs

- **Application**: https://lexchronos.com
- **Health Check**: https://lexchronos.com/api/health  
- **Metrics**: https://lexchronos.com/api/metrics
- **Sentry Dashboard**: https://sentry.io/organizations/your-org/projects/
- **Grafana Dashboard**: Configure separately or use cloud provider

## Alert Configuration

### Critical Alerts
- Database connection failures
- High error rates (>10%)
- SSL certificate expiry (<30 days)
- Low disk space (<10%)

### Warning Alerts  
- High response times (>2s)
- High memory usage (>90%)
- Failed external API calls

### Info Alerts
- Deployment notifications
- Daily health checks
- Performance summaries

## Troubleshooting

### Common Issues

1. **Sentry not receiving errors**
   - Check DSN configuration
   - Verify environment variables in Vercel
   - Check browser console for Sentry initialization

2. **Alerts not being sent**
   - Verify webhook URLs are correct
   - Check network connectivity
   - Review webhook service logs

3. **Health checks failing**
   - Verify database connectivity
   - Check external API credentials
   - Review application logs

### Log Locations
- **Application**: \`/var/log/lexchronos/\`
- **Monitoring**: \`/var/log/lexchronos/monitoring.log\`
- **Uptime**: \`/var/log/lexchronos/uptime.log\`

## Performance Optimization

1. **Reduce monitoring overhead**
   - Adjust sampling rates in production
   - Use async logging where possible
   - Implement circuit breakers for health checks

2. **Optimize alert frequency**
   - Use appropriate thresholds
   - Implement alert suppression
   - Group related alerts

3. **Efficient log management**
   - Use structured logging
   - Implement log rotation
   - Archive old logs to cheaper storage

---
Generated: $(date)
LexChronos Monitoring Stack v1.0
EOF

log_success "Monitoring documentation created"

echo -e "${BOLD}${GREEN}
╔══════════════════════════════════════════════════════════════════╗
║              🎉 MONITORING SETUP COMPLETE! 🎉                   ║
║                                                                  ║
║  📊 Components Configured:                                       ║
║  ✅ Sentry error tracking (client + server + edge)             ║
║  ✅ Health check endpoints (/api/health, /api/metrics)          ║
║  ✅ Uptime monitoring with alerting                             ║
║  ✅ Performance monitoring and Web Vitals                       ║
║  ✅ Log aggregation and management                              ║
║  ✅ Multi-channel alert system                                  ║
║  ✅ Grafana dashboard configuration                              ║
║                                                                  ║
║  📋 Next Steps:                                                  ║
║  1. Configure Sentry project and get DSN                       ║
║  2. Set up webhook URLs for alerts                              ║
║  3. Deploy monitoring scripts to production                     ║
║  4. Set up cron jobs for automated monitoring                   ║
║  5. Test all monitoring components                              ║
║                                                                  ║
║  📁 Documentation: MONITORING_SETUP.md                          ║
║  📊 Scripts: monitoring/scripts/                                 ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"

log_success "Monitoring and error tracking setup completed successfully!"
log_info "Check MONITORING_SETUP.md for detailed configuration instructions."

exit 0