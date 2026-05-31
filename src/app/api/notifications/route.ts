import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userId = user.id
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') // QUEUE, GENERAL, etc.

    const where: Record<string, unknown> = { userId }

    if (unreadOnly) {
      where.isRead = false
    }

    if (type) {
      // Support comma-separated types
      const types = type.split(',').map(t => t.trim()).filter(Boolean)
      if (types.length === 1) {
        where.type = types[0]
      } else if (types.length > 1) {
        where.type = { in: types }
      }
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Get unread count
    const unreadCount = await db.notification.count({
      where: { userId, isRead: false },
    })

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { type, title, message, entityId } = body

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        userId: user.id,
        type: type || 'SYSTEM',
        title,
        message: message || '',
        isRead: false,
        entityId: entityId || null,
      },
    })

    return NextResponse.json({ success: true, notification }, { status: 201 })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { notificationIds, markAll } = body

    if (markAll) {
      // Mark all notifications as read for the authenticated user
      const result = await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({
        success: true,
        markedCount: result.count,
      })
    }

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read — only if they belong to this user
      const result = await db.notification.updateMany({
        where: { id: { in: notificationIds }, userId: user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({
        success: true,
        markedCount: result.count,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Provide either { markAll: true } or { notificationIds: string[] }' },
      { status: 400 }
    )
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
