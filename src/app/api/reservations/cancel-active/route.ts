import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse } from '@/lib/auth-guard';
import { emitReservationEvent, emitQueueEvent, emitKioskEvent } from '@/lib/realtime-emit';

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userId = user.id;

    // Find the user's active (WAITING or CALLED) reservation
    const reservation = await db.reservation.findFirst({
      where: {
        userId,
        status: { in: ['WAITING', 'CALLED'] },
      },
      orderBy: { joinedAt: 'desc' },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'No active reservation found' }, { status: 404 });
    }

    // Cancel the reservation
    const updated = await db.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId,
        type: 'CANCELLED',
        title: 'Queue Cancelled',
        message: `Your reservation ${updated.displayNumber} has been cancelled.`,
      },
    });

    // Emit realtime events (fire-and-forget)
    emitReservationEvent('reservation:cancelled', updated.agencyId, userId, {
      reservationId: updated.id,
      displayNumber: updated.displayNumber,
      agencyId: updated.agencyId,
    })
    emitQueueEvent('queue:updated', updated.agencyId, {
      reservationId: updated.id,
      displayNumber: updated.displayNumber,
      action: 'cancelled',
    })
    emitKioskEvent(updated.agencyId, {
      action: 'reservation-cancelled',
      displayNumber: updated.displayNumber,
    })

    return NextResponse.json({ success: true, reservation: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
