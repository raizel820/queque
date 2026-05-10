import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const { userId, preferences } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'preferences object is required' },
        { status: 400 }
      )
    }

    const prefsStr = JSON.stringify(preferences)

    const user = await db.user.update({
      where: { id: userId },
      data: { notificationPreferences: prefsStr },
      select: {
        id: true,
        notificationPreferences: true,
      },
    })

    return NextResponse.json({
      notificationPreferences: JSON.parse(user.notificationPreferences),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
