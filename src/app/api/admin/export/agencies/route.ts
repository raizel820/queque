import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const agencies = await db.agency.findMany({
      include: {
        owner: { select: { fullName: true, username: true, email: true, phoneNumber: true } },
        services: { select: { name: true, isActive: true } },
        _count: {
          select: { reservations: true, staff: true, transactions: true, favorites: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV
    const headers = [
      'Name', 'Name (AR)', 'Code', 'Category', 'City', 'Wilaya',
      'Phone', 'Email', 'Website', 'Owner', 'Owner Email', 'Owner Phone',
      'Services Count', 'Active Services', 'Total Reservations',
      'Staff Count', 'Transactions', 'Favorites',
      'Subscription', 'Status', 'Is Active',
      'Working Hours', 'Created At',
    ];

    const rows = agencies.map((a) => [
      a.name,
      a.nameAr || '',
      a.customCode,
      a.category,
      a.city,
      a.wilaya,
      a.phone || '',
      a.email || '',
      a.website || '',
      a.owner.fullName,
      a.owner.email || '',
      a.owner.phoneNumber || '',
      a.services.length.toString(),
      a.services.filter((s) => s.isActive).length.toString(),
      a._count.reservations.toString(),
      a._count.staff.toString(),
      a._count.transactions.toString(),
      a._count.favorites.toString(),
      a.subscriptionTier,
      a.subscriptionStatus,
      a.isActive ? 'Yes' : 'No',
      `${a.workingHoursStart}-${a.workingHoursEnd}`,
      a.createdAt.toISOString().split('T')[0],
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
        'Content-Disposition': 'attachment; filename="agencies-export.csv"',
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
