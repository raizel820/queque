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

    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      if (clientIp) recordFailedRequest(clientIp);
      return NextResponse.json(
        { success: false, error: 'Agency code is required' },
        { status: 400 }
      );
    }

    const agency = await db.agency.findUnique({
      where: { customCode: code, isActive: true },
      include: {
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameFr: true,
            nameAr: true,
            prefix: true,
          },
        },
        queueSettings: {
          select: {
            id: true,
            currentServingNumber: true,
            lastIssuedNumber: true,
            isPaused: true,
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

    // Compute queue stats
    const waiting = await db.reservation.count({
      where: { agencyId: agency.id, status: 'WAITING' },
    });

    const currentServing = await db.reservation.findFirst({
      where: { agencyId: agency.id, status: { in: ['CALLED', 'SERVING'] } },
      select: { displayNumber: true, service: { select: { prefix: true } } },
      orderBy: { calledAt: 'desc' },
    });

    const estimatedWait = waiting * agency.averageServiceTime;

    // Add avgTime to services from agency averageServiceTime
    const services = agency.services.map((s) => ({
      ...s,
      avgTime: agency.averageServiceTime,
    }));

    if (clientIp) recordSuccessfulRequest(clientIp);
    return NextResponse.json({
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        nameAr: agency.nameAr,
        nameFr: agency.nameFr,
        category: agency.category,
        logoUrl: agency.logoUrl,
        workingHoursStart: agency.workingHoursStart,
        workingHoursEnd: agency.workingHoursEnd,
        isQueueOpen: agency.isQueueOpen,
        isPaused: agency.queueSettings.length > 0 ? agency.queueSettings[0].isPaused : false,
      },
      services,
      queueStats: {
        waiting,
        currentServing: currentServing?.displayNumber || null,
        estimatedWait,
      },
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
