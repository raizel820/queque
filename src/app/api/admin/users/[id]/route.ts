import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';

const userActionSchema = z.object({
  action: z.enum(['suspend', 'activate']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(userActionSchema, body);
    if (validation.error) return validation.error;

    const { action } = validation.data;

    let updateData: { isActive: boolean };

    if (action === 'suspend') {
      updateData = { isActive: false };
    } else if (action === 'activate') {
      updateData = { isActive: true };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "suspend" or "activate".' },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, fullName: true, isActive: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return authErrorResponse(error);
  }
}
