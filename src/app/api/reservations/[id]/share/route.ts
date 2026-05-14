import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await db.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true } },
        agency: { select: { name: true, nameAr: true, nameFr: true, agencyCode: true } },
        service: { select: { name: true, nameAr: true, nameFr: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Count people ahead (WAITING with earlier joinedAt)
    const peopleAhead = await db.reservation.count({
      where: {
        agencyId: reservation.agencyId,
        status: 'WAITING',
        joinedAt: { lt: reservation.joinedAt },
        skippedForNoShow: false,
      },
    });

    // Calculate position (people ahead + 1)
    const position = peopleAhead + 1;

    // Estimate wait time
    const avgServiceTime = await db.queueSettings.findUnique({
      where: { agencyId: reservation.agencyId },
      select: { avgServiceTime: true },
    });
    const estimatedWait = Math.round(peopleAhead * (avgServiceTime?.avgServiceTime ?? 10));

    const displayNumber =
      `${reservation.service?.name?.substring(0, 1).toUpperCase() || ''}-${String(reservation.queueNumber).padStart(3, '0')}`;

    return NextResponse.json({
      displayNumber,
      agencyName: reservation.agency.name,
      agencyNameAr: reservation.agency.nameAr,
      agencyNameFr: reservation.agency.nameFr,
      serviceName: reservation.service.name,
      serviceNameAr: reservation.service.nameAr,
      serviceNameFr: reservation.service.nameFr,
      position,
      estimatedWait,
      queueUrl: typeof window !== 'undefined' ? window.location.origin : '',
    });
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
