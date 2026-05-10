import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, agencyId, serviceId } = body

    // Validate required fields
    if (!userId || !agencyId) {
      return NextResponse.json(
        { success: false, error: 'userId and agencyId are required' },
        { status: 400 }
      )
    }

    // Check user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check agency exists and queue is open
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: { queueSettings: { take: 1, orderBy: { updatedAt: 'desc' } } },
    })
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    if (!agency.isQueueOpen) {
      return NextResponse.json(
        { success: false, error: 'Queue is currently closed' },
        { status: 400 }
      )
    }

    if (agency.queueSettings.length > 0 && agency.queueSettings[0].isPaused) {
      return NextResponse.json(
        { success: false, error: 'Queue is currently paused' },
        { status: 400 }
      )
    }

    // Check service exists (or use agency's first active service)
    let resolvedServiceId = serviceId;
    if (!resolvedServiceId) {
      const firstService = await db.service.findFirst({
        where: { agencyId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (firstService) {
        resolvedServiceId = firstService.id;
      } else {
        // Create a default service if none exist
        const defaultService = await db.service.create({
          data: {
            agencyId,
            name: 'General',
            nameAr: 'عام',
            nameFr: 'Général',
            prefix: 'A',
          },
        });
        resolvedServiceId = defaultService.id;
      }
    }

    const service = await db.service.findUnique({
      where: { id: resolvedServiceId },
    })
    if (!service || !service.isActive) {
      return NextResponse.json(
        { success: false, error: 'Service not found or inactive' },
        { status: 404 }
      )
    }

    // Check for duplicate active reservation
    const activeReservation = await db.reservation.findFirst({
      where: {
        userId,
        agencyId,
        serviceId: resolvedServiceId,
        status: { in: ['WAITING', 'CALLED'] },
      },
    })
    if (activeReservation) {
      return NextResponse.json(
        { success: false, error: 'You already have an active reservation for this service' },
        { status: 409 }
      )
    }

    // Count current active reservations for the agency
    const activeCount = await db.reservation.count({
      where: {
        agencyId,
        status: { in: ['WAITING', 'CALLED'] },
      },
    })
    if (activeCount >= agency.maxActiveReservations) {
      return NextResponse.json(
        { success: false, error: 'Queue is full. Please try again later' },
        { status: 400 }
      )
    }

    // Generate next queue number per service
    const lastReservation = await db.reservation.findFirst({
      where: { serviceId: resolvedServiceId },
      orderBy: { queueNumber: 'desc' },
    })
    const nextNumber = (lastReservation?.queueNumber || 0) + 1
    const displayNumber = `${service.prefix}-${String(nextNumber).padStart(3, '0')}`

    // Calculate estimated wait time
    const waitingCount = await db.reservation.count({
      where: { serviceId: resolvedServiceId, status: 'WAITING' },
    })
    const estimatedWait = waitingCount * agency.averageServiceTime

    // Create reservation
    const reservation = await db.reservation.create({
      data: {
        userId,
        agencyId,
        serviceId: resolvedServiceId,
        queueNumber: nextNumber,
        displayNumber,
        status: 'WAITING',
        estimatedWait,
      },
      include: {
        agency: {
          select: { id: true, name: true, nameFr: true, nameAr: true, customCode: true },
        },
        service: {
          select: { id: true, name: true, nameFr: true, nameAr: true, prefix: true },
        },
      },
    })

    // Update queue settings lastIssuedNumber
    if (agency.queueSettings.length > 0) {
      await db.queueSettings.update({
        where: { id: agency.queueSettings[0].id },
        data: { lastIssuedNumber: nextNumber },
      })
    }

    // Create notification
    await db.notification.create({
      data: {
        userId,
        type: 'QUEUE_JOINED',
        title: 'Reservation Confirmed',
        message: `Your ticket ${displayNumber} for ${agency.name} - ${service.name}. Estimated wait: ${estimatedWait} minutes.`,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: 'QUEUE_CALL',
        entityType: 'RESERVATION',
        entityId: reservation.id,
        details: JSON.stringify({
          agencyId,
          serviceId,
          displayNumber,
          estimatedWait,
        }),
      },
    })

    return NextResponse.json({ success: true, reservation }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
