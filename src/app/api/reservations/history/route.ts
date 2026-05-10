import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const where = {
      userId,
      status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'SERVED'] as const },
    }

    const [reservations, total] = await Promise.all([
      db.reservation.findMany({
        where,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              nameFr: true,
              nameAr: true,
              customCode: true,
              category: true,
              logoUrl: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              nameFr: true,
              nameAr: true,
              prefix: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.reservation.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      reservations,
      total,
      limit,
      offset,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
