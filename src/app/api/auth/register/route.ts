import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { setNextAuthSessionCookie } from '@/lib/auth-cookie'
import { checkRateLimit, getClientIp, RateLimitError, AUTH_RATE_LIMIT } from '@/lib/rate-limit'
import { validateBody, registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    checkRateLimit(getClientIp(request), AUTH_RATE_LIMIT)

    const body = await request.json()
    const validation = validateBody(registerSchema, body)
    if (validation.error) return validation.error

    const { username, fullName, password, phoneNumber, role, agencyCode, avatarUrl } = validation.data

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

    // Set NextAuth session cookie so protected API routes work
    const response = NextResponse.json({
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
    await setNextAuthSessionCookie(response, { ...user, agencyId: agencyId || null })

    return response
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, error: error.message, retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': String(error.retryAfter) } }
      )
    }
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
