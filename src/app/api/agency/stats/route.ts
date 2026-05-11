import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayStart, getTodayEnd } from '@/lib/date-utils';

export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId');
    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

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
    });
  } catch (error) {
    console.error('Agency stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
