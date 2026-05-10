import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agencyId, serviceId, calledBy } = body

    if (!agencyId || !serviceId) {
      return NextResponse.json(
        { success: false, error: 'agencyId and serviceId are required' },
        { status: 400 }
      )
    }

    // Find the next WAITING reservation for this service
    const nextReservation = await db.reservation.findFirst({
      where: {
        agencyId,
        serviceId,
        status: 'WAITING',
      },
      orderBy: { joinedAt: 'asc' },
      include: {
        agency: {
          select: { id: true, name: true, nameFr: true, nameAr: true },
        },
        service: {
          select: { id: true, name: true, nameFr: true, nameAr: true },
        },
        user: {
          select: { id: true, username: true, fullName: true, language: true, phoneNumber: true },
        },
      },
    })

    if (!nextReservation) {
      return NextResponse.json(
        { success: false, error: 'No waiting reservations for this service' },
        { status: 404 }
      )
    }

    // Update reservation status to CALLED
    const updatedReservation = await db.reservation.update({
      where: { id: nextReservation.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
      include: {
        agency: {
          select: { id: true, name: true, nameFr: true, nameAr: true },
        },
        service: {
          select: { id: true, name: true, nameFr: true, nameAr: true, prefix: true },
        },
        user: {
          select: { id: true, username: true, fullName: true, language: true, phoneNumber: true },
        },
      },
    })

    // Update queue settings currentServingNumber
    const queueSettings = await db.queueSettings.findFirst({
      where: { agencyId },
      orderBy: { updatedAt: 'desc' },
    })
    if (queueSettings) {
      await db.queueSettings.update({
        where: { id: queueSettings.id },
        data: {
          currentServingNumber: nextReservation.queueNumber,
        },
      })
    }

    // Create notification for the user
    await db.notification.create({
      data: {
        userId: nextReservation.userId,
        type: 'QUEUE_CALLED',
        title: 'Your Turn!',
        message: `Please proceed to ${nextReservation.agency.name} - ${nextReservation.service.name}. Your ticket: ${nextReservation.displayNumber}`,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: calledBy,
        action: 'QUEUE_CALL',
        entityType: 'RESERVATION',
        entityId: nextReservation.id,
        details: JSON.stringify({
          agencyId,
          serviceId,
          displayNumber: nextReservation.displayNumber,
          userId: nextReservation.userId,
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
