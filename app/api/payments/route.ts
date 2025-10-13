import { NextRequest, NextResponse } from 'next/server';

// TODO: Re-enable payment functionality after adding missing models to Prisma schema
// This route is temporarily disabled to fix Vercel deployment issues

// GET /api/payments - Get payments (temporarily disabled)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Payment functionality is temporarily disabled',
    message: 'This feature requires additional database models that are not yet implemented'
  }, { status: 503 });
}

// POST /api/payments - Create new payment (temporarily disabled)
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Payment functionality is temporarily disabled',
    message: 'This feature requires additional database models that are not yet implemented'
  }, { status: 503 });
}