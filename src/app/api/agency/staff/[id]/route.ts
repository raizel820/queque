import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Update a staff member (fullName, isActive, role)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fullName, isActive, role } = body;

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

    // Fetch updated staff member
    const updated = await db.agencyStaff.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, role: true, isActive: true },
        },
      },
    });

    return NextResponse.json({ staff: updated, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/staff/[id] PATCH] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}

// DELETE - Remove/deactivate a staff member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the staff member
    const staffMember = await db.agencyStaff.findUnique({
      where: { id },
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
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
    const user = await db.user.findUnique({
      where: { id: staffMember.userId },
    });

    if (user && user.role === 'AGENCY_STAFF') {
      // Check if this user has any other staff links
      const otherLinks = await db.agencyStaff.count({
        where: {
          userId: user.id,
          id: { not: id },
        },
      });

      if (otherLinks === 0) {
        // No other agencies, deactivate the user
        await db.user.update({
          where: { id: user.id },
          data: { isActive: false },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/staff/[id] DELETE] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
