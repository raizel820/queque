import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'agencyId is required' },
        { status: 400 }
      );
    }

    // Cache activity for 5 seconds
    const cacheKey = `agency:activity:${agencyId}`;
    const result = await cache.getOrSet(cacheKey, async () => {
      const reservations = await db.reservation.findMany({
        where: { agencyId },
        select: {
          id: true,
          status: true,
          displayNumber: true,
          queueNumber: true,
          joinedAt: true,
          walkInCustomerName: true,
          user: { select: { id: true, fullName: true, username: true } },
          service: { select: { name: true, nameAr: true, nameFr: true } },
        },
        orderBy: { joinedAt: 'desc' },
        take: 10,
      });

      const events = reservations.map((r) => {
        let eventType: string;
        let eventKey: string;

        switch (r.status) {
          case 'WAITING': eventType = 'joined'; eventKey = 'customerJoinedQueue'; break;
          case 'CALLED': eventType = 'called'; eventKey = 'customerWasCalled'; break;
          case 'COMPLETED': eventType = 'completed'; eventKey = 'customerCompletedService'; break;
          case 'CANCELLED': eventType = 'cancelled'; eventKey = 'customerCancelledRes'; break;
          case 'NO_SHOW': eventType = 'cancelled'; eventKey = 'customerCancelledRes'; break;
          default: eventType = 'joined'; eventKey = 'customerJoinedQueue';
        }

        return {
          id: r.id,
          eventType,
          eventKey,
          customerName: r.walkInCustomerName || r.user?.fullName || r.user?.username || 'Unknown',
          queueNumber: r.displayNumber || r.queueNumber,
          timestamp: r.joinedAt,
          serviceName: r.service?.name,
        };
      });

      return { success: true, events };
    }, CACHE_TTL.SHORT);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
