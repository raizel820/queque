import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireResourceOwnership, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';
import { emitReservationEvent, emitQueueEvent } from '@/lib/realtime-emit';

const postponeBodySchema = z.object({
  positions: z.number().int().min(1).max(10),
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(postponeBodySchema, body);
    if (validation.error) return validation.error;

    const { positions } = validation.data;

    if (!positions || positions < 1 || positions > 10) {
      return NextResponse.json(
        { success: false, error: 'Positions must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Find the reservation
    const reservation = await db.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.status !== 'WAITING') {
      return NextResponse.json(
        { success: false, error: 'Can only postpone a waiting reservation' },
        { status: 400 }
      );
    }

    // Verify ownership or agency access (walk-in reservations have no userId)
    if (!reservation.userId) {
      await requireAgencyAccess(request, reservation.agencyId);
    } else {
      try {
        await requireResourceOwnership(request, reservation.userId);
      } catch {
        await requireAgencyAccess(request, reservation.agencyId);
      }
    }

    // Find reservations with higher queueNumbers in the same agency to swap with
    const laterReservations = await db.reservation.findMany({
      where: {
        agencyId: reservation.agencyId,
        status: 'WAITING',
        queueNumber: { gt: reservation.queueNumber },
      },
      orderBy: { queueNumber: 'asc' },
      take: positions,
    });

    if (laterReservations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No one to postpone behind' },
        { status: 400 }
      );
    }

    // Swap queue numbers: move the current reservation behind the last one in the swap list
    const targetReservation = laterReservations[laterReservations.length - 1];
    const targetQueueNumber = targetReservation.queueNumber;

    // Use a transaction to swap
    const updated = await db.$transaction(async (tx) => {
      // Shift all reservations between current and target down by 1
      const toShift = await tx.reservation.findMany({
        where: {
          agencyId: reservation.agencyId,
          status: 'WAITING',
          queueNumber: { gt: reservation.queueNumber, lte: targetQueueNumber },
        },
        orderBy: { queueNumber: 'asc' },
      });

      // Move current reservation to target position (use a temp number to avoid unique constraint)
      const tempQueueNumber = -reservation.queueNumber;
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { queueNumber: tempQueueNumber },
      });

      // Shift others forward
      for (const shiftRes of toShift) {
        await tx.reservation.update({
          where: { id: shiftRes.id },
          data: { queueNumber: shiftRes.queueNumber - 1 },
        });
      }

      // Move current to target
      const newQueueNumber = targetQueueNumber;
      const newDisplayNumber = reservation.displayNumber; // Keep original display number for identification

      const result = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          queueNumber: newQueueNumber,
          postponeCount: reservation.postponeCount + 1,
        },
      });

      // Create notification if user exists
      if (reservation.userId) {
        await tx.notification.create({
          data: {
            userId: reservation.userId,
            type: 'QUEUE_POSTPONED',
            title: 'Turn Postponed',
            message: `Your reservation has been postponed by ${positions} position(s). New queue number: ${newDisplayNumber}`,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: reservation.userId || undefined,
          action: 'QUEUE_POSTPONE',
          entityType: 'RESERVATION',
          entityId: id,
          details: JSON.stringify({
            positions,
            previousQueueNumber: reservation.queueNumber,
            newQueueNumber,
            postponeCount: result.postponeCount,
          }),
        },
      });

      return result;
    });

    // Emit realtime events (fire-and-forget)
    emitReservationEvent('reservation:updated', reservation.agencyId, reservation.userId ?? undefined, {
      reservationId: id,
      displayNumber: reservation.displayNumber,
      action: 'postponed',
      positions,
      newQueueNumber: updated.queueNumber,
    })
    emitQueueEvent('queue:position-changed', reservation.agencyId, {
      reservationId: id,
      displayNumber: reservation.displayNumber,
      action: 'postponed',
      positions,
    })

    return NextResponse.json({ success: true, reservation: updated });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
