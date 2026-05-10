import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const { status, updatedBy } = body

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
        userId: updatedBy || reservation.userId,
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

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
