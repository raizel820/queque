import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationIds, agencyId } = body as { reservationIds?: string[]; agencyId?: string };

    if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json(
        { error: 'reservationIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (reservationIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 reservations per batch' },
        { status: 400 }
      );
    }

    // Verify agency access: fetch one reservation to get agencyId if not provided
    let resolvedAgencyId = agencyId;
    if (!resolvedAgencyId) {
      const firstRes = await db.reservation.findFirst({
        where: { id: { in: reservationIds } },
        select: { agencyId: true },
      });
      if (firstRes) {
        resolvedAgencyId = firstRes.agencyId;
      }
    }

    if (resolvedAgencyId) {
      await requireAgencyAccess(request, resolvedAgencyId);
    } else {
      return NextResponse.json(
        { error: 'Could not determine agency for these reservations' },
        { status: 400 }
      );
    }

    const results = await db.reservation.updateMany({
      where: {
        id: { in: reservationIds },
        agencyId: resolvedAgencyId,
        status: { in: ['WAITING', 'CALLED'] },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: results.count,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
