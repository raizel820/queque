import { NextRequest, NextResponse } from 'next/server'
import { clearNextAuthSessionCookie } from '@/lib/auth-cookie'

/**
 * POST /api/auth/logout
 *
 * Clears the NextAuth session cookie, effectively logging the user out.
 * The frontend should also clear its local Zustand state.
 */
export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    clearNextAuthSessionCookie(response)
    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/logout
 *
 * Also supports GET for convenience (e.g., browser navigation).
 */
export async function GET(_request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    clearNextAuthSessionCookie(response)
    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
