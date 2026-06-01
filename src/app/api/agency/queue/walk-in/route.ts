import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';
import { emitQueueEvent, emitKioskEvent } from '@/lib/realtime-emit';

const walkInSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
  serviceId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateBody(walkInSchema, body);
    if (validation.error) return validation.error;

    const { agencyId, serviceId, customerName } = validation.data;

    await requireAgencyAccess(request, agencyId);

    // Check agency exists and queue is open
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: { queueSettings: { take: 1, orderBy: { updatedAt: 'desc' } } },
    });

    if (!agency) {
      return NextResponse.json({ success: false, error: 'Agency not found' }, { status: 404 });
    }

    if (!agency.isQueueOpen) {
      return NextResponse.json({ success: false, error: 'Queue is currently closed' }, { status: 400 });
    }

    if (agency.queueSettings.length > 0 && agency.queueSettings[0].isPaused) {
      return NextResponse.json({ success: false, error: 'Queue is currently paused' }, { status: 400 });
    }

    // Resolve service
    let resolvedServiceId = serviceId;
    if (!resolvedServiceId) {
      const firstService = await db.service.findFirst({
        where: { agencyId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (firstService) {
        resolvedServiceId = firstService.id;
      } else {
        const defaultService = await db.service.create({
          data: { agencyId, name: 'General', nameAr: 'عام', nameFr: 'Général', prefix: 'A' },
        });
        resolvedServiceId = defaultService.id;
      }
    }

    const service = await db.service.findUnique({ where: { id: resolvedServiceId } });
    if (!service || !service.isActive) {
      return NextResponse.json({ success: false, error: 'Service not found or inactive' }, { status: 404 });
    }

    // Check capacity
    const activeCount = await db.reservation.count({
      where: { agencyId, status: { in: ['WAITING', 'CALLED'] } },
    });

    if (activeCount >= agency.maxActiveReservations) {
      return NextResponse.json({ success: false, error: 'Queue is full' }, { status: 400 });
    }

    // Estimate wait
    const waitingCount = await db.reservation.count({
      where: { agencyId, status: 'WAITING' },
    });
    const estimatedWait = waitingCount * agency.averageServiceTime;

    // Create walk-in reservation atomically
    const reservation = await db.$transaction(async (tx) => {
      // Re-check capacity
      const cnt = await tx.reservation.count({
        where: { agencyId, status: { in: ['WAITING', 'CALLED'] } },
      });
      if (cnt >= agency.maxActiveReservations) throw new Error('FULL');

      const lastReservation = await tx.reservation.findFirst({
        where: { serviceId: resolvedServiceId },
        orderBy: { queueNumber: 'desc' },
      });
      const nextNumber = (lastReservation?.queueNumber || 0) + 1;
      const displayNumber = `${service.prefix}-${String(nextNumber).padStart(3, '0')}`;

      const res = await tx.reservation.create({
        data: {
          agencyId,
          serviceId: resolvedServiceId,
          queueNumber: nextNumber,
          displayNumber,
          status: 'WAITING',
          estimatedWait,
          isWalkIn: true,
          walkInCustomerName: customerName.trim(),
          userId: null,
        },
        include: {
          agency: { select: { id: true, name: true, nameFr: true, nameAr: true } },
          service: { select: { id: true, name: true, nameFr: true, nameAr: true, prefix: true } },
        },
      });

      // Update queue settings
      if (agency.queueSettings.length > 0) {
        await tx.queueSettings.update({
          where: { id: agency.queueSettings[0].id },
          data: { lastIssuedNumber: nextNumber },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'WALK_IN_ADDED',
          entityType: 'RESERVATION',
          entityId: res.id,
          details: JSON.stringify({
            agencyId,
            serviceId: resolvedServiceId,
            displayNumber,
            customerName: customerName.trim(),
            estimatedWait,
          }),
        },
      });

      return res;
    });

    // Emit realtime events (non-blocking — fire and forget)
    emitQueueEvent('queue:walk-in', agencyId, {
      reservationId: reservation.id,
      displayNumber: reservation.displayNumber,
      customerName: customerName.trim(),
      serviceId: resolvedServiceId,
      estimatedWait,
    })
    emitKioskEvent(agencyId, {
      action: 'walk-in',
      displayNumber: reservation.displayNumber,
    })

    return NextResponse.json({ success: true, reservation }, { status: 201 });
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
