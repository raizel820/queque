import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.user.findMany({
      include: {
        _count: {
          select: { reservations: true, favorites: true, auditLogs: true, notifications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV
    const headers = [
      'Username', 'Full Name', 'Email', 'Phone', 'Role', 'Language',
      'Is Active', 'Free SMS', 'Reservations', 'Favorites',
      'Audit Logs', 'Notifications', 'Created At',
    ];

    const rows = users.map((u) => [
      u.username,
      u.fullName,
      u.email || '',
      u.phoneNumber || '',
      u.role,
      u.language,
      u.isActive ? 'Yes' : 'No',
      u.freeSmsCount.toString(),
      u._count.reservations.toString(),
      u._count.favorites.toString(),
      u._count.auditLogs.toString(),
      u._count.notifications.toString(),
      u.createdAt.toISOString().split('T')[0],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users-export.csv"',
      },
    });
  } catch (error) {
    console.error('Export users error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
