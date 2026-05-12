import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: List active announcements for an agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const announcements = await db.announcement.findMany({
      where: {
        agencyId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Fetch announcements error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST: Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, message, type, expiresAt } = body;

    if (!agencyId || !message) {
      return NextResponse.json({ error: 'Agency ID and message required' }, { status: 400 });
    }

    const announcement = await db.announcement.create({
      data: {
        agencyId,
        message,
        type: type || 'INFO',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

// DELETE: Delete an announcement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    }

    await db.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
