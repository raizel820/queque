import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { cache, CACHE_TTL } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, expectedRole } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username
    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        language: true,
        avatarUrl: true,
        freeSmsCount: true,
        isActive: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if user's role matches the expected role from login tab
    const agencyRoles = ['AGENCY_OWNER', 'AGENCY_STAFF'];
    const isAgencyTab = agencyRoles.includes(expectedRole);
    const isCustomerTab = expectedRole === 'CUSTOMER';

    if (expectedRole) {
      if (user.role === 'SUPER_ADMIN') {
        // allowed
      } else if (isAgencyTab && agencyRoles.includes(user.role)) {
        // allowed
      } else if (isCustomerTab && user.role === 'CUSTOMER') {
        // allowed
      } else {
        return NextResponse.json(
          { success: false, error: 'wrongRoleError' },
          { status: 403 }
        )
      }
    }

    // Create audit log asynchronously (don't block the response)
    // Use setImmediate to avoid blocking the login response
    const userId = user.id;
    setImmediate(() => {
      db.auditLog.create({
        data: {
          userId,
          action: 'LOGIN',
          entityType: 'USER',
          entityId: userId,
        },
      }).catch(() => {
        // Ignore audit log errors - don't fail the login
      });
    });

    // Return user data (exclude passwordHash)
    const { passwordHash: _, ...userData } = user

    // Cache agency lookup for agency roles (reduces repeated queries)
    let agencyId: string | undefined;
    if (user.role === 'SUPER_ADMIN') {
      const cachedAgency = await cache.getOrSet(
        'superadmin:agencyId',
        async () => {
          const firstAgency = await db.agency.findFirst({ select: { id: true } });
          return firstAgency?.id || null;
        },
        CACHE_TTL.LONG
      );
      agencyId = cachedAgency || undefined;
    } else if (user.role === 'AGENCY_OWNER') {
      const cachedAgency = await cache.getOrSet(
        `owner:agencyId:${user.id}`,
        async () => {
          const ownedAgency = await db.agency.findFirst({
            where: { ownerId: user.id },
            select: { id: true },
          });
          return ownedAgency?.id || null;
        },
        CACHE_TTL.LONG
      );
      agencyId = cachedAgency || undefined;
    } else if (user.role === 'AGENCY_STAFF') {
      const cachedAgency = await cache.getOrSet(
        `staff:agencyId:${user.id}`,
        async () => {
          const staffAssignment = await db.agencyStaff.findFirst({
            where: { userId: user.id, isActive: true },
            select: { agencyId: true },
          });
          return staffAssignment?.agencyId || null;
        },
        CACHE_TTL.LONG
      );
      agencyId = cachedAgency || undefined;
    }

    return NextResponse.json({ success: true, user: { ...userData, agencyId } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
