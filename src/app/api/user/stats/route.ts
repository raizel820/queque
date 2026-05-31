import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userId = user.id;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Total reservations
    const totalQueues = await db.reservation.count({
      where: { userId },
    });

    // This month's reservations
    const thisMonthCount = await db.reservation.count({
      where: { userId, joinedAt: { gte: monthStart } },
    });

    // Completed reservations with wait time data
    const completedReservations = await db.reservation.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        agency: { select: { id: true, name: true, nameAr: true, nameFr: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Calculate avg wait time (from joinedAt to completedAt or calledAt)
    let totalWaitMinutes = 0;
    let waitCount = 0;
    completedReservations.forEach((r) => {
      const start = r.joinedAt;
      const end = r.completedAt || r.calledAt;
      if (start && end) {
        const diffMs = end.getTime() - start.getTime();
        totalWaitMinutes += Math.round(diffMs / 60000);
        waitCount++;
      }
    });
    const avgWaitTime = waitCount > 0 ? Math.round(totalWaitMinutes / waitCount) : 0;

    // Favorite agency (most visited)
    const agencyVisits = new Map<string, { count: number; name: string; nameAr?: string; nameFr?: string }>();
    completedReservations.forEach((r) => {
      const existing = agencyVisits.get(r.agency.id);
      if (existing) {
        existing.count++;
      } else {
        agencyVisits.set(r.agency.id, {
          count: 1,
          name: r.agency.name,
          nameAr: r.agency.nameAr || undefined,
          nameFr: r.agency.nameFr || undefined,
        });
      }
    });
    let favoriteAgency: { name: string; nameAr?: string; nameFr?: string } | null = null;
    let maxVisits = 0;
    for (const [, data] of agencyVisits) {
      if (data.count > maxVisits) {
        maxVisits = data.count;
        favoriteAgency = data;
      }
    }

    return NextResponse.json({
      totalQueues,
      thisMonth: thisMonthCount,
      avgWaitTime,
      favoriteAgency,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
