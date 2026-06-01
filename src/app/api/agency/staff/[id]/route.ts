import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, resolveUserAgencyId, authErrorResponse } from '@/lib/auth-guard';
import { validateBody, updateStaffSchema } from '@/lib/validations';
import { z } from 'zod';
import { emitStaffEvent } from '@/lib/realtime-emit';

// Permissions schema for fine-grained staff access control
const staffPermissionsSchema = z.object({
  canManageQueue: z.boolean().optional(),
  canManageServices: z.boolean().optional(),
  canManageStaff: z.boolean().optional(),
  canViewAnalytics: z.boolean().optional(),
  canManageBranches: z.boolean().optional(),
  canManageWorkingHours: z.boolean().optional(),
  canExportData: z.boolean().optional(),
  canManageProfile: z.boolean().optional(),
});

const patchStaffSchema = updateStaffSchema.extend({
  permissions: staffPermissionsSchema.optional(),
});

// PATCH - Update a staff member (fullName, isActive, role)
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

    const body = await req.json();
    const validation = validateBody(patchStaffSchema, body);
    if (validation.error) return validation.error;

    const { fullName, role, isActive, permissions } = validation.data;

    // Find the staff member
    const staffMember = await db.agencyStaff.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, role: true, isActive: true },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify the staff member belongs to the user's agency
    if (staffMember.agencyId !== agencyId) {
      return NextResponse.json({ error: 'Staff member does not belong to your agency' }, { status: 403 });
    }

    // Cannot modify the owner
    if (staffMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot modify agency owner' }, { status: 403 });
    }

    // Update user fullName if provided
    if (fullName !== undefined && fullName.trim()) {
      await db.user.update({
        where: { id: staffMember.userId },
        data: { fullName: fullName.trim() },
      });
    }

    // Update staff role if provided
    if (role !== undefined && ['STAFF', 'MANAGER'].includes(role)) {
      await db.agencyStaff.update({
        where: { id },
        data: { role },
      });
    }

    // Update user isActive if provided
    if (isActive !== undefined) {
      await db.user.update({
        where: { id: staffMember.userId },
        data: { isActive },
      });
      // Also update the AgencyStaff isActive
      await db.agencyStaff.update({
        where: { id },
        data: { isActive },
      });
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      // Merge with existing permissions
      const currentPerms = staffMember.permissions
        ? JSON.parse(staffMember.permissions as string)
        : {};
      const mergedPerms = { ...currentPerms, ...permissions };
      await db.agencyStaff.update({
        where: { id },
        data: { permissions: JSON.stringify(mergedPerms) },
      });
    }

    // Fetch updated staff member
    const updated = await db.agencyStaff.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, role: true, isActive: true },
        },
      },
    });

    // Emit realtime event (fire-and-forget)
    emitStaffEvent('staff:updated', agencyId, {
      action: 'staff-updated',
      staffId: id,
      fullName,
      role,
      isActive,
    })

    return NextResponse.json({ staff: updated, success: true });
  } catch (error) {
    return authErrorResponse(error)
  }
}

// DELETE - Remove/deactivate a staff member
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

    // Find the staff member
    const staffMember = await db.agencyStaff.findUnique({
      where: { id },
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify the staff member belongs to the user's agency
    if (staffMember.agencyId !== agencyId) {
      return NextResponse.json({ error: 'Staff member does not belong to your agency' }, { status: 403 });
    }

    // Cannot remove the owner
    if (staffMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove agency owner' }, { status: 403 });
    }

    // Delete the staff link
    await db.agencyStaff.delete({
      where: { id },
    });

    // Deactivate the user account if they are AGENCY_STAFF
    const staffUser = await db.user.findUnique({
      where: { id: staffMember.userId },
    });

    if (staffUser && staffUser.role === 'AGENCY_STAFF') {
      // Check if this user has any other staff links
      const otherLinks = await db.agencyStaff.count({
        where: {
          userId: staffUser.id,
          id: { not: id },
        },
      });

      if (otherLinks === 0) {
        // No other agencies, deactivate the user
        await db.user.update({
          where: { id: staffUser.id },
          data: { isActive: false },
        });
      }
    }

    // Emit realtime event (fire-and-forget)
    emitStaffEvent('staff:updated', agencyId, {
      action: 'staff-removed',
      staffId: id,
      userId: staffMember.userId,
    })

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error)
  }
}
