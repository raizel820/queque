import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { agencyId, serviceId } = await req.json();

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

    // Find the next WAITING reservation
    const where: Record<string, unknown> = {
      agencyId,
      status: 'WAITING',
    };
    if (serviceId) {
      where.serviceId = serviceId;
    }

    const nextReservation = await db.reservation.findFirst({
      where,
      include: {
        service: true,
      },
      orderBy: { queueNumber: 'asc' },
    });

    if (!nextReservation) {
      return NextResponse.json({ error: 'No customers waiting' }, { status: 404 });
    }

    // Update status to CALLED
    await db.reservation.update({
      where: { id: nextReservation.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
    });

    // Update queue settings
    const queueSettings = await db.queueSettings.findFirst({ where: { agencyId } });
    if (queueSettings) {
      await db.queueSettings.update({
        where: { id: queueSettings.id },
        data: { currentServingNumber: nextReservation.queueNumber },
      });
    }

    // Create notification
    await db.notification.create({
      data: {
        userId: nextReservation.userId,
        type: 'QUEUE_CALLED',
        title: 'Queue Called',
        message: `Your number ${nextReservation.displayNumber} has been called. Please proceed.`,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: nextReservation.userId,
        action: 'QUEUE_CALL',
        entityType: 'RESERVATION',
        entityId: nextReservation.id,
        details: JSON.stringify({
          displayNumber: nextReservation.displayNumber,
          agencyId,
          serviceId: nextReservation.serviceId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: nextReservation.id,
        displayNumber: nextReservation.displayNumber,
        customerName: '', // Would need user lookup
      },
    });
  } catch (error) {
    console.error('Call next error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
