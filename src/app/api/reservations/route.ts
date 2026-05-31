import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, authErrorResponse } from '@/lib/auth-guard'
import { realtime } from '@/lib/realtime'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    // Use session user.id instead of body userId
    const userId = user.id

    const body = await request.json()
    const { agencyId, serviceId, reservedDate, preferredTime, fixedTimeEnabled } = body

    // Validate required fields
    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'agencyId is required' },
        { status: 400 }
      )
    }

    // Validate date if provided
    let targetDate: string | null = null
    if (reservedDate) {
      const parsed = new Date(reservedDate)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        )
      }
      // Format as YYYY-MM-DD
      targetDate = parsed.toISOString().split('T')[0]
      // Don't allow past dates
      const today = new Date().toISOString().split('T')[0]
      if (targetDate < today) {
        return NextResponse.json(
          { success: false, error: 'Cannot reserve for a past date' },
          { status: 400 }
        )
      }
    }

    // Check user exists and is a customer
    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { success: false, error: 'Only customers can join queues' },
        { status: 403 }
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

    // Check agency has an active subscription
    if (agency.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: "This agency's queue is currently unavailable. The agency needs an active subscription." },
        { status: 403 }
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

    // Check for duplicate active reservation (same user, agency, service, date)
    const duplicateWhere: Record<string, unknown> = {
      userId,
      agencyId,
      serviceId: resolvedServiceId,
      status: { in: ['WAITING', 'CALLED'] },
    }
    if (targetDate) {
      duplicateWhere.reservedDate = targetDate;
    } else {
      duplicateWhere.reservedDate = null;
    }
    const activeReservation = await db.reservation.findFirst({
      where: duplicateWhere,
    })
    if (activeReservation) {
      return NextResponse.json(
        { success: false, error: 'You already have an active reservation for this service' },
        { status: 409 }
      )
    }

    // Count current active reservations for the agency (same date)
    const countWhere: Record<string, unknown> = {
      agencyId,
      status: { in: ['WAITING', 'CALLED'] },
    }
    if (targetDate) {
      countWhere.reservedDate = targetDate;
    } else {
      countWhere.reservedDate = null;
    }
    const activeCount = await db.reservation.count({ where: countWhere })
    if (activeCount >= agency.maxActiveReservations) {
      return NextResponse.json(
        { success: false, error: 'Queue is full. Please try again later' },
        { status: 400 }
      )
    }

    // Generate next queue number per service (for the specific date or null=today)
    const lastWhere: Record<string, unknown> = { serviceId: resolvedServiceId }
    if (targetDate) {
      lastWhere.reservedDate = targetDate;
    } else {
      lastWhere.reservedDate = null;
    }
    // Count people currently waiting to estimate wait time
    const waitWhere: Record<string, unknown> = {
      agencyId,
      status: 'WAITING',
    }
    if (targetDate) {
      waitWhere.reservedDate = targetDate;
    } else {
      waitWhere.reservedDate = null;
    }
    const waitingCount = await db.reservation.count({ where: waitWhere })
    const estimatedWait = waitingCount * agency.averageServiceTime

    // Create reservation atomically in transaction to prevent duplicates
    const reservation = await db.$transaction(async (tx) => {
      // Re-check duplicate inside transaction
      const dupCheck = await tx.reservation.findFirst({ where: duplicateWhere });
      if (dupCheck) throw new Error('DUPLICATE');

      // Re-check capacity inside transaction
      const cnt = await tx.reservation.count({ where: countWhere });
      if (cnt >= agency.maxActiveReservations) throw new Error('FULL');

      const lastReservation = await tx.reservation.findFirst({
        where: lastWhere,
        orderBy: { queueNumber: 'desc' },
      });
      const nextNumber = (lastReservation?.queueNumber || 0) + 1;
      const displayNumber = `${service.prefix}-${String(nextNumber).padStart(3, '0')}`;

      const res = await tx.reservation.create({
        data: {
          userId,
          agencyId,
          serviceId: resolvedServiceId,
          queueNumber: nextNumber,
          displayNumber,
          status: 'WAITING',
          estimatedWait,
          reservedDate: targetDate,
          preferredTime: preferredTime || null,
          fixedTimeEnabled: fixedTimeEnabled !== undefined ? fixedTimeEnabled : (preferredTime ? true : false),
        },
        include: {
          agency: {
            select: { id: true, name: true, nameFr: true, nameAr: true, customCode: true },
          },
          service: {
            select: { id: true, name: true, nameFr: true, nameAr: true, prefix: true },
          },
        },
      });

      // Update queue settings lastIssuedNumber
      if (agency.queueSettings.length > 0) {
        await tx.queueSettings.update({
          where: { id: agency.queueSettings[0].id },
          data: { lastIssuedNumber: nextNumber },
        });
      }

      // Create notification
      const dateLabel = targetDate ? ` (${targetDate})` : '';
      await tx.notification.create({
        data: {
          userId,
          type: 'QUEUE_JOINED',
          title: 'Reservation Confirmed',
          message: `Your ticket ${displayNumber} for ${agency.name} - ${service.name}${dateLabel}. Estimated wait: ${estimatedWait} minutes.`,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'QUEUE_JOIN',
          entityType: 'RESERVATION',
          entityId: res.id,
          details: JSON.stringify({
            agencyId,
            serviceId: resolvedServiceId,
            displayNumber,
            estimatedWait,
            reservedDate: targetDate,
          }),
        },
      });

      return res;
    });

    // Emit realtime events
    await realtime.queueUpdated(agencyId, {
      action: 'new-reservation',
      reservationId: reservation.id,
      displayNumber: reservation.displayNumber,
      userId,
    })
    await realtime.agencyStatsUpdated(agencyId, {
      action: 'queue-changed',
      agencyId,
    })
    await realtime.positionChanged(userId, {
      reservationId: reservation.id,
      displayNumber: reservation.displayNumber,
      position: reservation.queueNumber,
      estimatedWait: reservation.estimatedWait,
      agencyId,
    })

    return NextResponse.json({ success: true, reservation }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'DUPLICATE') {
      return NextResponse.json(
        { success: false, error: 'You already have an active reservation for this service' },
        { status: 409 }
      )
    }
    if (error instanceof Error && error.message === 'FULL') {
      return NextResponse.json(
        { success: false, error: 'Queue is full. Please try again later' },
        { status: 400 }
      )
    }
    return authErrorResponse(error)
  }
}
