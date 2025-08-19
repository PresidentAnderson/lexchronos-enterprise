import { NextRequest, NextResponse } from "next/server";
import { prisma, healthCheck } from "@/lib/db";

// GET /api/health - API health check
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    const dbHealth = await healthCheck();
    
    const responseTime = Date.now() - startTime;

    const health = {
      status: dbHealth.status === "healthy" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: dbHealth
    };

    const statusCode = health.status === "healthy" ? 200 : 503;

    return NextResponse.json({
      success: health.status === "healthy",
      data: health
    }, { status: statusCode });

  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      success: false,
      data: {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }, { status: 503 });
  }
}
