import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List global announcements
export async function GET() {
  try {
    const announcements = await db.globalAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Global announcements list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a global announcement (admin only)
export async function POST(req: NextRequest) {
  try {
    const { message, type, createdBy } = await req.json();
    if (!message || !message.trim() || !createdBy) {
      return NextResponse.json({ error: 'message and createdBy required' }, { status: 400 });
    }

    const validTypes = ['INFO', 'WARNING', 'URGENT'];
    const announcementType = validTypes.includes(type) ? type : 'INFO';

    const announcement = await db.globalAnnouncement.create({
      data: {
        message: message.trim(),
        type: announcementType,
        createdBy,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('Global announcement create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a global announcement
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await db.globalAnnouncement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Global announcement delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
