import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, handleAuthError } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request)
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

    if (reservation.userId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
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
    // This creates a realistic mock timeline of how the position changed
    const avgServiceTime = reservation.agency.averageServiceTime || 10
    const joinedAt = new Date(reservation.joinedAt)
    const now = new Date()

    // Calculate the initial position (when they joined)
    // Count how many people were already waiting when this person joined
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
    // Each step = one person served ahead, advancing the position
    while (pos > currentPosition) {
      pos--
      // Estimate when this position change occurred
      const minutesElapsed = (initialPosition - pos) * avgServiceTime
      currentTime = new Date(joinedAt.getTime() + minutesElapsed * 60000)

      // Don't go past current time
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

    // If no changes yet and still at initial position, mark as current
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
    const authError = handleAuthError(error)
    if (authError) return authError
    const message =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
