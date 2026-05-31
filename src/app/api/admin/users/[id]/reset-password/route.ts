import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scryptSync } from 'crypto';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);

    const { id } = await params;
    const newPassword = 'password123';

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash the new password (same method as register)
    const salt = process.env.PASSWORD_SALT || 'blasti-salt-2024';
    const passwordHash = scryptSync(newPassword, salt, 64).toString('hex');

    // Update password
    await db.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'SETTINGS_UPDATE',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({ action: 'password_reset', targetUser: user.username }),
      },
    });

    return NextResponse.json({
      success: true,
      newPassword,
      username: user.username,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
