import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireResourceOwnership, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { realtime } from '@/lib/realtime';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    // Verify ownership or agency access
    try {
      await requireResourceOwnership(request, reservation.userId);
    } catch {
      // If not the owner, check agency access
      await requireAgencyAccess(request, reservation.agencyId);
    }

    if (reservation.status !== 'WAITING') {
      return NextResponse.json(
        { success: false, error: 'Only WAITING reservations can be cancelled' },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: reservation.userId,
          type: 'RESERVATION_CANCELLED',
          title: 'Reservation Cancelled',
          message: `Your reservation ${reservation.displayNumber} has been cancelled.`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: reservation.userId,
          action: 'RESERVATION_CANCEL',
          entityType: 'RESERVATION',
          entityId: id,
          details: JSON.stringify({ displayNumber: reservation.displayNumber, agencyId: reservation.agencyId }),
        },
      });
    });

    // Emit realtime events
    if (reservation.userId) {
      await realtime.reservationCancelled(reservation.userId, {
        reservationId: id,
        displayNumber: reservation.displayNumber,
        agencyId: reservation.agencyId,
      });
    }
    await realtime.queueUpdated(reservation.agencyId, {
      action: 'cancel',
      reservationId: id,
      displayNumber: reservation.displayNumber,
    });
    await realtime.agencyStatsUpdated(reservation.agencyId, {
      action: 'queue-changed',
      agencyId: reservation.agencyId,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
