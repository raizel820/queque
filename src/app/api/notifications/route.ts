import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'
import { validateBody } from '@/lib/validations'
import { z } from 'zod'
import { emitNotificationEvent } from '@/lib/realtime-emit'

const createNotificationSchema = z.object({
  type: z.string().max(50).optional(),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().max(1000).optional(),
  entityId: z.string().optional(),
})

const markNotificationsSchema = z.object({
  markAll: z.boolean().optional(),
  notificationIds: z.array(z.string()).min(1).optional(),
})

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
    const validation = validateBody(createNotificationSchema, body)
    if (validation.error) return validation.error

    const { type, title, message, entityId } = validation.data

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

    // Emit realtime event (fire-and-forget)
    emitNotificationEvent('notification:new', user.id, {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
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
    const validation = validateBody(markNotificationsSchema, body)
    if (validation.error) return validation.error

    const { notificationIds, markAll } = validation.data

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
