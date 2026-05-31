import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

// GET - List staff members for an agency
export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get('agencyId');
    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId required' }, { status: 400 });
    }

    await requireAgencyAccess(req, agencyId);

    const staff = await db.agencyStaff.findMany({
      where: { agencyId },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, role: true, isActive: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/staff GET] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}

// POST - Add a staff member to an agency
export async function POST(req: NextRequest) {
  try {
    const { agencyId, username } = await req.json();
    if (!agencyId || !username) {
      return NextResponse.json({ error: 'agencyId and username required' }, { status: 400 });
    }

    await requireAgencyAccess(req, agencyId);

    // Find user by username
    const user = await db.user.findUnique({
      where: { username: username.trim() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a staff member
    const existing = await db.agencyStaff.findUnique({
      where: {
        userId_agencyId: {
          userId: user.id,
          agencyId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Staff already exists in this agency' }, { status: 409 });
    }

    // Create staff link
    const staff = await db.agencyStaff.create({
      data: {
        userId: user.id,
        agencyId,
        role: user.role === 'AGENCY_OWNER' ? 'OWNER' : 'STAFF',
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, role: true },
        },
      },
    });

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/staff POST] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}

// DELETE - Remove a staff member from an agency
export async function DELETE(req: NextRequest) {
  try {
    const staffId = req.nextUrl.searchParams.get('staffId');
    const agencyId = req.nextUrl.searchParams.get('agencyId');

    if (!staffId || !agencyId) {
      return NextResponse.json({ error: 'staffId and agencyId required' }, { status: 400 });
    }

    await requireAgencyAccess(req, agencyId);

    // Verify it's not an owner
    const staffMember = await db.agencyStaff.findUnique({
      where: { id: staffId },
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify the staff member belongs to the specified agency
    if (staffMember.agencyId !== agencyId) {
      return NextResponse.json({ error: 'Staff member does not belong to this agency' }, { status: 403 });
    }

    if (staffMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove agency owner' }, { status: 403 });
    }

    await db.agencyStaff.delete({
      where: { id: staffId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[agency/staff DELETE] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
