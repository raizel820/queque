import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, createServiceSchema } from '@/lib/validations';
import { emitQueueEvent } from '@/lib/realtime-emit';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const agencyId = user.agencyId || await resolveUserAgencyId(user);
    if (!agencyId) {
      return NextResponse.json({ services: [] });
    }

    const services = await db.service.findMany({
      where: { agencyId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const agencyId = user.agencyId || await resolveUserAgencyId(user);
    if (!agencyId) {
      return NextResponse.json({ error: 'No active agency found' }, { status: 404 });
    }

    const body = await req.json();
    const validation = validateBody(createServiceSchema, body);
    if (validation.error) return validation.error;

    const { name, nameAr, nameFr, description, avgTime, isActive } = validation.data;
    const { prefix } = body;

    if (!prefix) {
      return NextResponse.json({ error: 'Prefix required' }, { status: 400 });
    }

    const service = await db.service.create({
      data: {
        agencyId,
        name,
        nameAr: nameAr || null,
        nameFr: nameFr || null,
        prefix: prefix.toUpperCase(),
        description: description || null,
        avgTime: avgTime || undefined,
        isActive: isActive ?? true,
      },
    });

    // Emit realtime event (fire-and-forget)
    emitQueueEvent('queue:settings-updated', agencyId, {
      action: 'service-created',
      serviceId: service.id,
      serviceName: name,
    })

    return NextResponse.json({ service, success: true });
  } catch (error: unknown) {
    return authErrorResponse(error)
  }
}
