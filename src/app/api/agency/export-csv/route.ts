import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAgencyAccess, authErrorResponse } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    await requireAgencyAccess(request, agencyId);

    const reservations = await db.reservation.findMany({
      where: { agencyId },
      include: {
        user: { select: { username: true, fullName: true, phoneNumber: true } },
        service: { select: { name: true } },
      },
      orderBy: { joinedAt: 'desc' },
      take: 1000,
    });

    if (reservations.length === 0) {
      return NextResponse.json({ error: 'No reservations found' }, { status: 404 });
    }

    const header = [
      'Queue Number',
      'Display Number',
      'Status',
      'User',
      'Phone',
      'Service',
      'Estimated Wait (min)',
      'Joined At',
      'Reserved Date',
      'Rating',
    ];

    const rows = reservations.map((r) => [
      String(r.queueNumber),
      r.displayNumber || '',
      r.status,
      r.user?.fullName || r.user?.username || 'Unknown',
      r.user?.phoneNumber || '',
      r.service?.name || 'Unknown',
      String(r.estimatedWait || 0),
      new Date(r.joinedAt).toLocaleString(),
      r.reservedDate || '',
      String(r.rating || ''),
    ]);

    const csvContent = [
      header.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="blasti-reservations-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    const authResp = authErrorResponse(error);
    if (authResp) return authResp;
    console.error('Agency export CSV error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
