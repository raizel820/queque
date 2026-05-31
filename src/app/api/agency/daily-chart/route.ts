import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, authErrorResponse } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const agencyId = user.agencyId || await resolveUserAgencyId(user);
    if (!agencyId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all reservations for today for this agency
    const reservations = await db.reservation.findMany({
      where: {
        agencyId,
        joinedAt: { gte: today },
      },
      select: {
        joinedAt: true,
        status: true,
      },
    });

    // Group by hour
    const hourlyData: { hour: number; count: number; completed: number }[] = [];

    for (let h = 7; h <= 22; h++) {
      const hourReservations = reservations.filter((r) => {
        const hour = new Date(r.joinedAt).getHours();
        return hour === h;
      });
      const completed = hourReservations.filter(
        (r) => r.status === 'COMPLETED'
      ).length;

      hourlyData.push({
        hour: h,
        count: hourReservations.length,
        completed,
      });
    }

    return NextResponse.json({ success: true, data: hourlyData });
  } catch (error: unknown) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
