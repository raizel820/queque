import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyAgencyOwnership } from '@/lib/auth-agency';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  agencyId: string;
  language: string;
}

/**
 * Gets the authenticated user from the NextAuth session cookie.
 * Returns null if not authenticated.
 */
export async function getAuthUser(_request: NextRequest): Promise<AuthUser | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      username: session.user.username,
      fullName: session.user.fullName,
      role: session.user.role,
      agencyId: session.user.agencyId,
      language: session.user.language,
    };
  } catch {
    return null;
  }
}

/**
 * Requires authentication. Returns 401 if not authenticated.
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request);

  if (!user) {
    throw new AuthError('Authentication required', 401);
  }

  return user;
}

/**
 * Requires SUPER_ADMIN role. Returns 401 if not authenticated, 403 if not admin.
 */
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (user.role !== 'SUPER_ADMIN') {
    throw new AuthError('Admin access required', 403);
  }

  return user;
}

/**
 * Requires agency ownership or SUPER_ADMIN role.
 * Returns 401 if not authenticated, 403 if user doesn't own/belong to the agency.
 */
export async function requireAgencyAccess(
  request: NextRequest,
  agencyId: string
): Promise<AuthUser> {
  const user = await requireAuth(request);

  // SUPER_ADMIN can access any agency
  if (user.role === 'SUPER_ADMIN') {
    return user;
  }

  // Verify the user belongs to the specified agency
  const ownership = await verifyAgencyOwnership(user.id, agencyId);
  if (!ownership) {
    throw new AuthError('You do not have access to this agency', 403);
  }

  return user;
}

/**
 * Custom error class for auth errors that can be caught and converted to responses.
 */
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Helper to handle auth errors in API routes.
 * Returns a NextResponse with the appropriate status code.
 */
export function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }
  return null;
}
