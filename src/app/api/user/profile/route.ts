import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch user profile (used for notification prefs, phone, etc.)
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        language: true,
        avatarUrl: true,
        freeSmsCount: true,
        notificationPreferences: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH - Update user profile (phone, notification prefs, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phoneNumber, notificationPreferences } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber;
    }
    if (notificationPreferences !== undefined) {
      updateData.notificationPreferences =
        typeof notificationPreferences === 'string'
          ? notificationPreferences
          : JSON.stringify(notificationPreferences);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        language: true,
        avatarUrl: true,
        freeSmsCount: true,
        notificationPreferences: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, ...user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
