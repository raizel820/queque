import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache, CACHE_TTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Cache notifications for 3 seconds - short TTL since they change frequently
    const cacheKey = `notifications:${userId}:${unreadOnly}:${type || 'all'}`;
    const result = await cache.getOrSet(cacheKey, async () => {
      const where: Record<string, unknown> = { userId }

      if (unreadOnly) {
        where.isRead = false
      }

      if (type) {
        const types = type.split(',').map(t => t.trim()).filter(Boolean)
        if (types.length === 1) {
          where.type = types[0]
        } else if (types.length > 1) {
          where.type = { in: types }
        }
      }

      const [notifications, unreadCount] = await Promise.all([
        db.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            isRead: true,
            entityId: true,
            createdAt: true,
          },
        }),
        db.notification.count({
          where: { userId, isRead: false },
        }),
      ])

      return { success: true, notifications, unreadCount }
    }, CACHE_TTL.SHORT);

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, entityId } = body

    if (!userId || !title) {
      return NextResponse.json(
        { success: false, error: 'userId and title are required' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type: type || 'SYSTEM',
        title,
        message: message || '',
        isRead: false,
        entityId: entityId || null,
      },
    })

    // Invalidate notifications cache for this user
    cache.deleteByPrefix(`notifications:${userId}:`)

    return NextResponse.json({ success: true, notification }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds, userId, markAll } = body

    if (markAll && userId) {
      const result = await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
      // Invalidate cache
      cache.deleteByPrefix(`notifications:${userId}:`)
      return NextResponse.json({ success: true, markedCount: result.count })
    }

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      const result = await db.notification.updateMany({
        where: { id: { in: notificationIds }, isRead: false },
        data: { isRead: true },
      })
      // Invalidate cache for affected users (best effort)
      if (userId) cache.deleteByPrefix(`notifications:${userId}:`)
      return NextResponse.json({ success: true, markedCount: result.count })
    }

    return NextResponse.json(
      { success: false, error: 'Provide either { userId, markAll: true } or { notificationIds: string[] }' },
      { status: 400 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
