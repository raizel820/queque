import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await req.json();

    if (!action || !['complete', 'no_show', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      complete: 'COMPLETED',
      no_show: 'NO_SHOW',
      cancel: 'CANCELLED',
    };

    const status = statusMap[action];
    const updateData: Record<string, unknown> = {
      status,
      completedAt: new Date(),
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

    await db.notification.create({
      data: {
        userId: reservation.userId,
        type: typeMap[action],
        title: `Reservation ${status}`,
        message: `Your reservation ${reservation.displayNumber} has been ${status.toLowerCase()}.`,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: reservation.userId,
        action: `QUEUE_${action.toUpperCase()}`,
        entityType: 'RESERVATION',
        entityId: id,
        details: JSON.stringify({ displayNumber: reservation.displayNumber, status }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Queue action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
