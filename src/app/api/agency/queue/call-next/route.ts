import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { agencyId, serviceId } = await req.json();

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

    // Check agency has an active subscription
    const agencyCheck = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agencyCheck) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }
    if (agencyCheck.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'An active subscription is required to use queue features' },
        { status: 403 }
      );
    }

    // Check if queue is paused
    const queueSettings = await db.queueSettings.findFirst({ where: { agencyId } });
    if (queueSettings?.isPaused) {
      return NextResponse.json({ error: 'Queue is paused' }, { status: 400 });
    }

    // Build the where clause: find next WAITING reservation
    // Note: skipped-for-no-show reservations have status CALLED, not WAITING,
    // so status: WAITING is sufficient to exclude them
    const where: {
      agencyId: string;
      status: string;
      serviceId?: string;
    } = {
      agencyId,
      status: 'WAITING',
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
            select: { id: true, fullName: true },
          },
        },
        orderBy: { queueNumber: 'asc' },
      });
      if (!candidate) return;

      // Re-check status inside transaction to prevent race
      const recheck = await tx.reservation.findUnique({ where: { id: candidate.id } });
      if (!recheck || recheck.status !== 'WAITING') return;

      // Update reservation to CALLED status
      const updateData: {
        status: string;
        calledAt: Date;
      } = {
        status: 'CALLED',
        calledAt: new Date(),
      };

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

      // Validate userId exists before creating audit log with it
      const auditUser = await tx.user.findUnique({ where: { id: candidate.userId } });
      await tx.auditLog.create({
        data: {
          userId: auditUser ? candidate.userId : null,
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
  } catch (error: unknown) {
    console.error('[CALL-NEXT] Error calling next customer:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to call next customer', details: message },
      { status: 500 }
    );
  }
}
