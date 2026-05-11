import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId');

    let agency;
    if (agencyId) {
      agency = await db.agency.findUnique({
        where: { id: agencyId },
        include: { queueSettings: { take: 1 } },
      });
    } else {
      agency = await db.agency.findFirst({
        where: { isActive: true },
        include: { queueSettings: { take: 1 } },
      });
    }

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
    console.error('Agency profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { agencyId } = body;

    let targetAgency;
    if (agencyId) {
      targetAgency = await db.agency.findUnique({ where: { id: agencyId } });
    } else {
      targetAgency = await db.agency.findFirst({ where: { isActive: true } });
    }
    if (!targetAgency) return NextResponse.json({ error: 'No agency found' }, { status: 404 });

    const updated = await db.agency.update({
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
    console.error('Agency profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
