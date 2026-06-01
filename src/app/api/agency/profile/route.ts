import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, updateAgencyProfileSchema } from '@/lib/validations';
import { emitAgencyEvent } from '@/lib/realtime-emit';

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
    return authErrorResponse(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(updateAgencyProfileSchema, body);
    if (validation.error) return validation.error;

    const { agencyId: agencyIdParam } = body;
    const validatedData = validation.data;

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
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.nameAr !== undefined && { nameAr: validatedData.nameAr }),
        ...(validatedData.nameFr !== undefined && { nameFr: validatedData.nameFr }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.descriptionAr !== undefined && { descriptionAr: validatedData.descriptionAr }),
        ...(validatedData.descriptionFr !== undefined && { descriptionFr: validatedData.descriptionFr }),
        ...(validatedData.address !== undefined && { address: validatedData.address }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
        ...(validatedData.category !== undefined && { category: validatedData.category }),
        ...(validatedData.website !== undefined && { website: validatedData.website }),
      },
    });

    // Emit realtime event (fire-and-forget)
    emitAgencyEvent('agency:updated', targetAgency.id, {
      action: 'profile-updated',
    })

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error)
  }
}
