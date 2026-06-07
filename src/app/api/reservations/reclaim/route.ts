import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireResourceOwnership, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';
import { emitReservationEvent, emitQueueEvent } from '@/lib/realtime-emit';

const reclaimSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID is required'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const validation = validateBody(reclaimSchema, body);
    if (validation.error) return validation.error;

    const { reservationId } = validation.data;

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

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Verify ownership or agency access (walk-in reservations have no userId)
    if (!reservation.userId) {
      await requireAgencyAccess(req, reservation.agencyId);
    } else {
      try {
        await requireResourceOwnership(req, reservation.userId);
      } catch {
        await requireAgencyAccess(req, reservation.agencyId);
      }
    }

    // Check if the reservation was skipped for no-show
    // Use safe access since skippedForNoShow may not exist in Prisma Client on all deployments
    const reservationAny = reservation as Record<string, unknown>;
    if (!reservationAny.skippedForNoShow) {
      return NextResponse.json(
        { error: 'Reservation not found or not skipped' },
        { status: 404 }
      );
    }

    const userLang = reservation.user?.language || 'ar';
    const agencyName =
      userLang === 'ar'
        ? reservation.agency.nameAr || reservation.agency.name
        : userLang === 'fr'
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

      // Use raw SQL for skip-related fields that may not be in Prisma Client
      try {
        await tx.$executeRaw`UPDATE Reservation SET skippedForNoShow = 0, skippedAt = NULL, reclaimRequestedAt = datetime('now'), status = ${newStatus} WHERE id = ${reservation.id}`;
      } catch {
        // Fallback: just update status if skip columns don't exist
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: newStatus,
          },
        });
      }

      // Notify the customer (only for registered users, not walk-ins)
      if (reservation.userId) {
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
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
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

    // Emit realtime events (fire-and-forget)
    emitReservationEvent('reservation:updated', reservation.agencyId, reservation.userId ?? undefined, {
      reservationId: reservation.id,
      displayNumber: reservation.displayNumber,
      action: 'reclaimed',
    })
    emitQueueEvent('queue:updated', reservation.agencyId, {
      reservationId: reservation.id,
      displayNumber: reservation.displayNumber,
      action: 'reclaimed',
    })

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
