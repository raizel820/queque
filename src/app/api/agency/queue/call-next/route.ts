import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getNextCustomerToCall } from '@/lib/queue-scheduler';

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

    // Use transaction to prevent double-calling
    let nextReservation;
    await db.$transaction(async (tx) => {
      // Get all WAITING reservations for this agency, ordered by queueNumber
      const waitingReservations = await tx.reservation.findMany({
        where: {
          agencyId,
          status: 'WAITING',
          ...(serviceId ? { serviceId } : {}),
        },
        orderBy: { queueNumber: 'asc' },
        select: {
          id: true,
          queueNumber: true,
          preferredTime: true,
          fixedTimeEnabled: true,
        },
      });

      // Use queue scheduler to find next customer (respects preferred times)
      const nextId = getNextCustomerToCall(waitingReservations);
      if (!nextId) return;

      const candidate = await tx.reservation.findUnique({
        where: { id: nextId },
        include: {
          service: true,
          user: { select: { id: true, fullName: true } },
        },
      });
      if (!candidate) return;

      // Re-check status inside transaction
      const recheck = await tx.reservation.findUnique({ where: { id: candidate.id } });
      if (!recheck || recheck.status !== 'WAITING') return;

      await processCandidate(tx, candidate, queueSettings, agencyId);
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
        customerName: (nextReservation as { user?: { fullName: string }; walkInCustomerName?: string }).walkInCustomerName || (nextReservation as { user?: { fullName: string } }).user?.fullName || '',
        isWalkIn: !!(nextReservation as { isWalkIn?: boolean }).isWalkIn,
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

async function processCandidate(tx: any, candidate: any, queueSettings: any, agencyId: string) {
  await tx.reservation.update({
    where: { id: candidate.id },
    data: { status: 'CALLED', calledAt: new Date() },
  });

  if (queueSettings) {
    await tx.queueSettings.update({
      where: { id: queueSettings.id },
      data: { currentServingNumber: candidate.queueNumber },
    });
  }

  // Only create notification if user exists (not walk-in)
  if (candidate.userId) {
    await tx.notification.create({
      data: {
        userId: candidate.userId,
        type: 'QUEUE_CALLED',
        title: 'Queue Called',
        message: `Your number ${candidate.displayNumber} has been called. Please proceed.`,
      },
    });
  }

  const auditUser = candidate.userId
    ? await tx.user.findUnique({ where: { id: candidate.userId } })
    : null;

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
        isWalkIn: candidate.isWalkIn || false,
        walkInCustomerName: candidate.walkInCustomerName || null,
      }),
    },
  });
}
