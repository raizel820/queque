import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { requireAuth, authErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit, RateLimitError, PASSWORD_RESET_RATE_LIMIT } from '@/lib/rate-limit';

// PATCH - Change password for current user
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Rate limit by user ID
    checkRateLimit(user.id, PASSWORD_RESET_RATE_LIMIT);

    const { currentPassword, newPassword } = await req.json();

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    // Find user
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCorrect = verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isCorrect) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash new password and update
    const newHash = hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, error: error.message, retryAfter: error.retryAfter },
        { status: 429, headers: { 'Retry-After': String(error.retryAfter) } }
      );
    }
    return authErrorResponse(error);
  }
}
