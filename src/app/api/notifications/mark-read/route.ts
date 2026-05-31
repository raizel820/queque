import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
