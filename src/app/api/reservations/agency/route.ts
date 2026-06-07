import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')
    const status = searchParams.get('status')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'agencyId is required' },
        { status: 400 }
      )
    }

    // Verify the user has access to this agency
    await requireAgencyAccess(request, agencyId)

    const where: Record<string, unknown> = { agencyId }
    if (status) {
      where.status = status
    }

    const [reservations, total] = await Promise.all([
      db.reservation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              phoneNumber: true,
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
    return authErrorResponse(error)
  }
}
