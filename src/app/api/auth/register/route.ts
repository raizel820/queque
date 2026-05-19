import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

const VALID_ROLES = ['CUSTOMER', 'AGENCY_OWNER']
const ADMIN_SECRET = 'QUEUEWISE_ADMIN_2024'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, fullName, password, phoneNumber, role, agencyCode, adminCode, avatarUrl } = body

    // Validate required fields
    if (!username || !fullName || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, fullName, and password are required' },
        { status: 400 }
      )
    }

    // Validate username
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate role - only CUSTOMER and AGENCY_OWNER can register directly
    // AGENCY_STAFF accounts must be created by agency owners via /api/agency/staff/create
    // SUPER_ADMIN accounts cannot be created through registration
    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Only Customer and Agency Owner can register.' },
        { status: 400 }
      )
    }

    // Block SUPER_ADMIN registration through this endpoint
    if (role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin accounts cannot be created through registration' },
        { status: 403 }
      )
    }

    // Check for duplicate username
    const existingUser = await db.user.findUnique({
      where: { username },
    })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Check for duplicate phone number
    if (phoneNumber) {
      const existingPhone = await db.user.findUnique({
        where: { phoneNumber },
      })
      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: 'Phone number already registered' },
          { status: 409 }
        )
      }
    }

    // Hash password
    const passwordHash = hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        username,
        fullName,
        passwordHash,
        phoneNumber,
        role: role || 'CUSTOMER',
        avatarUrl: avatarUrl || undefined,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        language: true,
        avatarUrl: true,
        freeSmsCount: true,
        isActive: true,
        phoneNumber: true,
        createdAt: true,
      },
    })

    // If agency code provided and role is AGENCY_OWNER, link to agency
    let agencyId: string | undefined
    let agencyName: string | undefined
    let agencyNameAr: string | undefined
    let agencyNameFr: string | undefined
    if (agencyCode && role === 'AGENCY_OWNER') {
      const agency = await db.agency.findUnique({
        where: { customCode: agencyCode.toUpperCase() },
      })
      if (agency) {
        await db.agencyStaff.create({
          data: {
            userId: user.id,
            agencyId: agency.id,
            role: 'OWNER',
          },
        })
        agencyId = agency.id
        agencyName = agency.name
        agencyNameAr = agency.nameAr
        agencyNameFr = agency.nameFr
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        agencyId,
        agencyName,
        agencyNameAr,
        agencyNameFr,
      },
      isNewUser: true,
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
