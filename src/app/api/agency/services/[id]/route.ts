import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, authErrorResponse } from '@/lib/auth-guard';

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

    const { name, nameAr, nameFr, prefix } = await req.json();

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(nameFr !== undefined && { nameFr }),
        ...(prefix && { prefix: prefix.toUpperCase() }),
      },
    });

    return NextResponse.json({ service, success: true });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/services/[id] PATCH] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/services/[id] DELETE] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
