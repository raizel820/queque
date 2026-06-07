import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Next.js 16 Proxy (middleware) — First auth gate for all API routes.
 *
 * This runs BEFORE any route handler. It:
 * 1. Allows public GET routes (agencies listing, stats, etc.)
 * 2. Allows NextAuth's own routes (login, register, callbacks)
 * 3. Allows cron routes (called by scheduler)
 * 4. Requires a valid JWT for all other routes
 * 5. Injects x-user-* headers for downstream route handlers
 *
 * NOTE: Route handlers MUST STILL call requireAuth/requireAdmin/requireAgencyAccess
 * from @/lib/auth-guard for role-based and ownership checks. This proxy only
 * verifies that a valid session exists.
 */

// Routes that are fully public (GET only — no auth needed)
const PUBLIC_GET_ROUTES = [
  '/api/agencies',       // Public: browse/search agencies
  '/api/agencies/',      // Public: agency details by id/code
  '/api/qr',             // Public: QR code generation
  '/api/faqs',           // Public: FAQ listing
  '/api/faq',            // Public: FAQ listing (alt path)
  '/api/services',       // Public: service listing
  '/api/stats',          // Public: basic platform stats
  '/api/queue/status',   // Public: read-only queue status
  '/api/payment-settings', // Public: payment method info (CCP, bank, e-wallet)
  '/api/kiosk/agency',   // Public (kiosk): load agency info by code
  '/api/kiosk/status',   // Public (kiosk): check queue status
]

// Routes that are fully public (any method — no auth needed)
const PUBLIC_FULL_ROUTES = [
  '/api/auth/',          // NextAuth's own routes
  '/api/cron/',          // Cron endpoints (called by scheduler)
]

// Public POST routes (no auth needed — kiosks don't have user accounts)
// Rate limiting on the route handlers themselves provides abuse protection
const PUBLIC_POST_ROUTES = [
  '/api/kiosk/join',     // Public (kiosk): join queue as walk-in customer
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all non-API routes (SPA shell, static files)
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow fully public routes (any method)
  const isFullPublic = PUBLIC_FULL_ROUTES.some(route => pathname.startsWith(route))
  if (isFullPublic) {
    return NextResponse.next()
  }

  // Allow public GET routes (read-only access)
  if (request.method === 'GET') {
    const isGetPublic = PUBLIC_GET_ROUTES.some(route => {
      if (route.endsWith('/')) {
        return pathname.startsWith(route)
      }
      return pathname === route || pathname.startsWith(route + '/')
    })
    if (isGetPublic) {
      return NextResponse.next()
    }
  }

  // Allow public POST routes (e.g., kiosk join — no user accounts)
  if (request.method === 'POST') {
    const isPostPublic = PUBLIC_POST_ROUTES.some(route => {
      return pathname === route || pathname.startsWith(route + '/')
    })
    if (isPostPublic) {
      return NextResponse.next()
    }
  }

  // All other routes require a valid JWT token
  const secret = process.env.NEXTAUTH_SECRET || 'dev-only-secret-change-in-production'

  const token = await getToken({ req: request, secret })

  // No valid token = unauthorized
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Inject user info into request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', (token.id as string) || '')
  requestHeaders.set('x-user-role', (token.role as string) || '')
  requestHeaders.set('x-user-agency-id', (token.agencyId as string) || '')
  requestHeaders.set('x-user-username', (token.username as string) || '')

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.ico).*)',
  ],
}
