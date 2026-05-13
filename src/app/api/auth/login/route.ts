import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

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
    // Agency tab allows both AGENCY_OWNER and AGENCY_STAFF
    const agencyRoles = ['AGENCY_OWNER', 'AGENCY_STAFF'];
    if (
      expectedRole &&
      user.role !== expectedRole &&
      !(agencyRoles.includes(expectedRole) && agencyRoles.includes(user.role))
    ) {
      return NextResponse.json(
        { success: false, error: 'wrongRoleError' },
        { status: 403 }
      )
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
      },
    })

    // Return user data (exclude passwordHash)
    const { passwordHash: _, ...userData } = user

    // Look up agencyId for agency owners and staff
    let agencyId: string | undefined;
    if (user.role === 'AGENCY_OWNER' || user.role === 'AGENCY_STAFF') {
      if (user.role === 'AGENCY_OWNER') {
        const ownedAgency = await db.agency.findFirst({
          where: { ownerId: user.id },
          select: { id: true },
        });
        agencyId = ownedAgency?.id;
      } else {
        const staffAssignment = await db.agencyStaff.findFirst({
          where: { userId: user.id, isActive: true },
          select: { agencyId: true },
        });
        agencyId = staffAssignment?.agencyId;
      }
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
