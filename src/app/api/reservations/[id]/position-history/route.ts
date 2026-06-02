import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireResourceOwnership, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the reservation
    const reservation = await db.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        agencyId: true,
        status: true,
        queueNumber: true,
        displayNumber: true,
        joinedAt: true,
        calledAt: true,
        service: { select: { name: true, prefix: true } },
        agency: { select: { averageServiceTime: true } },
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Verify ownership or agency access
    try {
      await requireResourceOwnership(request, reservation.userId ?? '')
    } catch {
      await requireAgencyAccess(request, reservation.agencyId)
    }

    // Get current position in queue by counting WAITING reservations ahead
    const peopleAhead = await db.reservation.count({
      where: {
        agencyId: reservation.agencyId,
        status: 'WAITING',
        joinedAt: { lt: reservation.joinedAt },
        id: { not: reservation.id },
      },
    })

    const currentPosition = reservation.status === 'CALLED' ? 1 : peopleAhead + 1

    // Generate position history based on joined time and avg service time
    const avgServiceTime = reservation.agency.averageServiceTime || 10
    const joinedAt = new Date(reservation.joinedAt)
    const now = new Date()

    // Calculate the initial position (when they joined)
    const initialWaiting = await db.reservation.count({
      where: {
        agencyId: reservation.agencyId,
        status: { in: ['WAITING', 'CALLED', 'COMPLETED'] },
        joinedAt: { lt: reservation.joinedAt },
      },
    })

    const initialPosition = initialWaiting + 1

    // Build timeline entries
    const timeline = []
    let pos = initialPosition
    let currentTime = new Date(joinedAt)

    // Entry 1: Joined the queue
    timeline.push({
      position: initialPosition,
      timestamp: joinedAt.toISOString(),
      direction: 'joined' as const,
      label: 'joined',
    })

    // Simulate position changes based on avg service time
    while (pos > currentPosition) {
      pos--
      const minutesElapsed = (initialPosition - pos) * avgServiceTime
      currentTime = new Date(joinedAt.getTime() + minutesElapsed * 60000)

      if (currentTime > now) {
        currentTime = new Date(now)
      }

      timeline.push({
        position: pos,
        timestamp: currentTime.toISOString(),
        direction: (pos === currentPosition ? 'current' : 'up') as 'current' | 'up',
        label: pos === currentPosition ? 'current' : 'movedUp',
      })
    }

    if (timeline.length === 1 && initialPosition === currentPosition) {
      timeline[0].direction = 'current'
    }

    // Check if there's a "called" event
    if (reservation.status === 'CALLED' && reservation.calledAt) {
      const lastEntry = timeline[timeline.length - 1]
      if (lastEntry && lastEntry.position === 1) {
        lastEntry.timestamp = reservation.calledAt.toISOString()
        lastEntry.direction = 'current'
        lastEntry.label = 'called'
      }
    }

    return NextResponse.json({
      success: true,
      timeline,
      currentPosition,
      initialPosition,
      totalChanges: Math.max(0, initialPosition - currentPosition),
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
