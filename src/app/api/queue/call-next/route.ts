import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agencyId, serviceId } = body

    if (!agencyId || !serviceId) {
      return NextResponse.json(
        { success: false, error: 'agencyId and serviceId are required' },
        { status: 400 }
      )
    }

    // Verify agency access
    const user = await requireAgencyAccess(request, agencyId)

    // Check agency has an active subscription
    const agencyCheck = await db.agency.findUnique({ where: { id: agencyId } })
    if (!agencyCheck) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }
    if (agencyCheck.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'An active subscription is required to use queue features' },
        { status: 403 }
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

    // Create audit log — use session user.id as calledBy
    await db.auditLog.create({
      data: {
        userId: user.id,
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
    return authErrorResponse(error)
  }
}
