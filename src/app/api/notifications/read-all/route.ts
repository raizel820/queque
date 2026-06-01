import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse } from '@/lib/auth-guard';

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const result = await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
