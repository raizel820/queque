import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';

const announcementSchema = z.object({
  message: z.string().min(1, 'Message is required').max(500),
  type: z.enum(['INFO', 'WARNING', 'URGENT']).optional().default('INFO'),
});

// GET - List global announcements
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const announcements = await db.globalAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// POST - Create a global announcement (admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    const body = await req.json();
    const validation = validateBody(announcementSchema, body);
    if (validation.error) return validation.error;

    const { message, type } = validation.data;

    const announcement = await db.globalAnnouncement.create({
      data: {
        message: message.trim(),
        type,
        createdBy: admin.id,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// DELETE - Delete a global announcement
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await db.globalAnnouncement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
