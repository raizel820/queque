import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { agencyId, serviceId } = await req.json();

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

    // Check if queue is paused
    const queueSettings = await db.queueSettings.findFirst({ where: { agencyId } });
    if (queueSettings?.isPaused) {
      return NextResponse.json({ error: 'Queue is paused' }, { status: 400 });
    }

    // Build the where clause: WAITING, NOT skipped for no-show
    const where: Record<string, unknown> = {
      agencyId,
      status: 'WAITING',
      skippedForNoShow: false,
    };
    if (serviceId) {
      where.serviceId = serviceId;
    }

    // Use findFirst + update in a transaction to prevent double-calling
    let nextReservation;
    await db.$transaction(async (tx) => {
      const candidate = await tx.reservation.findFirst({
        where,
        include: {
          service: true,
          user: {
            select: { fullName: true },
          },
        },
        orderBy: { queueNumber: 'asc' },
      });
      if (!candidate) return;

      // Re-check status inside transaction to prevent race
      const recheck = await tx.reservation.findUnique({ where: { id: candidate.id } });
      if (!recheck || recheck.status !== 'WAITING') return;

      // If this reservation was previously reclaimed, clear the reclaim flag
      // and reset the skip-related fields
      const updateData: Record<string, unknown> = {
        status: 'CALLED',
        calledAt: new Date(),
      };
      if (recheck.reclaimRequestedAt) {
        updateData.skippedForNoShow = false;
        updateData.skippedAt = null;
        updateData.reclaimRequestedAt = null;
      }

      await tx.reservation.update({
        where: { id: candidate.id },
        data: updateData,
      });

      if (queueSettings) {
        await tx.queueSettings.update({
          where: { id: queueSettings.id },
          data: { currentServingNumber: candidate.queueNumber },
        });
      }

      await tx.notification.create({
        data: {
          userId: candidate.userId,
          type: 'QUEUE_CALLED',
          title: 'Queue Called',
          message: `Your number ${candidate.displayNumber} has been called. Please proceed.`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: candidate.userId,
          action: 'QUEUE_CALL',
          entityType: 'RESERVATION',
          entityId: candidate.id,
          details: JSON.stringify({
            displayNumber: candidate.displayNumber,
            agencyId,
            serviceId: candidate.serviceId,
          }),
        },
      });

      nextReservation = candidate;
    });

    if (!nextReservation) {
      return NextResponse.json({ error: 'No customers waiting' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reservation: {
        id: nextReservation.id,
        displayNumber: nextReservation.displayNumber,
        customerName: (nextReservation as { user?: { fullName: string } }).user?.fullName ?? '',
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
