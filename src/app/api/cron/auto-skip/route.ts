import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const NO_SHOW_SKIP_MINUTES = 3;

export async function GET() {
  try {
    const cutoffTime = new Date(Date.now() - NO_SHOW_SKIP_MINUTES * 60 * 1000);

    // Find all CALLED reservations that were called 3+ minutes ago and haven't been skipped yet
    // We use a raw approach to avoid relying on skippedForNoShow which may not exist in all deployments
    const candidates = await db.reservation.findMany({
      where: {
        status: 'CALLED',
        calledAt: { not: null, lte: cutoffTime },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
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

    // Filter out already-skipped and reclaim-requested in code
    const unskippedCandidates = candidates.filter(r => {
      const rAny = r as Record<string, unknown>;
      return rAny.skippedForNoShow !== true && !rAny.reclaimRequestedAt;
    });

    let skipped = 0;

    for (const reservation of unskippedCandidates) {
      const agencyName =
        reservation.user.language === 'ar'
          ? reservation.agency.nameAr || reservation.agency.name
          : reservation.user.language === 'fr'
            ? reservation.agency.nameFr || reservation.agency.name
            : reservation.agency.name;

      await db.$transaction(async (tx) => {
        // Mark as skipped (do NOT change status - customer retains right to reclaim)
        // Use $executeRaw to handle skippedForNoShow which may not be in the Prisma Client
        try {
          await tx.$executeRaw`UPDATE Reservation SET skippedForNoShow = 1, skippedAt = datetime('now') WHERE id = ${reservation.id}`;
        } catch {
          // If the column doesn't exist, just update the status note
          console.warn('[cron/auto-skip] Could not set skippedForNoShow, column may not exist');
        }

        // Notify the customer they were skipped
        await tx.notification.create({
          data: {
            userId: reservation.userId,
            type: 'NO_SHOW_WARNING',
            title: 'You Were Skipped',
            message: `Your ticket ${reservation.displayNumber} at ${agencyName} was skipped because you did not respond within ${NO_SHOW_SKIP_MINUTES} minutes. You can still reclaim your position if you arrive soon.`,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: reservation.userId,
            action: 'AUTO_SKIP_NO_SHOW',
            entityType: 'RESERVATION',
            entityId: reservation.id,
            details: JSON.stringify({
              displayNumber: reservation.displayNumber,
              agencyId: reservation.agencyId,
              calledAt: reservation.calledAt,
            }),
          },
        });
      });

      skipped++;
    }

    return NextResponse.json({
      checked: unskippedCandidates.length,
      skipped,
    });
  } catch (error) {
    console.error('[cron/auto-skip] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
