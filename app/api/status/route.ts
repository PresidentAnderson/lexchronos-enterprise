/**
 * System Status API Route for LexChronos
 * @description Comprehensive system status endpoint for monitoring dashboards
 */

import { NextRequest, NextResponse } from 'next/server';

interface SystemStatus {
  status: 'operational' | 'degraded' | 'maintenance' | 'outage';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    [key: string]: ServiceStatus;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  infrastructure: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    storage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  incidents: Incident[];
  maintenance: MaintenanceWindow[];
}

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
  uptime?: number;
  lastChecked: string;
  message?: string;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startedAt: string;
  resolvedAt?: string;
  description: string;
  affectedServices: string[];
  updates: IncidentUpdate[];
}

interface IncidentUpdate {
  timestamp: string;
  status: string;
  message: string;
}

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  affectedServices: string[];
  status: 'scheduled' | 'in-progress' | 'completed';
}

class StatusManager {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    // Check all services
    const services = await this.checkAllServices();
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus(services);

    // Get performance metrics
    const performance = await this.getPerformanceMetrics();

    // Get infrastructure metrics
    const infrastructure = await this.getInfrastructureMetrics();

    // Get incidents and maintenance windows
    const incidents = await this.getActiveIncidents();
    const maintenance = await this.getMaintenanceWindows();

    return {
      status: overallStatus,
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      performance,
      infrastructure,
      incidents,
      maintenance
    };
  }

  private async checkAllServices(): Promise<{ [key: string]: ServiceStatus }> {
    const services: { [key: string]: ServiceStatus } = {};
    const timestamp = new Date().toISOString();

    // Database service
    services.database = await this.checkDatabase();
    services.database.lastChecked = timestamp;

    // Redis service
    services.redis = await this.checkRedis();
    services.redis.lastChecked = timestamp;

    // External APIs
    services.externalAPIs = await this.checkExternalAPIs();
    services.externalAPIs.lastChecked = timestamp;

    // File storage
    services.storage = await this.checkStorage();
    services.storage.lastChecked = timestamp;

    // Email service
    services.email = await this.checkEmailService();
    services.email.lastChecked = timestamp;

    return services;
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    
    try {
      // Import database client dynamically
      const { Client } = await import('pg');
      
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return {
          status: 'down',
          message: 'Database URL not configured'
        };
      }

      const client = new Client({ connectionString: databaseUrl });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();

      const responseTime = Date.now() - start;

      return {
        status: responseTime > 1000 ? 'degraded' : 'operational',
        responseTime,
        message: responseTime > 1000 ? 'Slow response time' : 'Database operational'
      };

    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : 'Database connection failed'
      };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const start = Date.now();
    
    try {
      const { createClient } = await import('redis');
      
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        return {
          status: 'degraded',
          message: 'Redis URL not configured'
        };
      }

      const client = createClient({ url: redisUrl });
      await client.connect();
      await client.ping();
      await client.disconnect();

      const responseTime = Date.now() - start;

      return {
        status: responseTime > 500 ? 'degraded' : 'operational',
        responseTime,
        message: responseTime > 500 ? 'Slow response time' : 'Redis operational'
      };

    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : 'Redis connection failed'
      };
    }
  }

  private async checkExternalAPIs(): Promise<ServiceStatus> {
    const start = Date.now();
    
    try {
      const apis = [
        { name: 'Stripe', url: 'https://api.stripe.com/v1' },
        { name: 'Sentry', url: 'https://sentry.io' }
      ];

      const results = await Promise.allSettled(
        apis.map(async (api) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(api.url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: { 'User-Agent': 'LexChronos-Status/1.0' }
          });
          
          clearTimeout(timeoutId);
          return { name: api.name, status: response.status < 500 };
        })
      );

      const failed = results.filter(
        (result, index) => result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.status)
      );

      const responseTime = Date.now() - start;

      return {
        status: failed.length === 0 ? 'operational' : failed.length === apis.length ? 'down' : 'degraded',
        responseTime,
        message: failed.length > 0 ? `${failed.length}/${apis.length} APIs unreachable` : 'All external APIs operational'
      };

    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: 'External API check failed'
      };
    }
  }

  private async checkStorage(): Promise<ServiceStatus> {
    try {
      // Check if we can write to the temporary directory
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const testFile = path.join(process.cwd(), 'temp', '.storage-test');
      
      // Ensure temp directory exists
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      
      // Write test file
      await fs.writeFile(testFile, 'test');
      
      // Read test file
      const content = await fs.readFile(testFile, 'utf8');
      
      // Clean up
      await fs.unlink(testFile);

      return {
        status: content === 'test' ? 'operational' : 'degraded',
        message: 'File storage operational'
      };

    } catch (error) {
      return {
        status: 'down',
        message: 'File storage unavailable'
      };
    }
  }

  private async checkEmailService(): Promise<ServiceStatus> {
    // This is a basic check - in production you might send a test email
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
    
    const requiredVars = {
      smtp: ['EMAIL_SERVER_HOST', 'EMAIL_SERVER_USER'],
      sendgrid: ['SENDGRID_API_KEY'],
      resend: ['RESEND_API_KEY']
    };

    const required = requiredVars[emailProvider as keyof typeof requiredVars] || [];
    const missing = required.filter(envVar => !process.env[envVar]);

    return {
      status: missing.length === 0 ? 'operational' : 'degraded',
      message: missing.length > 0 ? `Missing configuration: ${missing.join(', ')}` : `${emailProvider} configured`
    };
  }

  private determineOverallStatus(services: { [key: string]: ServiceStatus }): SystemStatus['status'] {
    const statuses = Object.values(services).map(service => service.status);
    
    if (statuses.every(status => status === 'operational')) {
      return 'operational';
    }
    
    if (statuses.some(status => status === 'down')) {
      return 'outage';
    }
    
    if (statuses.some(status => status === 'degraded')) {
      return 'degraded';
    }

    return 'operational';
  }

  private async getPerformanceMetrics() {
    // In a real implementation, these would come from your metrics system
    return {
      responseTime: Math.random() * 100 + 50, // Mock: 50-150ms
      throughput: Math.random() * 1000 + 500, // Mock: 500-1500 req/min
      errorRate: Math.random() * 2 // Mock: 0-2%
    };
  }

  private async getInfrastructureMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        loadAverage: process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0]
      },
      storage: {
        used: 0, // Would need to implement actual storage check
        total: 0,
        percentage: 0
      }
    };
  }

  private async getActiveIncidents(): Promise<Incident[]> {
    // In a real implementation, this would query your incident management system
    return [];
  }

  private async getMaintenanceWindows(): Promise<MaintenanceWindow[]> {
    // In a real implementation, this would query your maintenance schedule
    return [];
  }
}

const statusManager = new StatusManager();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  try {
    const systemStatus = await statusManager.getSystemStatus();
    
    // Set appropriate status code
    const statusCode = 
      systemStatus.status === 'operational' ? 200 :
      systemStatus.status === 'degraded' ? 200 :
      systemStatus.status === 'maintenance' ? 503 : 503;

    if (format === 'badge') {
      // Return SVG badge for status pages
      const color = 
        systemStatus.status === 'operational' ? 'brightgreen' :
        systemStatus.status === 'degraded' ? 'yellow' :
        systemStatus.status === 'maintenance' ? 'blue' : 'red';

      const badge = `
        <svg xmlns="http://www.w3.org/2000/svg" width="104" height="20">
          <linearGradient id="b" x2="0" y2="100%">
            <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
            <stop offset="1" stop-opacity=".1"/>
          </linearGradient>
          <mask id="a">
            <rect width="104" height="20" rx="3" fill="#fff"/>
          </mask>
          <g mask="url(#a)">
            <path fill="#555" d="M0 0h63v20H0z"/>
            <path fill="${color}" d="M63 0h41v20H63z"/>
            <path fill="url(#b)" d="M0 0h104v20H0z"/>
          </g>
          <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
            <text x="31.5" y="15" fill="#010101" fill-opacity=".3">status</text>
            <text x="31.5" y="14">status</text>
            <text x="82.5" y="15" fill="#010101" fill-opacity=".3">${systemStatus.status}</text>
            <text x="82.5" y="14">${systemStatus.status}</text>
          </g>
        </svg>
      `;

      return new NextResponse(badge, {
        status: statusCode,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Return JSON format (default)
    return NextResponse.json(systemStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error generating status:', error);
    
    const errorStatus: SystemStatus = {
      status: 'outage',
      timestamp: new Date().toISOString(),
      uptime: 0,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {},
      performance: { responseTime: 0, throughput: 0, errorRate: 100 },
      infrastructure: {
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { usage: 0, loadAverage: [0, 0, 0] },
        storage: { used: 0, total: 0, percentage: 0 }
      },
      incidents: [{
        id: 'status-check-error',
        title: 'Status Check Error',
        status: 'investigating',
        severity: 'major',
        startedAt: new Date().toISOString(),
        description: 'Unable to retrieve system status',
        affectedServices: ['status-page'],
        updates: []
      }],
      maintenance: []
    };

    return NextResponse.json(errorStatus, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}