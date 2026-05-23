import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.userId !== userId) {
      return NextResponse.json({ success: false, error: 'This reservation does not belong to you' }, { status: 403 });
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
          userId,
          type: 'RESERVATION_CANCELLED',
          title: 'Reservation Cancelled',
          message: `Your reservation ${reservation.displayNumber} has been cancelled.`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'RESERVATION_CANCEL',
          entityType: 'RESERVATION',
          entityId: id,
          details: JSON.stringify({ displayNumber: reservation.displayNumber, agencyId: reservation.agencyId }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
