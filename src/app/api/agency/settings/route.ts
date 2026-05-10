import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // For MVP, return the first active agency's settings
    const agency = await db.agency.findFirst({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          select: { id: true, name: true, nameAr: true, nameFr: true, prefix: true },
        },
        queueSettings: true,
      },
    });

    if (!agency) {
      return NextResponse.json({
        avgServiceTime: 10,
        maxReservations: 50,
        isQueueOpen: true,
        services: [],
      });
    }

    return NextResponse.json({
      avgServiceTime: agency.averageServiceTime,
      maxReservations: agency.maxActiveReservations,
      isQueueOpen: agency.isQueueOpen,
      services: agency.services,
    });
  } catch (error) {
    console.error('Agency settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { avgServiceTime, maxReservations, isQueueOpen } = body;

    // For MVP, update the first active agency
    const agency = await db.agency.findFirst({ where: { isActive: true } });
    if (!agency) {
      return NextResponse.json({ error: 'No active agency found' }, { status: 404 });
    }

    await db.agency.update({
      where: { id: agency.id },
      data: {
        ...(avgServiceTime !== undefined && { averageServiceTime: avgServiceTime }),
        ...(maxReservations !== undefined && { maxActiveReservations: maxReservations }),
        ...(isQueueOpen !== undefined && { isQueueOpen }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Agency settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
