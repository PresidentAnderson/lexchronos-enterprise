/**
 * Metrics API Route for LexChronos
 * @description Prometheus-compatible metrics endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/jwt';

// Import metrics collector dynamically to avoid build issues
async function getMetricsCollector() {
  try {
    const { default: metricsCollector } = await import('../../../lib/monitoring/metrics');
    return metricsCollector;
  } catch (error) {
    console.error('Failed to load metrics collector:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // SECURITY: Only admins and monitoring systems can access metrics
  const user = await auth(request);
  if (!user) {
    return new NextResponse('Unauthorized - Authentication required', { status: 401 });
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return new NextResponse('Forbidden - Admin access required', { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'prometheus';

  try {
    const metricsCollector = await getMetricsCollector();
    
    if (!metricsCollector) {
      return new NextResponse('Metrics collector not available', { status: 503 });
    }

    if (format === 'json') {
      // Return metrics in JSON format
      const metrics = await metricsCollector.getMetricsJSON();
      
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        metrics: metrics
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Return Prometheus format (default)
    const prometheusMetrics = await metricsCollector.getMetrics();
    
    return new NextResponse(prometheusMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error generating metrics:', error);
    
    return new NextResponse('Internal server error', {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}