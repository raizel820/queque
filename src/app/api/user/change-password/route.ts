import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { requireAuth, authErrorResponse } from '@/lib/auth-guard';
import { checkRateLimit, RateLimitError, PASSWORD_RESET_RATE_LIMIT } from '@/lib/rate-limit';
import { validateBody, changePasswordSchema } from '@/lib/validations';

// PATCH - Change password for current user
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Rate limit by user ID
    checkRateLimit(user.id, PASSWORD_RESET_RATE_LIMIT);

    const body = await req.json();
    const validation = validateBody(changePasswordSchema, body);
    if (validation.error) return validation.error;

    const { currentPassword, newPassword } = validation.data;

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
