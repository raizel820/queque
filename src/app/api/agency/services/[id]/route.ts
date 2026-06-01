import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, updateServiceSchema } from '@/lib/validations';
import { emitQueueEvent } from '@/lib/realtime-emit';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);
    const agencyId = user.agencyId || await resolveUserAgencyId(user);
    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 403 });
    }

    // Verify the service belongs to the user's agency
    const existingService = await db.service.findUnique({ where: { id } });
    if (!existingService || existingService.agencyId !== agencyId) {
      return NextResponse.json({ error: 'Service not found or access denied' }, { status: 404 });
    }

    const body = await req.json();
    const validation = validateBody(updateServiceSchema, body);
    if (validation.error) return validation.error;

    const { name, nameAr, nameFr, description, avgTime, isActive } = validation.data;
    const { prefix } = body;

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(nameFr !== undefined && { nameFr }),
        ...(description !== undefined && { description }),
        ...(avgTime !== undefined && { avgTime }),
        ...(isActive !== undefined && { isActive }),
        ...(prefix && { prefix: prefix.toUpperCase() }),
      },
    });

    // Emit realtime event (fire-and-forget)
    emitQueueEvent('queue:settings-updated', agencyId, {
      action: 'service-updated',
      serviceId: id,
    })

    return NextResponse.json({ service, success: true });
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);
    const agencyId = user.agencyId || await resolveUserAgencyId(user);
    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 403 });
    }

    // Verify the service belongs to the user's agency
    const existingService = await db.service.findUnique({ where: { id } });
    if (!existingService || existingService.agencyId !== agencyId) {
      return NextResponse.json({ error: 'Service not found or access denied' }, { status: 404 });
    }

    await db.service.update({
      where: { id },
      data: { isActive: false },
    });

    // Emit realtime event (fire-and-forget)
    emitQueueEvent('queue:settings-updated', agencyId, {
      action: 'service-deleted',
      serviceId: id,
    })

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error)
  }
}
