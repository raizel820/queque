import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayStart, getTodayEnd } from '@/lib/date-utils';
import { cache, CACHE_TTL } from '@/lib/cache';

export async function GET() {
  try {
    // Cache dashboard for 15 seconds - data doesn't change rapidly
    const result = await cache.getOrSet(
      'admin:dashboard',
      async () => {
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

        // Get recent activity - limit to 5 for performance
        const recentActivity = await db.auditLog.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            entityType: true,
            details: true,
            createdAt: true,
            user: { select: { fullName: true, username: true } },
          },
        });

        const totalRevenue = completedTransactions._sum.amount ?? 0;

        return {
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
        };
      },
      CACHE_TTL.SHORT // 15 seconds cache
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[admin/dashboard] Error:', message);
    return NextResponse.json({ error: 'Operation failed', details: message }, { status: 500 });
  }
}
