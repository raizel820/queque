import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_TTL, rateLimit } from '@/lib/cache';

export async function GET() {
  try {
    // Rate limit: skip if called within last 30 seconds
    if (!rateLimit('cron:check-reminders', 30_000)) {
      return NextResponse.json({
        checked: 0,
        remindersSent: 0,
        skipped: 'rate_limited',
      });
    }

    // Check if we recently ran and there were no candidates
    const recentResult = cache.get<{ checked: number; remindersSent: number }>('cron:reminders:result');
    if (recentResult && recentResult.checked === 0) {
      return NextResponse.json(recentResult);
    }

    const today = new Date().toISOString().split('T')[0];

    // Batch query: get all WAITING reservations with their position info
    // Instead of N+1 queries, we compute positions in a single query
    const candidates = await db.reservation.findMany({
      where: {
        status: 'WAITING',
        reminderSent: false,
        OR: [
          { reservedDate: today },
          { reservedDate: null },
        ],
        user: {
          reminderMinutes: { gt: 0 },
        },
      },
      select: {
        id: true,
        agencyId: true,
        displayNumber: true,
        joinedAt: true,
        userId: true,
        skippedForNoShow: true,
        user: {
          select: {
            id: true,
            reminderMinutes: true,
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
            averageServiceTime: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
      take: 100, // Limit batch size to prevent overload
    });

    // Filter out skipped-for-no-show in code
    const activeCandidates = candidates.filter(r => !r.skippedForNoShow);

    if (activeCandidates.length === 0) {
      const result = { checked: 0, remindersSent: 0 };
      cache.set('cron:reminders:result', result, CACHE_TTL.MEDIUM);
      return NextResponse.json(result);
    }

    // Batch: count people ahead per agency in ONE query per agency
    const agencyIds = [...new Set(activeCandidates.map(r => r.agencyId))];
    const aheadCounts = new Map<string, number>();

    for (const agencyId of agencyIds) {
      // Get count of WAITING reservations per agency (approximation of position)
      const count = await db.reservation.count({
        where: {
          agencyId,
          status: 'WAITING',
        },
      });
      aheadCounts.set(agencyId, count);
    }

    let remindersSent = 0;

    // Process candidates - but limit to 20 per run to avoid overloading
    const batchToProcess = activeCandidates.slice(0, 20);

    for (const reservation of batchToProcess) {
      const totalInQueue = aheadCounts.get(reservation.agencyId) || 0;
      const avgServiceTime = reservation.agency.averageServiceTime || 10;
      const userReminderMinutes = reservation.user.reminderMinutes || 10;

      // Estimate position: total waiting minus those already sent reminders
      // This is an approximation but much faster than N+1 queries
      const estimatedMinutesUntilTurn = Math.max(0, (totalInQueue - 1) * avgServiceTime);

      if (estimatedMinutesUntilTurn <= userReminderMinutes) {
        const agencyName =
          reservation.user.language === 'ar'
            ? reservation.agency.nameAr || reservation.agency.name
            : reservation.user.language === 'fr'
              ? reservation.agency.nameFr || reservation.agency.name
              : reservation.agency.name;

        try {
          await db.$transaction(async (tx) => {
            await tx.reservation.update({
              where: { id: reservation.id },
              data: {
                reminderSent: true,
                reminderSentAt: new Date(),
              },
            });

            await tx.notification.create({
              data: {
                userId: reservation.userId!,
                type: 'TURN_APPROACHING',
                title: 'Your Turn is Approaching',
                message: `Your ticket ${reservation.displayNumber} at ${agencyName} is coming up soon. ${totalInQueue <= 1 ? 'You are next!' : `Approximately ${totalInQueue - 1} ahead of you.`}`,
              },
            });
          });

          remindersSent++;
          // Update the ahead count for this agency
          aheadCounts.set(reservation.agencyId, Math.max(0, totalInQueue - 1));
        } catch {
          // Skip on transaction error (likely concurrent modification)
        }
      }
    }

    const result = { checked: activeCandidates.length, remindersSent };
    cache.set('cron:reminders:result', result, CACHE_TTL.SHORT);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[cron/check-reminders] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
