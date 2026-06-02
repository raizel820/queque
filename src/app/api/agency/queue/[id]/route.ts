import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';
import { emitQueueEvent, emitNotificationEvent, emitKioskEvent } from '@/lib/realtime-emit';

const queueActionSchema = z.object({
  action: z.enum(['complete', 'no_show', 'cancel']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = validateBody(queueActionSchema, body);
    if (validation.error) return validation.error;

    const { action } = validation.data;

    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Verify the authenticated user has access to this reservation's agency
    await requireAgencyAccess(req, reservation.agencyId);

    const statusMap: Record<string, string> = {
      complete: 'COMPLETED',
      no_show: 'NO_SHOW',
      cancel: 'CANCELLED',
    };

    const status = statusMap[action];
    const updateData: Record<string, unknown> = {
      status,
      completedAt: action === 'complete' ? new Date() : undefined,
      cancelledAt: action === 'cancel' ? new Date() : undefined,
    };

    await db.reservation.update({
      where: { id },
      data: updateData,
    });

    // Create notification
    const typeMap: Record<string, string> = {
      complete: 'COMPLETED',
      no_show: 'NO_SHOW',
      cancel: 'CANCELLED',
    };

    // Create notification (only for registered users)
    if (reservation.userId) {
      await db.notification.create({
        data: {
          userId: reservation.userId,
          type: typeMap[action],
          title: `Reservation ${status}`,
          message: `Your reservation ${reservation.displayNumber} has been ${status.toLowerCase()}.`,
        },
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: reservation.userId ?? undefined,
        action: `QUEUE_${action.toUpperCase()}`,
        entityType: 'RESERVATION',
        entityId: id,
        details: JSON.stringify({ displayNumber: reservation.displayNumber, status }),
      },
    });

    // Emit realtime events (non-blocking — fire and forget)
    const eventType = action === 'complete' ? 'queue:completed' 
      : action === 'no_show' ? 'queue:no-show' 
      : 'queue:cancelled'

    emitQueueEvent(eventType, reservation.agencyId, {
      reservationId: id,
      displayNumber: reservation.displayNumber,
      action,
      status,
    })
    if (reservation.userId) {
      emitNotificationEvent('notification:new', reservation.userId, {
        type: eventType,
        ticketNumber: reservation.displayNumber,
      })
    }
    emitKioskEvent(reservation.agencyId, {
      action,
      displayNumber: reservation.displayNumber,
    })

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error)
  }
}
