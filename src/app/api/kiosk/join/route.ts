import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateBody, kioskJoinSchema } from '@/lib/validations';
import { enforceRateLimit, KIOSK_RATE_LIMIT, isRateLimitError, rateLimitErrorResponse, recordSuccessfulRequest, recordFailedRequest } from '@/lib/rate-limit';
import { emitQueueEvent, emitKioskEvent } from '@/lib/realtime-emit';

export async function POST(request: NextRequest) {
  let clientIp: string | undefined;
  try {
    // Rate limit + IP blocking check for public kiosk endpoint
    clientIp = enforceRateLimit(request, KIOSK_RATE_LIMIT);

    const body = await request.json();
    const validation = validateBody(kioskJoinSchema, body);
    if (validation.error) {
      if (clientIp) recordFailedRequest(clientIp);
      return validation.error;
    }

    const { agencyId, serviceId, customerName } = validation.data;

    // Check agency exists and queue is open
    const agency = await db.agency.findUnique({
      where: { id: agencyId, isActive: true },
      include: { queueSettings: { take: 1, orderBy: { updatedAt: 'desc' } } },
    });

    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      );
    }

    if (!agency.isQueueOpen) {
      return NextResponse.json(
        { success: false, error: 'Queue is currently closed' },
        { status: 400 }
      );
    }

    if (agency.queueSettings.length > 0 && agency.queueSettings[0].isPaused) {
      return NextResponse.json(
        { success: false, error: 'Queue is currently paused' },
        { status: 400 }
      );
    }

    // Validate service
    const service = await db.service.findUnique({
      where: { id: serviceId, agencyId },
    });

    if (!service || !service.isActive) {
      return NextResponse.json(
        { success: false, error: 'Service not found or inactive' },
        { status: 404 }
      );
    }

    // Check capacity
    const activeCount = await db.reservation.count({
      where: { agencyId, status: { in: ['WAITING', 'CALLED'] } },
    });

    if (activeCount >= agency.maxActiveReservations) {
      return NextResponse.json(
        { success: false, error: 'Queue is full' },
        { status: 400 }
      );
    }

    // Compute position and estimated wait
    const waitingCount = await db.reservation.count({
      where: { agencyId, serviceId, status: 'WAITING' },
    });
    const estimatedWait = waitingCount * agency.averageServiceTime;

    // Create reservation atomically
    const reservation = await db.$transaction(async (tx) => {
      // Re-check capacity inside transaction
      const cnt = await tx.reservation.count({
        where: { agencyId, status: { in: ['WAITING', 'CALLED'] } },
      });
      if (cnt >= agency.maxActiveReservations) throw new Error('FULL');

      const lastReservation = await tx.reservation.findFirst({
        where: { serviceId },
        orderBy: { queueNumber: 'desc' },
      });
      const nextNumber = (lastReservation?.queueNumber || 0) + 1;
      const displayNumber = `${service.prefix}-${String(nextNumber).padStart(3, '0')}`;

      const res = await tx.reservation.create({
        data: {
          agencyId,
          serviceId,
          queueNumber: nextNumber,
          displayNumber,
          status: 'WAITING',
          estimatedWait,
          isWalkIn: true,
          walkInCustomerName: customerName?.trim() || 'Anonymous',
          userId: null,
        },
      });

      // Update queue settings
      if (agency.queueSettings.length > 0) {
        await tx.queueSettings.update({
          where: { id: agency.queueSettings[0].id },
          data: { lastIssuedNumber: nextNumber },
        });
      }

      return res;
    });

    // Compute position in queue
    const position = await db.reservation.count({
      where: {
        agencyId,
        serviceId,
        status: 'WAITING',
        joinedAt: { lte: reservation.joinedAt },
      },
    });

    // Emit realtime events (non-blocking — fire and forget)
    emitQueueEvent('queue:walk-in', agencyId, {
      reservationId: reservation.id,
      displayNumber: reservation.displayNumber,
      customerName: customerName || 'Anonymous',
      serviceId,
      estimatedWait,
    })
    emitKioskEvent(agencyId, {
      action: 'kiosk-join',
      displayNumber: reservation.displayNumber,
    })

    if (clientIp) recordSuccessfulRequest(clientIp);
    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        ticketNumber: reservation.displayNumber,
        position,
        estimatedWaitMinutes: estimatedWait,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    if (isRateLimitError(error)) {
      return rateLimitErrorResponse(error);
    }
    if (clientIp) recordFailedRequest(clientIp);
    if (error instanceof Error && error.message === 'FULL') {
      return NextResponse.json(
        { success: false, error: 'Queue is full' },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
