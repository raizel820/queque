import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayStart, getTodayEnd } from '@/lib/date-utils';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    const [
      totalAgencies,
      activeQueues,
      dailyReservations,
      pendingTransactions,
      completedTransactions,
      totalUsers,
    ] = await Promise.all([
      db.agency.count({ where: { isActive: true } }),
      db.agency.count({ where: { isActive: true, isQueueOpen: true } }),
      db.reservation.count({
        where: { joinedAt: { gte: todayStart, lte: todayEnd } },
      }),
      db.transaction.count({ where: { status: 'PENDING' } }),
      db.transaction.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      db.user.count({ where: { isActive: true } }),
    ]);

    // Get recent activity
    const recentActivity = await db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, username: true } },
      },
    });

    const totalRevenue = completedTransactions._sum.amount ?? 0;

    return NextResponse.json({
      stats: {
        totalAgencies,
        activeQueues,
        dailyReservations,
        totalRevenue,
        pendingTransactions,
        totalUsers,
      },
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        entity: log.entityType || '',
        details: log.details || log.action,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
