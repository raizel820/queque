import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_TTL, rateLimit } from '@/lib/cache';

const NO_SHOW_SKIP_MINUTES = 3;

export async function GET() {
  try {
    // Rate limit: skip if called within last 30 seconds
    if (!rateLimit('cron:auto-skip', 30_000)) {
      return NextResponse.json({
        checked: 0,
        skipped: 0,
        skipped_rate_limited: true,
      });
    }

    // Check if we recently ran and there were no candidates
    const recentResult = cache.get<{ checked: number; skipped: number }>('cron:auto-skip:result');
    if (recentResult && recentResult.checked === 0) {
      return NextResponse.json(recentResult);
    }

    const cutoffTime = new Date(Date.now() - NO_SHOW_SKIP_MINUTES * 60 * 1000);

    // Find all CALLED reservations that were called 3+ minutes ago
    const candidates = await db.reservation.findMany({
      where: {
        status: 'CALLED',
        calledAt: { not: null, lte: cutoffTime },
      },
      select: {
        id: true,
        displayNumber: true,
        agencyId: true,
        userId: true,
        calledAt: true,
        skippedForNoShow: true,
        reclaimRequestedAt: true,
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
      take: 50, // Limit batch size
    });

    // Filter out already-skipped and reclaim-requested
    const unskippedCandidates = candidates.filter(r => !r.skippedForNoShow && !r.reclaimRequestedAt);

    if (unskippedCandidates.length === 0) {
      const result = { checked: 0, skipped: 0 };
      cache.set('cron:auto-skip:result', result, CACHE_TTL.MEDIUM);
      return NextResponse.json(result);
    }

    let skipped = 0;

    // Process in smaller batches to avoid overloading
    const batchToProcess = unskippedCandidates.slice(0, 10);

    for (const reservation of batchToProcess) {
      const agencyName =
        reservation.user?.language === 'ar'
          ? reservation.agency.nameAr || reservation.agency.name
          : reservation.user?.language === 'fr'
            ? reservation.agency.nameFr || reservation.agency.name
            : reservation.agency.name;

      try {
        await db.$transaction(async (tx) => {
          try {
            await tx.$executeRaw`UPDATE Reservation SET skippedForNoShow = 1, skippedAt = datetime('now') WHERE id = ${reservation.id}`;
          } catch {
            // Column may not exist in some environments
          }

          if (reservation.userId) {
            await tx.notification.create({
              data: {
                userId: reservation.userId,
                type: 'NO_SHOW_WARNING',
                title: 'You Were Skipped',
                message: `Your ticket ${reservation.displayNumber} at ${agencyName} was skipped because you did not respond within ${NO_SHOW_SKIP_MINUTES} minutes.`,
              },
            });

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
          }
        });

        skipped++;
      } catch {
        // Skip on transaction error
      }
    }

    const result = { checked: unskippedCandidates.length, skipped };
    cache.set('cron:auto-skip:result', result, CACHE_TTL.SHORT);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[cron/auto-skip] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
