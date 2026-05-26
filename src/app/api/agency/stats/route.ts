import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayStart, getTodayEnd } from '@/lib/date-utils';
import { cache, CACHE_TTL } from '@/lib/cache';

export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId');
    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

    // Cache per-agency stats for 10 seconds
    const cacheKey = `agency:stats:${agencyId}`;
    const result = await cache.getOrSet(cacheKey, async () => {
      const agency = await db.agency.findUnique({ where: { id: agencyId } });
      if (!agency) {
        return { error: 'not_found' };
      }

      const todayStart = getTodayStart();
      const todayEnd = getTodayEnd();

      const [
        todayReservations,
        waitingCount,
        servedToday,
        noShowCount,
        cancelledCount,
        queueSettings,
        ratingAgg,
        totalAllTime,
        completedAllTime,
        noShowAllTime,
      ] = await Promise.all([
        db.reservation.count({
          where: { agencyId, joinedAt: { gte: todayStart, lte: todayEnd } },
        }),
        db.reservation.count({
          where: { agencyId, status: { in: ['WAITING', 'CALLED'] } },
        }),
        db.reservation.count({
          where: { agencyId, status: { in: ['COMPLETED'] }, completedAt: { gte: todayStart, lte: todayEnd } },
        }),
        db.reservation.count({
          where: { agencyId, status: { in: ['NO_SHOW'] }, cancelledAt: { gte: todayStart, lte: todayEnd } },
        }),
        db.reservation.count({
          where: { agencyId, status: { in: ['CANCELLED'] }, cancelledAt: { gte: todayStart, lte: todayEnd } },
        }),
        db.queueSettings.findFirst({ where: { agencyId } }),
        db.reservation.aggregate({
          where: { agencyId, rating: { not: null } },
          _avg: { rating: true },
          _count: { rating: true },
        }),
        db.reservation.count({ where: { agencyId } }),
        db.reservation.count({ where: { agencyId, status: 'COMPLETED' } }),
        db.reservation.count({ where: { agencyId, status: 'NO_SHOW' } }),
      ]);

      // Peak hour - use raw SQL for efficiency
      const peakHourResult = await db.$queryRaw<Array<{ hour: number; cnt: number }>>`
        SELECT CAST(strftime('%H', joinedAt) AS INTEGER) as hour, COUNT(*) as cnt
        FROM Reservation
        WHERE agencyId = ${agencyId}
        AND joinedAt >= ${todayStart}
        AND joinedAt <= ${todayEnd}
        GROUP BY hour
        ORDER BY cnt DESC
        LIMIT 1
      `;
      const peakHour = peakHourResult.length > 0
        ? `${String(Number(peakHourResult[0].hour)).padStart(2, '0')}:00`
        : '—';

      // Rating distribution - use raw SQL
      const ratingDistResult = await db.$queryRaw<Array<{ rating: number; cnt: bigint }>>`
        SELECT rating, COUNT(*) as cnt FROM Reservation
        WHERE agencyId = ${agencyId} AND rating IS NOT NULL
        GROUP BY rating ORDER BY rating
      `;
      const ratingDist = [0, 0, 0, 0, 0];
      ratingDistResult.forEach(r => {
        const ratingNum = Number(r.rating);
        if (ratingNum >= 1 && ratingNum <= 5) ratingDist[ratingNum - 1] = Number(r.cnt);
      });

      // Hourly wait time - simplified using raw SQL
      const hourlyWaitResult = await db.$queryRaw<Array<{ hour: bigint; avgWait: number }>>`
        SELECT CAST(strftime('%H', joinedAt) AS INTEGER) as hour,
               ROUND(AVG((julianday(completedAt) - julianday(joinedAt)) * 1440)) as avgWait
        FROM Reservation
        WHERE agencyId = ${agencyId}
        AND status = 'COMPLETED'
        AND completedAt >= ${todayStart}
        AND completedAt <= ${todayEnd}
        GROUP BY hour
      `;
      const avgHourlyWait = new Array(24).fill(0);
      hourlyWaitResult.forEach(r => {
        const h = Number(r.hour);
        if (h >= 0 && h < 24) avgHourlyWait[h] = Number(r.avgWait);
      });

      const currentQueueNumber = queueSettings
        ? `${queueSettings.currentServingNumber}`
        : '—';

      const avgRating = ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : 0;
      const totalRatings = ratingAgg._count.rating;
      const completionRate = totalAllTime > 0 ? Math.round((completedAllTime / totalAllTime) * 100) : 0;
      const noShowRate = totalAllTime > 0 ? Math.round((noShowAllTime / totalAllTime) * 100) : 0;

      return {
        todayReservations,
        currentlyWaiting: waitingCount,
        servedToday,
        noShowCount,
        cancelledCount,
        avgWaitTime: agency.averageServiceTime,
        currentQueueNumber,
        isPaused: queueSettings?.isPaused ?? false,
        peakHour,
        avgRating,
        totalRatings,
        completionRate,
        noShowRate,
        hourlyWaitTime: avgHourlyWait,
        ratingDistribution: ratingDist,
        subscriptionStatus: agency.subscriptionStatus,
      };
    }, CACHE_TTL.SHORT);

    if (result.error === 'not_found') {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Agency stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
