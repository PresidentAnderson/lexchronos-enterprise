import { NextRequest, NextResponse } from 'next/server';

// TODO: Re-enable invoice functionality after adding missing models to Prisma schema
// This route is temporarily disabled to fix Vercel deployment issues

// GET /api/invoices - Get invoices (temporarily disabled)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Invoice functionality is temporarily disabled',
    message: 'This feature requires additional database models that are not yet implemented'
  }, { status: 503 });
}

// POST /api/invoices - Create new invoice (temporarily disabled)
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Invoice functionality is temporarily disabled',
    message: 'This feature requires additional database models that are not yet implemented'
  }, { status: 503 });
}