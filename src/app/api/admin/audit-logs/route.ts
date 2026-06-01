import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (action && action !== 'ALL') {
      where.action = action
    }

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType
    }

    if (userId && userId !== 'ALL') {
      where.userId = userId
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Search filter: search in action, details, entityType
    if (search && search.trim()) {
      const q = search.trim()
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { details: { contains: q, mode: 'insensitive' } },
        { entityType: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [auditLogs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ])

    // Get unique actions and entity types for filter dropdowns
    const [uniqueActions, uniqueEntityTypes, uniqueUsers] = await Promise.all([
      db.auditLog.findMany({
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      }),
      db.auditLog.findMany({
        select: { entityType: true },
        distinct: ['entityType'],
        orderBy: { entityType: 'asc' },
      }),
      db.auditLog.findMany({
        where: { userId: { not: null } },
        select: { userId: true, user: { select: { id: true, username: true, fullName: true } } },
        distinct: ['userId'],
      }),
    ])

    return NextResponse.json({
      success: true,
      auditLogs,
      total,
      limit,
      offset,
      filters: {
        actions: uniqueActions.map(a => a.action),
        entityTypes: uniqueEntityTypes.map(e => e.entityType).filter(Boolean),
        users: uniqueUsers.map(u => u.user).filter(Boolean),
      },
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
