import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayStart, getTodayEnd } from '@/lib/date-utils';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId');
    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

    await requireAgencyAccess(req, agencyId);

    const agency = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
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
      // all-time totals
      db.reservation.count({ where: { agencyId } }),
      db.reservation.count({ where: { agencyId, status: 'COMPLETED' } }),
      db.reservation.count({ where: { agencyId, status: 'NO_SHOW' } }),
    ]);

    // Calculate peak hour today
    const todayReservationsList = await db.reservation.findMany({
      where: { agencyId, joinedAt: { gte: todayStart, lte: todayEnd } },
      select: { joinedAt: true },
    });

    let peakHour = '—';
    if (todayReservationsList.length > 0) {
      const hourCounts: Record<number, number> = {};
      todayReservationsList.forEach((r) => {
        const h = r.joinedAt.getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
      let maxCount = 0;
      let peakH = 0;
      for (const [hour, count] of Object.entries(hourCounts)) {
        if (count > maxCount) {
          maxCount = count;
          peakH = parseInt(hour);
        }
      }
      peakHour = `${String(peakH).padStart(2, '0')}:00`;
    }

    const currentQueueNumber = queueSettings
      ? `${queueSettings.currentServingNumber}`
      : '—';

    // Performance metrics
    const avgRating = ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : 0;
    const totalRatings = ratingAgg._count.rating;
    const completionRate = totalAllTime > 0 ? Math.round((completedAllTime / totalAllTime) * 100) : 0;
    const noShowRate = totalAllTime > 0 ? Math.round((noShowAllTime / totalAllTime) * 100) : 0;

    // Hourly wait time data (today)
    const todayCompleted = await db.reservation.findMany({
      where: { agencyId, status: 'COMPLETED', completedAt: { gte: todayStart, lte: todayEnd } },
      select: { joinedAt: true, completedAt: true, calledAt: true },
    });
    const hourlyWaitTime: number[] = new Array(24).fill(0);
    const hourlyCount: number[] = new Array(24).fill(0);
    todayCompleted.forEach((r) => {
      if (r.calledAt && r.completedAt) {
        const waitMinutes = Math.round((r.completedAt.getTime() - r.joinedAt.getTime()) / 60000);
        const h = r.joinedAt.getHours();
        hourlyWaitTime[h] += waitMinutes;
        hourlyCount[h]++;
      }
    });
    const avgHourlyWait = hourlyWaitTime.map((total, i) => hourlyCount[i] > 0 ? Math.round(total / hourlyCount[i]) : 0);

    // Rating distribution
    const ratingDist = [0, 0, 0, 0, 0]; // 1-5 stars
    const allRated = await db.reservation.findMany({
      where: { agencyId, rating: { not: null } },
      select: { rating: true },
    });
    allRated.forEach((r) => {
      if (r.rating && r.rating >= 1 && r.rating <= 5) ratingDist[r.rating - 1]++;
    });

    return NextResponse.json({
      todayReservations,
      currentlyWaiting: waitingCount,
      servedToday,
      noShowCount,
      cancelledCount,
      avgWaitTime: agency.averageServiceTime,
      currentQueueNumber,
      isPaused: queueSettings?.isPaused ?? false,
      peakHour,
      // Performance metrics
      avgRating,
      totalRatings,
      completionRate,
      noShowRate,
      // Chart data
      hourlyWaitTime: avgHourlyWait,
      ratingDistribution: ratingDist,
      // Subscription info
      subscriptionStatus: agency.subscriptionStatus,
    });
  } catch (error) {
    return authErrorResponse(error)
  }
}
