import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await req.json();

    const agency = await db.agency.findUnique({ where: { id } });
    if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 });

    if (action === 'suspend') {
      await db.agency.update({ where: { id }, data: { isActive: false } });
    } else if (action === 'activate') {
      await db.agency.update({ where: { id }, data: { isActive: true } });
    } else if (action === 'delete') {
      await db.agency.delete({ where: { id } });
    }

    await db.auditLog.create({
      data: {
        action: `AGENCY_${action.toUpperCase()}`,
        entityType: 'AGENCY',
        entityId: id,
        details: JSON.stringify({ agencyName: agency.name, action }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin agency action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.agency.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
