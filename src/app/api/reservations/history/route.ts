import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userId = user.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const completedStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'SERVED'] as string[];

    const where = {
      userId,
      status: { in: completedStatuses },
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

    // Map with safe access for fields that may not exist in Prisma Client
    const mappedReservations = reservations.map(r => {
      const rAny = r as Record<string, unknown>;
      return {
        id: r.id,
        userId: r.userId,
        agencyId: r.agencyId,
        serviceId: r.serviceId,
        queueNumber: r.queueNumber,
        displayNumber: r.displayNumber,
        status: r.status,
        estimatedWait: r.estimatedWait,
        reservedDate: r.reservedDate,
        joinedAt: r.joinedAt,
        calledAt: r.calledAt,
        completedAt: r.completedAt,
        cancelledAt: r.cancelledAt,
        rating: r.rating,
        feedback: (rAny.feedback as string) ?? null,
        ratedAt: (rAny.ratedAt as Date) ?? null,
        agency: r.agency,
        service: r.service,
      }
    })

    return NextResponse.json({
      success: true,
      reservations: mappedReservations,
      total,
      limit,
      offset,
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
