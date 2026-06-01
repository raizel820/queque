import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userId = user.id

    // Query 1: Fetch user's active reservations with agency/service info (1 query)
    const reservations = await db.reservation.findMany({
      where: {
        userId,
        status: { in: ['WAITING', 'CALLED'] },
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            nameAr: true,
            customCode: true,
            category: true,
            address: true,
            logoUrl: true,
            averageServiceTime: true,
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
      take: 50, // Safety limit
    })

    if (reservations.length === 0) {
      return NextResponse.json({ success: true, reservations: [] })
    }

    // Collect unique agency IDs
    const agencyIds = [...new Set(reservations.map((r) => r.agencyId))]

    // Query 2: Batch-fetch ALL WAITING reservations for these agencies (1 query)
    const waitingReservations = await db.reservation.findMany({
      where: {
        agencyId: { in: agencyIds },
        status: 'WAITING',
      },
      orderBy: { joinedAt: 'asc' },
      select: { id: true, agencyId: true, joinedAt: true },
    })

    // Query 3: Batch-fetch current serving number per agency (1 query)
    const currentServings = await db.reservation.findMany({
      where: {
        agencyId: { in: agencyIds },
        status: { in: ['CALLED', 'SERVED'] },
        calledAt: { not: null },
      },
      orderBy: { calledAt: 'desc' },
      distinct: ['agencyId'],
      select: { agencyId: true, displayNumber: true },
    })

    // Build lookup maps
    const servingByAgency = new Map(currentServings.map((c) => [c.agencyId, c.displayNumber]))

    const waitingByAgency = new Map<string, { id: string; agencyId: string; joinedAt: Date }[]>()
    for (const wr of waitingReservations) {
      if (!waitingByAgency.has(wr.agencyId)) {
        waitingByAgency.set(wr.agencyId, [])
      }
      waitingByAgency.get(wr.agencyId)!.push(wr)
    }

    // Enrich in-memory (zero additional DB calls)
    const enriched = reservations.map((res) => {
      const agencyWaiting = waitingByAgency.get(res.agencyId) ?? []
      const peopleAhead = agencyWaiting.filter(
        (w) => w.joinedAt < res.joinedAt && w.id !== res.id
      ).length

      const position = res.status === 'CALLED' ? 1 : peopleAhead + 1
      const currentServingNumber = servingByAgency.get(res.agencyId) ?? '0'
      const avgServiceTime = res.agency.averageServiceTime || 10
      const estimatedWait = res.status === 'CALLED' ? 0 : peopleAhead * avgServiceTime

      return {
        ...res,
        peopleAhead,
        position,
        currentServingNumber,
        estimatedWait,
      }
    })

    return NextResponse.json({ success: true, reservations: enriched })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
