import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId');
    const statusParam = req.nextUrl.searchParams.get('status') || 'WAITING,CALLED';
    const statuses = statusParam.split(',').filter(Boolean);

    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

    const reservations = await db.reservation.findMany({
      where: {
        agencyId,
        status: { in: statuses },
      },
      include: {
        user: { select: { id: true, fullName: true, username: true } },
        service: { select: { id: true, name: true, nameAr: true, nameFr: true, prefix: true } },
      },
      orderBy: { queueNumber: 'asc' },
    });

    // Calculate position for each reservation
    const waitingReservations = reservations.filter(r => r.status === 'WAITING');
    const entries = reservations.map((res, idx) => ({
      id: res.id,
      queueNumber: res.displayNumber,
      customerName: res.user.fullName || res.user.username,
      serviceName: res.service.name,
      serviceNameAr: res.service.nameAr,
      serviceNameFr: res.service.nameFr,
      joinedAt: res.joinedAt.toISOString(),
      status: res.status,
      position: res.status === 'WAITING' ? waitingReservations.indexOf(res) + 1 : 0,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Agency queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
