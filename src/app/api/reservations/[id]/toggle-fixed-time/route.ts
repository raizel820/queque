import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, fixedTimeEnabled } = body;

    if (fixedTimeEnabled === undefined) {
      return NextResponse.json(
        { success: false, error: 'fixedTimeEnabled is required' },
        { status: 400 }
      );
    }

    const reservation = await db.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.status !== 'WAITING') {
      return NextResponse.json(
        { success: false, error: 'Can only toggle fixed time for waiting reservations' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (userId && reservation.userId && reservation.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    // If enabling fixed time but no preferred time set
    if (fixedTimeEnabled && !reservation.preferredTime) {
      return NextResponse.json(
        { success: false, error: 'Cannot enable fixed time without a preferred time' },
        { status: 400 }
      );
    }

    const updated = await db.reservation.update({
      where: { id },
      data: { fixedTimeEnabled },
    });

    // Create notification
    if (reservation.userId) {
      await db.notification.create({
        data: {
          userId: reservation.userId,
          type: 'QUEUE_TIME_TOGGLE',
          title: fixedTimeEnabled ? 'Fixed Time Enabled' : 'Fixed Time Disabled',
          message: fixedTimeEnabled
            ? `Your turn will not come before ${reservation.preferredTime}`
            : 'Your reservation will follow normal queue order',
        },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: userId || undefined,
        action: fixedTimeEnabled ? 'FIXED_TIME_ENABLE' : 'FIXED_TIME_DISABLE',
        entityType: 'RESERVATION',
        entityId: id,
        details: JSON.stringify({ preferredTime: reservation.preferredTime, fixedTimeEnabled }),
      },
    });

    return NextResponse.json({ success: true, reservation: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
