import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireResourceOwnership, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { realtime } from '@/lib/realtime'

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  WAITING: ['CALLED', 'CANCELLED'],
  CALLED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  SERVED: ['COMPLETED'],
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['CALLED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'SERVED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Find reservation
    const reservation = await db.reservation.findUnique({
      where: { id },
      include: {
        agency: {
          select: { id: true, name: true },
        },
        service: {
          select: { id: true, name: true },
        },
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
      await requireResourceOwnership(request, reservation.userId)
    } catch {
      // If not the owner, check agency access
      await requireAgencyAccess(request, reservation.agencyId)
    }

    // Validate transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[reservation.status] || []
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${reservation.status} to ${status}` },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = { status }
    const now = new Date()

    switch (status) {
      case 'CALLED':
        updateData.calledAt = now
        break
      case 'COMPLETED':
        updateData.completedAt = now
        break
      case 'CANCELLED':
        updateData.cancelledAt = now
        break
      case 'NO_SHOW':
        updateData.completedAt = now
        break
      case 'SERVED':
        updateData.completedAt = now
        break
    }

    // Update reservation
    const updatedReservation = await db.reservation.update({
      where: { id },
      data: updateData,
    })

    // Create notification
    const notificationType = `QUEUE_${status}` as const
    const titleMap: Record<string, string> = {
      CALLED: 'Your Turn!',
      COMPLETED: 'Service Completed',
      CANCELLED: 'Reservation Cancelled',
      NO_SHOW: 'Missed Your Turn',
      SERVED: 'Being Served',
    }
    const messageMap: Record<string, string> = {
      CALLED: `Please proceed to ${reservation.agency.name} - ${reservation.service.name}. Your ticket: ${reservation.displayNumber}`,
      COMPLETED: `Your visit at ${reservation.agency.name} has been completed.`,
      CANCELLED: `Your reservation ${reservation.displayNumber} at ${reservation.agency.name} has been cancelled.`,
      NO_SHOW: `You missed your turn for ticket ${reservation.displayNumber} at ${reservation.agency.name}.`,
      SERVED: `You are now being served at ${reservation.agency.name} - ${reservation.service.name}.`,
    }

    await db.notification.create({
      data: {
        userId: reservation.userId,
        type: notificationType,
        title: titleMap[status] || 'Reservation Update',
        message: messageMap[status] || 'Your reservation status has been updated.',
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: reservation.userId,
        action: status === 'COMPLETED' ? 'QUEUE_COMPLETE' :
                status === 'CANCELLED' ? 'QUEUE_CANCEL' :
                status === 'NO_SHOW' ? 'QUEUE_NOSHOW' : 'QUEUE_CALL',
        entityType: 'RESERVATION',
        entityId: id,
        details: JSON.stringify({
          reservationId: id,
          previousStatus: reservation.status,
          newStatus: status,
          displayNumber: reservation.displayNumber,
        }),
      },
    })

    // Emit realtime events based on status change
    if (reservation.userId) {
      if (status === 'COMPLETED') {
        await realtime.serviceCompleted(reservation.userId, {
          reservationId: id,
          displayNumber: reservation.displayNumber,
          agencyId: reservation.agency.id,
          agencyName: reservation.agency.name,
        })
      } else if (status === 'CALLED') {
        await realtime.turnCalled(reservation.userId, {
          reservationId: id,
          displayNumber: reservation.displayNumber,
          agencyId: reservation.agency.id,
          message: 'Your turn has been called!',
        })
      } else if (status === 'CANCELLED') {
        await realtime.reservationCancelled(reservation.userId, {
          reservationId: id,
          displayNumber: reservation.displayNumber,
          agencyId: reservation.agency.id,
        })
      }
      await realtime.positionChanged(reservation.userId, {
        reservationId: id,
        displayNumber: reservation.displayNumber,
        newStatus: status,
        agencyId: reservation.agency.id,
      })
    }

    // Notify agency dashboard of queue update
    await realtime.queueUpdated(reservation.agency.id, {
      action: 'status-change',
      reservationId: id,
      displayNumber: reservation.displayNumber,
      newStatus: status,
    })
    await realtime.agencyStatsUpdated(reservation.agency.id, {
      action: 'queue-changed',
      agencyId: reservation.agency.id,
    })

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
