import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

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
    })

    // Calculate position, peopleAhead, estimatedWait, currentServingNumber for each
    const enriched = await Promise.all(
      reservations.map(async (res) => {
        // Count people ahead: WAITING reservations for same agency+service joined before this one
        const peopleAhead = await db.reservation.count({
          where: {
            agencyId: res.agencyId,
            status: 'WAITING',
            joinedAt: { lt: res.joinedAt },
            id: { not: res.id },
          },
        })

        const position = res.status === 'CALLED' ? 1 : peopleAhead + 1

        // Get current serving number for this agency (latest CALLED or SERVED reservation)
        const currentServing = await db.reservation.findFirst({
          where: {
            agencyId: res.agencyId,
            status: { in: ['CALLED', 'SERVED'] },
          },
          orderBy: { calledAt: 'desc' },
          select: { displayNumber: true },
        })

        const currentServingNumber = currentServing?.displayNumber ?? '0'

        // Calculate estimated wait
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
    )

    return NextResponse.json({ success: true, reservations: enriched })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
