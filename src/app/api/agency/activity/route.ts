import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Fetch recent reservations with user info, limited to last 10
    const reservations = await db.reservation.findMany({
      where: { agencyId },
      include: {
        user: {
          select: { id: true, fullName: true, username: true },
        },
        service: {
          select: { name: true, nameAr: true, nameFr: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 10,
    });

    // Transform into activity events
    const events = reservations.map((r) => {
      let eventType: string;
      let eventKey: string;

      switch (r.status) {
        case 'WAITING':
          eventType = 'joined';
          eventKey = 'customerJoinedQueue';
          break;
        case 'CALLED':
          eventType = 'called';
          eventKey = 'customerWasCalled';
          break;
        case 'COMPLETED':
          eventType = 'completed';
          eventKey = 'customerCompletedService';
          break;
        case 'CANCELLED':
          eventType = 'cancelled';
          eventKey = 'customerCancelledRes';
          break;
        case 'NO_SHOW':
          eventType = 'cancelled';
          eventKey = 'customerCancelledRes';
          break;
        default:
          eventType = 'joined';
          eventKey = 'customerJoinedQueue';
      }

      return {
        id: r.id,
        eventType,
        eventKey,
        customerName: r.user?.fullName || r.user?.username || 'Unknown',
        queueNumber: r.displayNumber || r.queueNumber,
        timestamp: r.joinedAt,
        serviceName: r.service?.name,
      };
    });

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
