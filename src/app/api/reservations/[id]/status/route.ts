import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireResourceOwnership, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'
import { validateBody, updateReservationStatusSchema } from '@/lib/validations'
import { emitQueueEvent, emitReservationEvent, emitNotificationEvent, emitKioskEvent } from '@/lib/realtime-emit'
import type { QueueEventType } from '@/lib/realtime-emit'

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  WAITING: ['CALLED', 'CANCELLED'],
  CALLED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  SERVING: ['COMPLETED'],
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validation = validateBody(updateReservationStatusSchema, body)
    if (validation.error) return validation.error

    const { status } = validation.data

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

    // Verify ownership or agency access (walk-in reservations have no userId)
    if (!reservation.userId) {
      await requireAgencyAccess(request, reservation.agencyId)
    } else {
      try {
        await requireResourceOwnership(request, reservation.userId)
      } catch {
        await requireAgencyAccess(request, reservation.agencyId)
      }
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
      case 'SERVING':
        updateData.completedAt = now
        break
    }

    // Update reservation
    const updatedReservation = await db.reservation.update({
      where: { id },
      data: updateData,
    })

    // Create notification (only for registered users, not walk-ins)
    if (reservation.userId) {
      const notificationType = `QUEUE_${status}` as const
      const titleMap: Record<string, string> = {
        CALLED: 'Your Turn!',
        COMPLETED: 'Service Completed',
        CANCELLED: 'Reservation Cancelled',
        NO_SHOW: 'Missed Your Turn',
        SERVING: 'Being Served',
      }
      const messageMap: Record<string, string> = {
        CALLED: `Please proceed to ${reservation.agency.name} - ${reservation.service.name}. Your ticket: ${reservation.displayNumber}`,
        COMPLETED: `Your visit at ${reservation.agency.name} has been completed.`,
        CANCELLED: `Your reservation ${reservation.displayNumber} at ${reservation.agency.name} has been cancelled.`,
        NO_SHOW: `You missed your turn for ticket ${reservation.displayNumber} at ${reservation.agency.name}.`,
        SERVING: `You are now being served at ${reservation.agency.name} - ${reservation.service.name}.`,
      }

      await db.notification.create({
        data: {
          userId: reservation.userId,
          type: notificationType,
          title: titleMap[status] || 'Reservation Update',
          message: messageMap[status] || 'Your reservation status has been updated.',
        },
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: reservation.userId ?? undefined,
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

    // Emit realtime events based on new status (fire-and-forget)
    const queueEventTypeMap: Record<string, QueueEventType> = {
      CALLED: 'queue:called',
      COMPLETED: 'queue:completed',
      CANCELLED: 'queue:cancelled',
      NO_SHOW: 'queue:no-show',
      SERVING: 'queue:updated',
    }
    const queueEventType = queueEventTypeMap[status]
    if (queueEventType) {
      emitQueueEvent(queueEventType, reservation.agencyId, {
        reservationId: id,
        displayNumber: reservation.displayNumber,
        previousStatus: reservation.status,
        newStatus: status,
        serviceId: reservation.serviceId,
      })
    }

    // Emit reservation event
    const reservationEventType = status === 'CANCELLED' ? 'reservation:cancelled' : 'reservation:updated'
    emitReservationEvent(reservationEventType, reservation.agencyId, reservation.userId ?? undefined, {
      reservationId: id,
      displayNumber: reservation.displayNumber,
      previousStatus: reservation.status,
      newStatus: status,
    })

    // Emit notification event for key status changes
    if (reservation.userId && status === 'CALLED') {
      emitNotificationEvent('notification:your-turn', reservation.userId, {
        ticketNumber: reservation.displayNumber,
        agencyName: reservation.agency.name,
      })
    } else if (reservation.userId && status === 'NO_SHOW') {
      emitNotificationEvent('notification:new', reservation.userId, {
        message: `You missed your turn for ticket ${reservation.displayNumber}`,
      })
    }

    // Emit kiosk update for called/completed/no-show
    if (['CALLED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(status)) {
      emitKioskEvent(reservation.agencyId, {
        action: `reservation-${status.toLowerCase()}`,
        displayNumber: reservation.displayNumber,
      })
    }

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
    })
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
