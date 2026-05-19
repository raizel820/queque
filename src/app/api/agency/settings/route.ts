import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId');

    let agency;
    if (agencyId) {
      agency = await db.agency.findUnique({
        where: { id: agencyId },
        include: {
          services: {
            where: { isActive: true },
            select: { id: true, name: true, nameAr: true, nameFr: true, prefix: true },
          },
          queueSettings: true,
        },
      });
    } else {
      // Fallback: first active agency
      agency = await db.agency.findFirst({
        where: { isActive: true },
        include: {
          services: {
            where: { isActive: true },
            select: { id: true, name: true, nameAr: true, nameFr: true, prefix: true },
          },
          queueSettings: true,
        },
      });
    }

    if (!agency) {
      return NextResponse.json({
        avgServiceTime: 10,
        maxReservations: 50,
        isQueueOpen: true,
        services: [],
        workingHoursStart: '08:00',
        workingHoursEnd: '17:00',
      });
    }

    return NextResponse.json({
      avgServiceTime: agency.averageServiceTime,
      maxReservations: agency.maxActiveReservations,
      isQueueOpen: agency.isQueueOpen,
      services: agency.services,
      workingHoursStart: agency.workingHoursStart,
      workingHoursEnd: agency.workingHoursEnd,
      autoPauseWhenFull: agency.autoPauseWhenFull ?? false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/settings GET] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { agencyId, avgServiceTime, maxReservations, isQueueOpen, workingHoursStart, workingHoursEnd, autoPauseWhenFull } = body;

    let targetAgency;
    if (agencyId) {
      targetAgency = await db.agency.findUnique({ where: { id: agencyId } });
    } else {
      targetAgency = await db.agency.findFirst({ where: { isActive: true } });
    }
    if (!targetAgency) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    await db.agency.update({
      where: { id: targetAgency.id },
      data: {
        ...(avgServiceTime !== undefined && { averageServiceTime: avgServiceTime }),
        ...(maxReservations !== undefined && { maxActiveReservations: maxReservations }),
        ...(isQueueOpen !== undefined && { isQueueOpen }),
        ...(workingHoursStart !== undefined && { workingHoursStart }),
        ...(workingHoursEnd !== undefined && { workingHoursEnd }),
        ...(autoPauseWhenFull !== undefined && { autoPauseWhenFull }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/settings PATCH] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
