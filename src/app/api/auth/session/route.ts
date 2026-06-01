import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Require authentication - only logged-in users can access session data
    const sessionUser = await requireAuth(request)

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        language: true,
        avatarUrl: true,
        freeSmsCount: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
