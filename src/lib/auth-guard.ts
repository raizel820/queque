import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Type for the authenticated session user with custom fields
 */
export interface SessionUser {
  id: string
  username: string
  fullName: string
  role: string
  language: string
  avatarUrl: string | null
  agencyId: string | null
}

/**
 * Extracts and validates the NextAuth session from a request.
 * Returns the user object or null if not authenticated.
 */
export async function getSessionUser(_request?: NextRequest): Promise<SessionUser | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }
    return session.user as SessionUser
  } catch {
    return null
  }
}

/**
 * Like getSessionUser but throws 401 if not authenticated.
 * Returns the user object.
 */
export async function requireAuth(request?: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(request)
  if (!user) {
    throw new AuthError('Authentication required', 401)
  }
  return user
}

/**
 * Requires auth + specific role(s). Throws 403 if wrong role.
 */
export async function requireRole(
  request: NextRequest,
  ...roles: string[]
): Promise<SessionUser> {
  const user = await requireAuth(request)
  if (!roles.includes(user.role)) {
    throw new AuthError('Insufficient permissions', 403)
  }
  return user
}

/**
 * Requires auth + verifies the user has access to the specified agency.
 * - SUPER_ADMIN: always has access
 * - AGENCY_OWNER: must own the agency
 * - AGENCY_STAFF: must be staff of the agency (active)
 * - CUSTOMER: never has agency access
 * Throws 403 if no access.
 */
export async function requireAgencyAccess(
  request: NextRequest,
  agencyId: string,
): Promise<SessionUser> {
  const user = await requireAuth(request)

  // SUPER_ADMIN always has access
  if (user.role === 'SUPER_ADMIN') {
    return user
  }

  // CUSTOMER never has agency access
  if (user.role === 'CUSTOMER') {
    throw new AuthError('Customers cannot access agency resources', 403)
  }

  // AGENCY_OWNER: must own the agency
  if (user.role === 'AGENCY_OWNER') {
    const agency = await db.agency.findFirst({
      where: { id: agencyId, ownerId: user.id },
      select: { id: true },
    })
    if (!agency) {
      throw new AuthError('You do not have access to this agency', 403)
    }
    return user
  }

  // AGENCY_STAFF: must be active staff of the agency
  if (user.role === 'AGENCY_STAFF') {
    const staffAssignment = await db.agencyStaff.findFirst({
      where: { userId: user.id, agencyId, isActive: true },
      select: { id: true },
    })
    if (!staffAssignment) {
      throw new AuthError('You do not have access to this agency', 403)
    }
    return user
  }

  throw new AuthError('Insufficient permissions', 403)
}

/**
 * Requires auth + verifies the authenticated user owns the resource
 * (or is SUPER_ADMIN). Throws 403 if not owner.
 */
export async function requireResourceOwnership(
  request: NextRequest,
  resourceUserId: string,
): Promise<SessionUser> {
  const user = await requireAuth(request)

  // SUPER_ADMIN can access any resource
  if (user.role === 'SUPER_ADMIN') {
    return user
  }

  // User must own the resource
  if (user.id !== resourceUserId) {
    throw new AuthError('You do not have access to this resource', 403)
  }

  return user
}

/**
 * Custom authentication/authorization error class
 */
export class AuthError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}

/**
 * Utility to create an error NextResponse from an AuthError
 */
export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    )
  }
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
