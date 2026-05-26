import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/callback',
  '/api/auth/_next',
  '/api/auth/logout',
  '/api/cron/',
  '/api/agencies',
  '/api/agencies/',
  '/api/qr',
  '/api/faqs',
  '/api/services',
  '/api/stats',
  '/api/queue/status',
  '/api/agency/',
  '/api/global-announcements',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all non-API routes (the SPA shell, static files, etc.)
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow NextAuth's own routes (signin, signout, callback, etc.)
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Check if this is a public route
  const isPublic = PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route)
    }
    return pathname === route || pathname.startsWith(route + '/')
  })

  if (isPublic && request.method === 'GET') {
    return NextResponse.next()
  }

  // Check for valid NextAuth JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  if (token) {
    requestHeaders.set('x-user-id', (token.id as string) || '')
    requestHeaders.set('x-user-role', (token.role as string) || '')
    requestHeaders.set('x-user-agency-id', (token.agencyId as string) || '')
    requestHeaders.set('x-user-username', (token.username as string) || '')
  }

  // For protected routes, require authentication
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

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
