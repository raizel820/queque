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
      // Cascade delete all related records
      await db.$transaction(async (tx) => {
        await tx.agencyStaff.deleteMany({ where: { agencyId: id } });
        await tx.queueSettings.deleteMany({ where: { agencyId: id } });
        await tx.reservation.deleteMany({ where: { agencyId: id } });
        await tx.service.deleteMany({ where: { agencyId: id } });
        await tx.announcement.deleteMany({ where: { agencyId: id } });
        await tx.transaction.deleteMany({ where: { agencyId: id } });
        await tx.agency.delete({ where: { id } });
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use suspend, activate, or delete.' }, { status: 400 });
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[admin/agencies/[id] PATCH] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Cascade delete all related records
    await db.$transaction(async (tx) => {
      await tx.agencyStaff.deleteMany({ where: { agencyId: id } });
      await tx.queueSettings.deleteMany({ where: { agencyId: id } });
      await tx.reservation.deleteMany({ where: { agencyId: id } });
      await tx.service.deleteMany({ where: { agencyId: id } });
      await tx.announcement.deleteMany({ where: { agencyId: id } });
      await tx.transaction.deleteMany({ where: { agencyId: id } });
      await tx.agency.delete({ where: { id } });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[admin/agencies/[id] DELETE] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
