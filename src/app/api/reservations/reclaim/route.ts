import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { reservationId } = await req.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: 'reservationId is required' },
        { status: 400 }
      );
    }

    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: {
          select: {
            id: true,
            language: true,
          },
        },
        agency: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            nameFr: true,
          },
        },
      },
    });

    if (!reservation || !reservation.skippedForNoShow) {
      return NextResponse.json(
        { error: 'Reservation not found or not skipped' },
        { status: 404 }
      );
    }

    const agencyName =
      reservation.user.language === 'ar'
        ? reservation.agency.nameAr || reservation.agency.name
        : reservation.user.language === 'fr'
          ? reservation.agency.nameFr || reservation.agency.name
          : reservation.agency.name;

    await db.$transaction(async (tx) => {
      // Reclaim: clear skip flags, set reclaim timestamp
      // If the reservation was CALLED and skipped, restore to CALLED so agency sees it
      // If the queue has progressed, restore to WAITING so they re-enter the queue
      const currentQueueNumber = await tx.reservation.findFirst({
        where: {
          agencyId: reservation.agencyId,
          status: 'CALLED',
          id: { not: reservation.id },
        },
        orderBy: { queueNumber: 'asc' },
        select: { queueNumber: true },
      });

      // If there's already someone else being served, put them back in WAITING
      const newStatus = currentQueueNumber ? 'WAITING' : reservation.status;

      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          skippedForNoShow: false,
          skippedAt: null,
          reclaimRequestedAt: new Date(),
          status: newStatus,
        },
      });

      // Notify the customer
      await tx.notification.create({
        data: {
          userId: reservation.userId,
          type: 'RECLAIM_SUCCESS',
          title: 'Position Reclaimed',
          message: `Your ticket ${reservation.displayNumber} at ${agencyName} has been reclaimed. ${
            newStatus === 'WAITING'
              ? 'You have been placed back in the queue.'
              : 'You are now being served. Please proceed to the counter.'
          }`,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: reservation.userId,
          action: 'RECLAIM_POSITION',
          entityType: 'RESERVATION',
          entityId: reservation.id,
          details: JSON.stringify({
            displayNumber: reservation.displayNumber,
            agencyId: reservation.agencyId,
            newStatus,
          }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
