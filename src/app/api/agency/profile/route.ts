import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

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

    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: { queueSettings: { take: 1 } },
    });

    if (!agency) {
      return NextResponse.json({ error: 'No agency found' }, { status: 404 });
    }

    return NextResponse.json({
      id: agency.id,
      name: agency.name,
      nameAr: agency.nameAr,
      nameFr: agency.nameFr,
      address: agency.address,
      category: agency.category,
      phone: agency.phone,
      email: agency.email,
      code: agency.customCode,
      logoUrl: agency.logoUrl,
      workingHoursStart: agency.workingHoursStart,
      workingHoursEnd: agency.workingHoursEnd,
    });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/profile GET] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { agencyId: agencyIdParam } = body;

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
    if (!targetAgency) return NextResponse.json({ error: 'No agency found' }, { status: 404 });

    await db.agency.update({
      where: { id: targetAgency.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.nameAr !== undefined && { nameAr: body.nameAr }),
        ...(body.nameFr !== undefined && { nameFr: body.nameFr }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.workingHoursStart !== undefined && { workingHoursStart: body.workingHoursStart }),
        ...(body.workingHoursEnd !== undefined && { workingHoursEnd: body.workingHoursEnd }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/profile PATCH] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
