import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/callback',
  '/api/auth/_next',
  '/api/cron/',       // Cron endpoints (called by scheduler, not users)
  '/api/agencies',    // Public: list/search agencies
  '/api/agencies/',   // Public: agency details by id
  '/api/qr',          // Public: QR code generation
  '/api/faqs',        // Public: FAQ listing
  '/api/services',    // Public: service listing (GET only)
  '/api/stats',       // Public: basic stats
  '/api/queue/status', // Public: queue status (read-only)
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if this is a public route
  const isPublic = PUBLIC_API_ROUTES.some(route => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  // Also allow NextAuth's own routes
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  if (isPublic) {
    return NextResponse.next();
  }

  // For public GET routes that are safe without auth (agencies list, etc.)
  // we let them through but still add user headers if available
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  if (token) {
    requestHeaders.set('x-user-id', (token.id as string) || '');
    requestHeaders.set('x-user-role', (token.role as string) || '');
    requestHeaders.set('x-user-agency-id', (token.agencyId as string) || '');
    requestHeaders.set('x-user-username', (token.username as string) || '');
  }

  // For protected routes, require authentication
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
