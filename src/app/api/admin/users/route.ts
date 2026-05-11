import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    if (action === 'suspend') {
      const user = await db.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: { id: true, fullName: true, isActive: true },
      });
      return NextResponse.json({ success: true, user });
    }

    if (action === 'activate') {
      const user = await db.user.update({
        where: { id: userId },
        data: { isActive: true },
        select: { id: true, fullName: true, isActive: true },
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
