import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireResourceOwnership, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

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
        agency: { select: { name: true, nameAr: true, nameFr: true, customCode: true } },
        service: { select: { name: true, nameAr: true, nameFr: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Verify ownership or agency access (walk-in reservations have no userId)
    if (!reservation.userId) {
      await requireAgencyAccess(request, reservation.agencyId);
    } else {
      try {
        await requireResourceOwnership(request, reservation.userId);
      } catch {
        await requireAgencyAccess(request, reservation.agencyId);
      }
    }

    // Count people ahead (WAITING with earlier joinedAt)
    // Note: skippedForNoShow filter done in code to avoid Prisma Client compatibility issues
    const allAhead = await db.reservation.findMany({
      where: {
        agencyId: reservation.agencyId,
        status: 'WAITING',
        joinedAt: { lt: reservation.joinedAt },
      },
      select: { id: true },
    });

    // Filter out skipped-for-no-show in code
    const peopleAhead = allAhead.filter(r => {
      const rAny = r as Record<string, unknown>;
      return rAny.skippedForNoShow !== true;
    }).length;

    // Calculate position (people ahead + 1)
    const position = peopleAhead + 1;

    // Estimate wait time from agency settings
    const agency = await db.agency.findUnique({
      where: { id: reservation.agencyId },
      select: { averageServiceTime: true },
    });
    const estimatedWait = Math.round(peopleAhead * (agency?.averageServiceTime ?? 10));

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
      queueUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://blasti.dz',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await db.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true } },
        agency: { select: { name: true, nameAr: true, nameFr: true, customCode: true } },
        service: { select: { name: true, nameAr: true, nameFr: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Verify ownership or agency access (walk-in reservations have no userId)
    if (!reservation.userId) {
      await requireAgencyAccess(request, reservation.agencyId);
    } else {
      try {
        await requireResourceOwnership(request, reservation.userId);
      } catch {
        await requireAgencyAccess(request, reservation.agencyId);
      }
    }

    // Count people ahead (WAITING with earlier joinedAt)
    const allAhead = await db.reservation.findMany({
      where: {
        agencyId: reservation.agencyId,
        status: 'WAITING',
        joinedAt: { lt: reservation.joinedAt },
      },
      select: { id: true },
    });

    const peopleAhead = allAhead.filter(r => {
      const rAny = r as Record<string, unknown>;
      return rAny.skippedForNoShow !== true;
    }).length;

    const position = peopleAhead + 1;

    const agency = await db.agency.findUnique({
      where: { id: reservation.agencyId },
      select: { averageServiceTime: true },
    });
    const estimatedWait = Math.round(peopleAhead * (agency?.averageServiceTime ?? 10));

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
      queueUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://blasti.dz',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
