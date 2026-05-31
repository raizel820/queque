import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId is required' }, { status: 400 });
    }

    await requireAgencyAccess(request, agencyId);

    // Query completed reservations from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedReservations = await db.reservation.findMany({
      where: {
        agencyId,
        status: 'COMPLETED',
        calledAt: { gte: thirtyDaysAgo },
      },
      select: { calledAt: true },
    });

    // Group by hour of day
    const hourCounts: Record<number, number> = {};

    for (const res of completedReservations) {
      if (res.calledAt) {
        const hour = res.calledAt.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    }

    // Sort by count descending and take top 5
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: `${String(Number(hour)).padStart(2, '0')}:00`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({ peakHours });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    console.error('Peak hours API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
