import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Find the user's active (WAITING) reservation
    const reservation = await db.reservation.findFirst({
      where: {
        userId,
        status: 'WAITING',
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

    return NextResponse.json({ success: true, reservation: updated });
  } catch (error) {
    console.error('Cancel active reservation error:', error);
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 });
  }
}
