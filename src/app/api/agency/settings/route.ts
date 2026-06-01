import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, updateAgencySettingsSchema } from '@/lib/validations';
import { emitAgencyEvent } from '@/lib/realtime-emit';

export async function GET(req: NextRequest) {
  try {
    const agencyIdParam = req.nextUrl.searchParams.get('agencyId');

    let agencyId: string | null;
    if (agencyIdParam) {
      await requireAgencyAccess(req, agencyIdParam);
      agencyId = agencyIdParam;
    } else {
      const user = await requireAuth(req);
      agencyId = user.agencyId || await resolveUserAgencyId(user);
    }

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
      return NextResponse.json({
        avgServiceTime: 10,
        maxReservations: 50,
        isQueueOpen: true,
        services: [],
        workingHoursStart: '08:00',
        workingHoursEnd: '17:00',
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
      kioskModeEnabled: agency.kioskModeEnabled ?? false,
    });
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(updateAgencySettingsSchema, body);
    if (validation.error) return validation.error;

    const { agencyId: agencyIdParam, isQueueOpen, workingHoursStart, workingHoursEnd, autoPauseWhenFull, kioskModeEnabled } = body;
    const { maxQueueSize, avgServiceTime, allowWalkIns, autoSkipEnabled, autoSkipMinutes, smsNotificationsEnabled, fixedTimeEnabled } = validation.data;

    let agencyId: string | null;
    if (agencyIdParam) {
      await requireAgencyAccess(req, agencyIdParam);
      agencyId = agencyIdParam;
    } else {
      const user = await requireAuth(req);
      agencyId = user.agencyId || await resolveUserAgencyId(user);
    }

    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    const targetAgency = await db.agency.findUnique({ where: { id: agencyId } });
    if (!targetAgency) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    await db.agency.update({
      where: { id: targetAgency.id },
      data: {
        ...(avgServiceTime !== undefined && { averageServiceTime: avgServiceTime }),
        ...(maxQueueSize !== undefined && { maxActiveReservations: maxQueueSize }),
        ...(isQueueOpen !== undefined && { isQueueOpen }),
        ...(workingHoursStart !== undefined && { workingHoursStart }),
        ...(workingHoursEnd !== undefined && { workingHoursEnd }),
        ...(autoPauseWhenFull !== undefined && { autoPauseWhenFull }),
        ...(kioskModeEnabled !== undefined && { kioskModeEnabled }),
        ...(allowWalkIns !== undefined && { allowWalkIns }),
        ...(autoSkipEnabled !== undefined && { autoSkipEnabled }),
        ...(autoSkipMinutes !== undefined && { autoSkipMinutes }),
        ...(smsNotificationsEnabled !== undefined && { smsNotificationsEnabled }),
        ...(fixedTimeEnabled !== undefined && { fixedTimeEnabled }),
      },
    });

    // Emit realtime event (fire-and-forget)
    emitAgencyEvent('agency:updated', targetAgency.id, {
      action: 'settings-updated',
      isQueueOpen,
      autoPauseWhenFull,
      kioskModeEnabled,
    })

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error)
  }
}
