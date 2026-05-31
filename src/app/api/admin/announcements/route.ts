import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';

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

    const { message, type } = await req.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const validTypes = ['INFO', 'WARNING', 'URGENT'];
    const announcementType = validTypes.includes(type) ? type : 'INFO';

    const announcement = await db.globalAnnouncement.create({
      data: {
        message: message.trim(),
        type: announcementType,
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
