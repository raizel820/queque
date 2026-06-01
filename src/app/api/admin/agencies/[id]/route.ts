import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';

const agencyActionSchema = z.object({
  action: z.enum(['suspend', 'activate', 'delete']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);

    const { id } = await params;
    const body = await req.json();
    const validation = validateBody(agencyActionSchema, body);
    if (validation.error) return validation.error;

    const { action } = validation.data;

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
        userId: admin.id,
        action: `AGENCY_${action.toUpperCase()}`,
        entityType: 'AGENCY',
        entityId: id,
        details: JSON.stringify({ agencyName: agency.name, action }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);

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

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'AGENCY_DELETE',
        entityType: 'AGENCY',
        entityId: id,
        details: JSON.stringify({ action: 'delete' }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
