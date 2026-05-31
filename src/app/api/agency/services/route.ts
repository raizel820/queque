import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, authErrorResponse } from '@/lib/auth-guard';

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
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/services GET] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const agencyId = user.agencyId || await resolveUserAgencyId(user);
    if (!agencyId) {
      return NextResponse.json({ error: 'No active agency found' }, { status: 404 });
    }

    const { name, nameAr, nameFr, prefix } = await req.json();

    if (!name || !prefix) {
      return NextResponse.json({ error: 'Name and prefix required' }, { status: 400 });
    }

    const service = await db.service.create({
      data: {
        agencyId,
        name,
        nameAr: nameAr || null,
        nameFr: nameFr || null,
        prefix: prefix.toUpperCase(),
      },
    });

    return NextResponse.json({ service, success: true });
  } catch (error: unknown) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    console.error('[agency/services POST] Error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Service name already exists' }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
