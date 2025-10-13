import { NextRequest, NextResponse } from 'next/server';

// TODO: Re-enable subscription functionality after adding missing models to Prisma schema
// This route is temporarily disabled to fix Vercel deployment issues

// GET /api/subscriptions - Get all available subscription plans (temporarily disabled)
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Subscription functionality is temporarily disabled',
    message: 'This feature requires additional database models that are not yet implemented'
  }, { status: 503 });
}

// POST /api/subscriptions - Create a new subscription (temporarily disabled)
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Subscription functionality is temporarily disabled',
    message: 'This feature requires additional database models that are not yet implemented'
  }, { status: 503 });
}