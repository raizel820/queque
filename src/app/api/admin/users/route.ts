import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const limit = Math.min(Math.max(rawLimit, 1), 100);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'suspended') {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          language: true,
          isActive: true,
          createdAt: true,
          avatarUrl: true,
          phoneNumber: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    // Fetch agency names for agency owners
    const userIds = users.map((u) => u.id);
    const agencies = await db.agency.findMany({
      where: { ownerId: { in: userIds } },
      select: { ownerId: true, name: true, nameAr: true, nameFr: true },
    });
    const agencyMap = Object.fromEntries(agencies.map((a) => [a.ownerId, a]));

    const enrichedUsers = users.map((u) => ({
      ...u,
      agencyName: agencyMap[u.id]?.name || null,
    }));

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent modifying super admin accounts
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify super admin accounts' },
        { status: 403 }
      );
    }

    if (action === 'suspend') {
      const user = await db.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: { id: true, fullName: true, isActive: true },
      });

      // Also deactivate associated agency if user is an agency owner
      if (targetUser.role === 'AGENCY_OWNER') {
        await db.agency.updateMany({
          where: { ownerId: userId },
          data: { isActive: false },
        });
      }

      await db.auditLog.create({
        data: {
          userId,
          action: 'USER_SUSPEND',
          entityType: 'USER',
          entityId: userId,
          details: JSON.stringify({ fullName: targetUser.fullName, role: targetUser.role }),
        },
      });

      return NextResponse.json({ success: true, user });
    }

    if (action === 'activate') {
      const user = await db.user.update({
        where: { id: userId },
        data: { isActive: true },
        select: { id: true, fullName: true, isActive: true },
      });

      // Also reactivate associated agency if user is an agency owner
      if (targetUser.role === 'AGENCY_OWNER') {
        await db.agency.updateMany({
          where: { ownerId: userId },
          data: { isActive: true },
        });
      }

      await db.auditLog.create({
        data: {
          userId,
          action: 'USER_ACTIVATE',
          entityType: 'USER',
          entityId: userId,
          details: JSON.stringify({ fullName: targetUser.fullName, role: targetUser.role }),
        },
      });

      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "suspend" or "activate".' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Prevent deleting super admin accounts
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete super admin accounts' },
        { status: 403 }
      );
    }

    // Get agencyId before deleting (for agency cleanup)
    const agency = await db.agency.findFirst({ where: { ownerId: userId } });

    // Use transaction for atomic deletion
    await db.$transaction(async (tx) => {
      // Delete agency-related records first
      if (agency) {
        await tx.agencyStaff.deleteMany({ where: { agencyId: agency.id } });
        await tx.queueSettings.deleteMany({ where: { agencyId: agency.id } });
        await tx.reservation.deleteMany({ where: { agencyId: agency.id } });
        await tx.service.deleteMany({ where: { agencyId: agency.id } });
        await tx.announcement.deleteMany({ where: { agencyId: agency.id } });
        await tx.transaction.deleteMany({ where: { agencyId: agency.id } });
        await tx.agency.delete({ where: { id: agency.id } });
      }

      // Delete user's reservations (as customer)
      await tx.reservation.deleteMany({ where: { userId } });
      // Delete user's favorites
      await tx.favorite.deleteMany({ where: { userId } });
      // Delete user's notifications
      await tx.notification.deleteMany({ where: { userId } });
      // Delete user's audit logs
      await tx.auditLog.deleteMany({ where: { userId } });
      // Delete user's staff memberships
      await tx.agencyStaff.deleteMany({ where: { userId } });
      // Clear transaction reviews
      await tx.transaction.updateMany({
        where: { reviewedBy: userId },
        data: { reviewedBy: null },
      });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    await db.auditLog.create({
      data: {
        action: 'USER_DELETE',
        entityType: 'USER',
        entityId: userId,
        details: JSON.stringify({ fullName: targetUser.fullName, role: targetUser.role, username: targetUser.username }),
      },
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
