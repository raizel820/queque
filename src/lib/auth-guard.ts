/**
 * Consolidated Authentication & Authorization Module
 *
 * This is THE single source of truth for all auth checks in API routes.
 * All routes MUST use these helpers instead of trusting client-provided IDs.
 *
 * Usage patterns:
 * - requireAuth(request)           → must be logged in
 * - requireAdmin(request)          → must be SUPER_ADMIN
 * - requireRole(request, ...roles) → must have one of the specified roles
 * - requireAgencyAccess(request, agencyId) → must own/belong to the agency
 * - requireResourceOwnership(request, resourceUserId) → must own the resource or be SUPER_ADMIN
 * - resolveUserAgencyId(user)     → resolve the user's agencyId from session/DB
 * - verifyAgencyOwnership(userId, agencyId?) → verify user owns/belongs to agency
 * - getUserAgencyId(userId)       → get the agencyId for a user
 */
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  username: string
  fullName: string
  role: string
  language: string
  avatarUrl: string | null
  agencyId: string | null
}

// ─── Error Handling ──────────────────────────────────────────────────────────

export class AuthError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}

/**
 * Converts an AuthError (or any error) into a proper NextResponse.
 * Always returns a NextResponse — never null.
 * Use this in every route's catch block.
 */
export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    )
  }
  // For non-AuthError errors, return generic 500
  console.error('[AUTH] Unexpected error:', error)
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

// ─── Session Extraction ─────────────────────────────────────────────────────

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

// ─── Agency Ownership Verification ──────────────────────────────────────────

/**
 * Resolves the agencyId for a given userId by checking:
 * 1. If the user is an agency owner (Agency.ownerId)
 * 2. If the user is agency staff (AgencyStaff.userId)
 *
 * Returns the verified agencyId or null if the user has no agency.
 */
export async function getUserAgencyId(userId: string): Promise<string | null> {
  // Check if user is an agency owner
  const ownedAgency = await db.agency.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  })
  if (ownedAgency) return ownedAgency.id

  // Check if user is agency staff
  const staffRecord = await db.agencyStaff.findFirst({
    where: { userId, isActive: true },
    select: { agencyId: true },
  })
  if (staffRecord) return staffRecord.agencyId

  return null
}

/**
 * Verifies that the given userId belongs to the specified agencyId.
 * Returns the verified agencyId if ownership checks out, or null otherwise.
 *
 * This is the primary function to use in API routes for tenant isolation.
 * It resolves the user's agency and optionally checks it against a requested agencyId.
 */
export async function verifyAgencyOwnership(
  userId: string,
  requestedAgencyId?: string | null
): Promise<{ agencyId: string; isOwner: boolean } | null> {
  // Check if user is an agency owner
  const ownedAgency = await db.agency.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  })

  if (ownedAgency) {
    // If a specific agencyId was requested, verify it matches
    if (requestedAgencyId && requestedAgencyId !== ownedAgency.id) {
      return null // Owner tried to access a different agency
    }
    return { agencyId: ownedAgency.id, isOwner: true }
  }

  // Check if user is agency staff
  const staffRecord = await db.agencyStaff.findFirst({
    where: { userId, isActive: true },
    select: { agencyId: true },
  })

  if (staffRecord) {
    // If a specific agencyId was requested, verify it matches
    if (requestedAgencyId && requestedAgencyId !== staffRecord.agencyId) {
      return null // Staff tried to access a different agency
    }
    return { agencyId: staffRecord.agencyId, isOwner: false }
  }

  return null // User has no agency
}

// ─── Auth Requirements ───────────────────────────────────────────────────────

/**
 * Requires authentication. Throws 401 if not logged in.
 */
export async function requireAuth(request?: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(request)
  if (!user) {
    throw new AuthError('Authentication required', 401)
  }
  return user
}

/**
 * Requires SUPER_ADMIN role. Throws 403 if not admin.
 */
export async function requireAdmin(request?: NextRequest): Promise<SessionUser> {
  const user = await requireAuth(request)
  if (user.role !== 'SUPER_ADMIN') {
    throw new AuthError('Admin access required', 403)
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
 * - AGENCY_STAFF: must be active staff of the agency
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

  // AGENCY_OWNER or AGENCY_STAFF: verify ownership
  const ownership = await verifyAgencyOwnership(user.id, agencyId)
  if (!ownership) {
    throw new AuthError('You do not have access to this agency', 403)
  }

  return user
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
 * Resolves the user's agencyId from the session or DB.
 * Returns null if the user has no agency.
 * Useful for routes where agencyId is implicit (not provided by client).
 */
export async function resolveUserAgencyId(user: SessionUser): Promise<string | null> {
  if (user.agencyId) return user.agencyId
  if (user.role === 'SUPER_ADMIN') return null
  // Fallback: look up from DB
  const ownedAgency = await db.agency.findFirst({
    where: { ownerId: user.id },
    select: { id: true },
  })
  if (ownedAgency) return ownedAgency.id

  const staffRecord = await db.agencyStaff.findFirst({
    where: { userId: user.id, isActive: true },
    select: { agencyId: true },
  })
  return staffRecord?.agencyId ?? null
}
