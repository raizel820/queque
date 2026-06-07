import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireAgencyAccess, resolveUserAgencyId, authErrorResponse } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  try {
    let agencyId = req.nextUrl.searchParams.get('agencyId');
    // Fall back to session user's agencyId if not provided
    if (!agencyId) {
      const user = await requireAuth(req);
      agencyId = await resolveUserAgencyId(user);
      if (!agencyId) {
        return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
      }
    }

    await requireAgencyAccess(req, agencyId);

    const agency = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Last 7 days range
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get completed reservations from last 7 days with calledAt
    const completedReservations = await db.reservation.findMany({
      where: {
        agencyId,
        status: 'COMPLETED',
        calledAt: { not: null },
        completedAt: { gte: sevenDaysAgo, lte: now },
      },
      include: {
        service: {
          select: { id: true, name: true, nameAr: true, nameFr: true },
        },
      },
    });

    // Group by serviceId
    const serviceMap = new Map<string, {
      serviceId: string;
      serviceName: string;
      serviceNameAr?: string;
      serviceNameFr?: string;
      totalWaitMs: number;
      totalServed: number;
      totalRating: number;
      ratedCount: number;
    }>();

    for (const r of completedReservations) {
      const existing = serviceMap.get(r.serviceId);
      const waitMs = r.calledAt ? r.completedAt!.getTime() - r.joinedAt.getTime() : 0;
      const rating = r.rating ?? 0;

      if (existing) {
        existing.totalWaitMs += waitMs;
        existing.totalServed += 1;
        if (rating > 0) {
          existing.totalRating += rating;
          existing.ratedCount += 1;
        }
      } else {
        serviceMap.set(r.serviceId, {
          serviceId: r.serviceId,
          serviceName: r.service.name,
          serviceNameAr: r.service.nameAr ?? undefined,
          serviceNameFr: r.service.nameFr ?? undefined,
          totalWaitMs: waitMs,
          totalServed: 1,
          totalRating: rating > 0 ? rating : 0,
          ratedCount: rating > 0 ? 1 : 0,
        });
      }
    }

    const services = Array.from(serviceMap.values()).map((s) => ({
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      serviceNameAr: s.serviceNameAr,
      serviceNameFr: s.serviceNameFr,
      avgWaitTime: s.totalServed > 0 ? Math.round(s.totalWaitMs / s.totalServed / 60000) : 0, // in minutes
      totalServed: s.totalServed,
      avgRating: s.ratedCount > 0 ? Math.round((s.totalRating / s.ratedCount) * 10) / 10 : 0,
    }));

    // Sort by total served descending
    services.sort((a, b) => b.totalServed - a.totalServed);

    return NextResponse.json({ services });
  } catch (error) {
    return authErrorResponse(error)
  }
}
