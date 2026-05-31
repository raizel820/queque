import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse } from '@/lib/auth-guard';

// GET - Fetch user profile (used for notification prefs, phone, etc.)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const profile = await db.user.findUnique({
      where: { id: user.id },
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
        reminderMinutes: true,
        smsNotificationsEnabled: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// PATCH - Update user profile (phone, notification prefs, reminder minutes, SMS toggle, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { phoneNumber, notificationPreferences, reminderMinutes, smsNotificationsEnabled, avatarUrl, fullName, language } = body;

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
    if (reminderMinutes !== undefined) {
      updateData.reminderMinutes = Number(reminderMinutes);
    }
    if (smsNotificationsEnabled !== undefined) {
      updateData.smsNotificationsEnabled = Boolean(smsNotificationsEnabled);
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }
    if (fullName !== undefined) {
      updateData.fullName = fullName;
    }
    if (language !== undefined) {
      updateData.language = language;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
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
        reminderMinutes: true,
        smsNotificationsEnabled: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
