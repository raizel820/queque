import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';

const batchCompleteSchema = z.object({
  reservationIds: z.array(z.string()).min(1, 'At least one reservation ID is required').max(100, 'Maximum 100 reservations per batch'),
  agencyId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateBody(batchCompleteSchema, body);
    if (validation.error) return validation.error;

    const { reservationIds, agencyId } = validation.data;

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
