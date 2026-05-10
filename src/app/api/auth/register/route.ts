import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

const VALID_ROLES = ['CUSTOMER', 'AGENCY_STAFF', 'AGENCY_OWNER']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, fullName, password, phoneNumber, role } = body

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

    // Validate role
    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
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
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
