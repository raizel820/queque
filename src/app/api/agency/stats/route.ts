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
      db.queueSettings.findFirst({ where: { agencyId } }),
    ]);

    const currentQueueNumber = queueSettings
      ? `${queueSettings.currentServingNumber}`
      : '—';

    return NextResponse.json({
      todayReservations,
      currentlyWaiting: waitingCount,
      servedToday,
      avgWaitTime: agency.averageServiceTime,
      currentQueueNumber,
      isPaused: queueSettings?.isPaused ?? false,
    });
  } catch (error) {
    console.error('Agency stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
