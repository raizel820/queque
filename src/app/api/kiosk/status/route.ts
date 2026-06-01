import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  enforceRateLimit,
  KIOSK_READ_RATE_LIMIT,
  isRateLimitError,
  rateLimitErrorResponse,
  recordSuccessfulRequest,
  recordFailedRequest,
} from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  let clientIp: string | undefined;
  try {
    // Rate limit + IP blocking check for public kiosk endpoint
    clientIp = enforceRateLimit(request, KIOSK_READ_RATE_LIMIT);

    const agencyId = request.nextUrl.searchParams.get('agencyId');

    if (!agencyId) {
      if (clientIp) recordFailedRequest(clientIp);
      return NextResponse.json(
        { success: false, error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Validate agencyId: check that the agency exists and is active
    const agency = await db.agency.findUnique({
      where: { id: agencyId, isActive: true },
      include: {
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameAr: true,
            nameFr: true,
            prefix: true,
          },
        },
        queueSettings: {
          select: {
            isPaused: true,
            currentServingNumber: true,
          },
          take: 1,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!agency) {
      if (clientIp) recordFailedRequest(clientIp);
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      );
    }

    const isPaused = agency.queueSettings.length > 0 ? agency.queueSettings[0].isPaused : false;

    // Get currently serving for each service
    const servingReservations = await db.reservation.findMany({
      where: { agencyId, status: { in: ['CALLED', 'SERVING'] } },
      select: {
        id: true,
        displayNumber: true,
        status: true,
        serviceId: true,
        calledAt: true,
        service: { select: { id: true, name: true, prefix: true } },
      },
      orderBy: { calledAt: 'desc' },
    });

    // Get queue stats per service
    const serviceStats = await Promise.all(
      agency.services.map(async (service) => {
        const waiting = await db.reservation.count({
          where: { agencyId, serviceId: service.id, status: 'WAITING' },
        });
        return {
          serviceId: service.id,
          serviceName: service.name,
          serviceNameAr: service.nameAr,
          serviceNameFr: service.nameFr,
          prefix: service.prefix,
          waiting,
          estimatedWait: waiting * agency.averageServiceTime,
        };
      })
    );

    // Get recent calls (last 5)
    const recentCalls = await db.reservation.findMany({
      where: { agencyId, status: { in: ['CALLED', 'SERVING', 'COMPLETED'] }, calledAt: { not: null } },
      select: {
        id: true,
        displayNumber: true,
        status: true,
        calledAt: true,
        service: { select: { prefix: true, name: true } },
      },
      orderBy: { calledAt: 'desc' },
      take: 5,
    });

    const totalWaiting = serviceStats.reduce((sum, s) => sum + s.waiting, 0);
    const totalEstimatedWait = totalWaiting * agency.averageServiceTime;

    if (clientIp) recordSuccessfulRequest(clientIp);
    return NextResponse.json({
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        nameAr: agency.nameAr,
        nameFr: agency.nameFr,
        isQueueOpen: agency.isQueueOpen,
        isPaused,
      },
      currentlyServing: servingReservations.map((r) => ({
        id: r.id,
        ticketNumber: r.displayNumber,
        serviceId: r.serviceId,
        serviceName: r.service.name,
        status: r.status,
        calledAt: r.calledAt,
      })),
      serviceStats,
      totalWaiting,
      totalEstimatedWait,
      recentCalls: recentCalls.map((r) => ({
        id: r.id,
        ticketNumber: r.displayNumber,
        status: r.status,
        calledAt: r.calledAt,
      })),
    });
  } catch (error: unknown) {
    if (isRateLimitError(error)) {
      return rateLimitErrorResponse(error);
    }
    if (clientIp) recordFailedRequest(clientIp);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
