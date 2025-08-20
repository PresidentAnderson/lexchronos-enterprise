import { NextRequest, NextResponse } from 'next/server';

// TODO: Re-enable Stripe webhook functionality after adding missing models to Prisma schema
// This route is temporarily disabled to fix Vercel deployment issues

// POST /api/webhooks/stripe - Handle Stripe webhooks (temporarily disabled)
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Stripe webhook functionality is temporarily disabled',
    message: 'This feature requires additional database models that are not yet implemented'
  }, { status: 503 });
}