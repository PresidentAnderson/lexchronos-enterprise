/**
 * Metrics Collection for LexChronos
 * @description Prometheus-compatible metrics collection and monitoring
 */

const client = require('prom-client');
const os = require('os');
const process = require('process');

class MetricsCollector {
  constructor() {
    this.registry = new client.Registry();
    this.metrics = {};
    this.initialized = false;
    
    this.init();
  }

  init() {
    if (this.initialized) return;

    // Add default Node.js metrics
    client.collectDefaultMetrics({
      register: this.registry,
      prefix: 'lexchronos_nodejs_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });

    this.createCustomMetrics();
    this.initialized = true;
  }

  createCustomMetrics() {
    // HTTP Request metrics
    this.metrics.httpRequestDuration = new client.Histogram({
      name: 'lexchronos_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'user_id'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    this.metrics.httpRequestsTotal = new client.Counter({
      name: 'lexchronos_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.metrics.httpRequestSize = new client.Histogram({
      name: 'lexchronos_http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 10000, 100000, 1000000]
    });

    this.metrics.httpResponseSize = new client.Histogram({
      name: 'lexchronos_http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [100, 1000, 10000, 100000, 1000000]
    });

    // Database metrics
    this.metrics.databaseQueryDuration = new client.Histogram({
      name: 'lexchronos_database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10]
    });

    this.metrics.databaseConnectionsActive = new client.Gauge({
      name: 'lexchronos_database_connections_active',
      help: 'Number of active database connections'
    });

    this.metrics.databaseConnectionsIdle = new client.Gauge({
      name: 'lexchronos_database_connections_idle',
      help: 'Number of idle database connections'
    });

    this.metrics.databaseQueriesTotal = new client.Counter({
      name: 'lexchronos_database_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status']
    });

    // Redis metrics
    this.metrics.redisOperationDuration = new client.Histogram({
      name: 'lexchronos_redis_operation_duration_seconds',
      help: 'Duration of Redis operations in seconds',
      labelNames: ['operation', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
    });

    this.metrics.redisConnectionsActive = new client.Gauge({
      name: 'lexchronos_redis_connections_active',
      help: 'Number of active Redis connections'
    });

    this.metrics.redisOperationsTotal = new client.Counter({
      name: 'lexchronos_redis_operations_total',
      help: 'Total number of Redis operations',
      labelNames: ['operation', 'status']
    });

    // Authentication metrics
    this.metrics.authenticationAttempts = new client.Counter({
      name: 'lexchronos_authentication_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['method', 'status', 'provider']
    });

    this.metrics.authenticationDuration = new client.Histogram({
      name: 'lexchronos_authentication_duration_seconds',
      help: 'Duration of authentication attempts in seconds',
      labelNames: ['method', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    // User metrics
    this.metrics.usersActive = new client.Gauge({
      name: 'lexchronos_users_active_total',
      help: 'Total number of active users'
    });

    this.metrics.userRegistrations = new client.Counter({
      name: 'lexchronos_user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['method', 'provider']
    });

    this.metrics.userSessions = new client.Gauge({
      name: 'lexchronos_user_sessions_active',
      help: 'Number of active user sessions'
    });

    // Business metrics
    this.metrics.subscriptionsActive = new client.Gauge({
      name: 'lexchronos_subscriptions_active',
      help: 'Number of active subscriptions',
      labelNames: ['tier']
    });

    this.metrics.revenue = new client.Counter({
      name: 'lexchronos_revenue_total',
      help: 'Total revenue in cents',
      labelNames: ['currency', 'subscription_tier']
    });

    this.metrics.paymentAttempts = new client.Counter({
      name: 'lexchronos_payment_attempts_total',
      help: 'Total number of payment attempts',
      labelNames: ['status', 'method']
    });

    // Application metrics
    this.metrics.memoryUsage = new client.Gauge({
      name: 'lexchronos_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });

    this.metrics.cpuUsage = new client.Gauge({
      name: 'lexchronos_cpu_usage_percent',
      help: 'CPU usage percentage'
    });

    this.metrics.errorRate = new client.Counter({
      name: 'lexchronos_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'level', 'service']
    });

    this.metrics.backgroundJobsCompleted = new client.Counter({
      name: 'lexchronos_background_jobs_completed_total',
      help: 'Total number of completed background jobs',
      labelNames: ['job_type', 'status']
    });

    this.metrics.backgroundJobDuration = new client.Histogram({
      name: 'lexchronos_background_job_duration_seconds',
      help: 'Duration of background jobs in seconds',
      labelNames: ['job_type'],
      buckets: [1, 5, 10, 30, 60, 300, 600]
    });

    // External API metrics
    this.metrics.externalApiCalls = new client.Counter({
      name: 'lexchronos_external_api_calls_total',
      help: 'Total number of external API calls',
      labelNames: ['service', 'endpoint', 'status']
    });

    this.metrics.externalApiDuration = new client.Histogram({
      name: 'lexchronos_external_api_duration_seconds',
      help: 'Duration of external API calls in seconds',
      labelNames: ['service', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    // Register all metrics
    Object.values(this.metrics).forEach(metric => {
      this.registry.registerMetric(metric);
    });

    // Start background metric collection
    this.startBackgroundCollection();
  }

  startBackgroundCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect application metrics every 60 seconds
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 60000);
  }

  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.set({ type: 'rss' }, memUsage.rss);
    this.metrics.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    this.metrics.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    this.metrics.memoryUsage.set({ type: 'external' }, memUsage.external);

    // CPU usage (simple approximation)
    const cpuUsage = process.cpuUsage();
    const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    this.metrics.cpuUsage.set(totalUsage);
  }

  async collectApplicationMetrics() {
    try {
      // These would typically query your database
      // For now, we'll use placeholder values
      
      // You would implement actual queries here
      // const activeUsers = await this.getActiveUsersCount();
      // this.metrics.usersActive.set(activeUsers);
      
      console.log('Collecting application metrics...');
    } catch (error) {
      console.error('Error collecting application metrics:', error);
      this.metrics.errorRate.inc({
        type: 'metrics_collection',
        level: 'error',
        service: 'monitoring'
      });
    }
  }

  // Helper methods for recording metrics
  recordHttpRequest(method, route, statusCode, duration, userId = null) {
    const labels = { method, route, status_code: statusCode };
    const labelsWithUser = { ...labels, user_id: userId || 'anonymous' };

    this.metrics.httpRequestsTotal.inc(labels);
    this.metrics.httpRequestDuration.observe(labelsWithUser, duration / 1000);
  }

  recordHttpRequestSize(method, route, size) {
    this.metrics.httpRequestSize.observe({ method, route }, size);
  }

  recordHttpResponseSize(method, route, statusCode, size) {
    this.metrics.httpResponseSize.observe({ method, route, status_code: statusCode }, size);
  }

  recordDatabaseQuery(operation, table, status, duration) {
    const labels = { operation, table, status };
    this.metrics.databaseQueriesTotal.inc(labels);
    this.metrics.databaseQueryDuration.observe(labels, duration / 1000);
  }

  recordRedisOperation(operation, status, duration) {
    const labels = { operation, status };
    this.metrics.redisOperationsTotal.inc(labels);
    this.metrics.redisOperationDuration.observe(labels, duration / 1000);
  }

  recordAuthentication(method, status, provider, duration) {
    this.metrics.authenticationAttempts.inc({ method, status, provider });
    this.metrics.authenticationDuration.observe({ method, status }, duration / 1000);
  }

  recordError(type, level, service = 'application') {
    this.metrics.errorRate.inc({ type, level, service });
  }

  recordBackgroundJob(jobType, status, duration) {
    this.metrics.backgroundJobsCompleted.inc({ job_type: jobType, status });
    if (duration) {
      this.metrics.backgroundJobDuration.observe({ job_type: jobType }, duration / 1000);
    }
  }

  recordExternalApiCall(service, endpoint, status, duration) {
    this.metrics.externalApiCalls.inc({ service, endpoint, status });
    this.metrics.externalApiDuration.observe({ service, endpoint }, duration / 1000);
  }

  recordPayment(status, method, amount, currency = 'usd') {
    this.metrics.paymentAttempts.inc({ status, method });
    if (status === 'success' && amount) {
      this.metrics.revenue.inc({ currency, subscription_tier: 'unknown' }, amount);
    }
  }

  // Express middleware
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Track request size
      const requestSize = parseInt(req.get('content-length')) || 0;
      if (requestSize > 0) {
        this.recordHttpRequestSize(req.method, req.route?.path || req.url, requestSize);
      }

      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = Date.now() - start;
        const route = req.route?.path || req.url;
        const userId = req.user?.id;

        this.recordHttpRequest(req.method, route, res.statusCode, duration, userId);

        // Track response size
        const responseSize = parseInt(res.get('content-length')) || 0;
        if (responseSize > 0) {
          this.recordHttpResponseSize(req.method, route, res.statusCode, responseSize);
        }

        return originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Get metrics for Prometheus
  async getMetrics() {
    return this.registry.metrics();
  }

  // Get metrics in JSON format
  async getMetricsJSON() {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }

  // Health check for metrics system
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metricsRegistered: Object.keys(this.metrics).length,
      registryMetrics: this.registry._metrics.size
    };
  }

  // Reset all metrics (useful for testing)
  reset() {
    this.registry.resetMetrics();
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

module.exports = metricsCollector;