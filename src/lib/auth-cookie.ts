import { encode } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { SessionUser } from '@/lib/auth-guard'

const SESSION_TOKEN_NAME = 'next-auth.session-token'
const SECURE_SESSION_TOKEN_NAME = '__Secure-next-auth.session-token'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days, matches auth.ts

const FALLBACK_SECRET = 'blast1-d3v-s3cr3t-k3y-f0r-d3v3l0pm3nt-0nly'

/**
 * Gets the NEXTAUTH_SECRET, falling back to a dev-only secret if not set.
 * This prevents login/signup from crashing in development.
 * In production, NEXTAUTH_SECRET MUST be set as an environment variable.
 */
function getAuthSecret(): string {
  return process.env.NEXTAUTH_SECRET || FALLBACK_SECRET
}

/**
 * Encodes a NextAuth JWT session token and sets it as an HttpOnly cookie
 * on the given response. This allows the existing login/register endpoints
 * to create server-side sessions that middleware and auth guards can verify.
 */
export async function setNextAuthSessionCookie(
  response: NextResponse,
  user: SessionUser
): Promise<void> {
  const secret = getAuthSecret()
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn('[auth-cookie] NEXTAUTH_SECRET not set — using fallback secret (dev only)')
  }

  // Encode the JWT token — same format that NextAuth uses internally
  const token = await encode({
    token: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      language: user.language,
      avatarUrl: user.avatarUrl ?? null,
      agencyId: user.agencyId as string,
    },
    secret,
    maxAge: SESSION_MAX_AGE,
  })

  // Determine cookie name based on protocol
  const isSecure = process.env.NODE_ENV === 'production'
  const cookieName = isSecure ? SECURE_SESSION_TOKEN_NAME : SESSION_TOKEN_NAME

  // Set the session cookie — matches NextAuth's default cookie settings
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  // Also set the callback URL cookie that NextAuth expects
  response.cookies.set('next-auth.callback-url', '/', {
    httpOnly: false,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * Clears the NextAuth session cookie from the response.
 */
export function clearNextAuthSessionCookie(response: NextResponse): void {
  const isSecure = process.env.NODE_ENV === 'production'
  const cookieName = isSecure ? SECURE_SESSION_TOKEN_NAME : SESSION_TOKEN_NAME

  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set('next-auth.callback-url', '', {
    httpOnly: false,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
