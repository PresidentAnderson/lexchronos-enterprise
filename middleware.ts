import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Always skip middleware in static builds, demo mode, or production
  // This prevents any Supabase imports from being processed during build
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}