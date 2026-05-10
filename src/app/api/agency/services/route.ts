import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const agency = await db.agency.findFirst({ where: { isActive: true } });
    if (!agency) {
      return NextResponse.json({ services: [] });
    }

    const services = await db.service.findMany({
      where: { agencyId: agency.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Agency services GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, nameAr, nameFr, prefix } = await req.json();

    if (!name || !prefix) {
      return NextResponse.json({ error: 'Name and prefix required' }, { status: 400 });
    }

    const agency = await db.agency.findFirst({ where: { isActive: true } });
    if (!agency) {
      return NextResponse.json({ error: 'No active agency found' }, { status: 404 });
    }

    const service = await db.service.create({
      data: {
        agencyId: agency.id,
        name,
        nameAr: nameAr || null,
        nameFr: nameFr || null,
        prefix: prefix.toUpperCase(),
      },
    });

    return NextResponse.json({ service, success: true });
  } catch (error: unknown) {
    console.error('Agency services POST error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Service name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
