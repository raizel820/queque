import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';
import { emitQueueEvent, emitKioskEvent } from '@/lib/realtime-emit';

const agencyIdSchema = z.object({
  agencyId: z.string().min(1, 'Agency ID is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(agencyIdSchema, body);
    if (validation.error) return validation.error;

    const { agencyId } = validation.data;

    await requireAgencyAccess(req, agencyId);

    // Check agency has an active subscription
    const agencyCheck = await db.agency.findUnique({ where: { id: agencyId } });
    if (!agencyCheck) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }
    if (agencyCheck.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'An active subscription is required to use queue features' },
        { status: 403 }
      );
    }

    const queueSettings = await db.queueSettings.findFirst({ where: { agencyId } });
    if (!queueSettings) {
      return NextResponse.json({ error: 'Queue settings not found' }, { status: 404 });
    }

    const newPausedState = !queueSettings.isPaused;

    await db.queueSettings.update({
      where: { id: queueSettings.id },
      data: {
        isPaused: newPausedState,
        pausedAt: newPausedState ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        action: newPausedState ? 'QUEUE_PAUSE' : 'QUEUE_RESUME',
        entityType: 'AGENCY',
        entityId: agencyId,
        details: JSON.stringify({ paused: newPausedState }),
      },
    });

    // Emit realtime events (non-blocking — fire and forget)
    emitQueueEvent(newPausedState ? 'queue:paused' : 'queue:resumed', agencyId, {
      isPaused: newPausedState,
    })
    emitKioskEvent(agencyId, {
      isPaused: newPausedState,
      action: newPausedState ? 'paused' : 'resumed',
    })

    return NextResponse.json({ success: true, isPaused: newPausedState });
  } catch (error) {
    return authErrorResponse(error)
  }
}
