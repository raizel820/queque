import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { preferences } = await request.json()

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'preferences object is required' },
        { status: 400 }
      )
    }

    const prefsStr = JSON.stringify(preferences)

    const updated = await db.user.update({
      where: { id: user.id },
      data: { notificationPreferences: prefsStr },
      select: {
        id: true,
        notificationPreferences: true,
      },
    })

    return NextResponse.json({
      notificationPreferences: JSON.parse(updated.notificationPreferences),
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
