import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayStart, getTodayEnd } from '@/lib/date-utils';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET() {
  try {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    // ── Database stats (parallel queries) ──
    const [
      totalUsers,
      totalAgencies,
      totalReservations,
      activeReservations,
      totalNotifications,
      totalAuditLogs,
    ] = await Promise.all([
      db.user.count(),
      db.agency.count(),
      db.reservation.count(),
      db.reservation.count({ where: { status: { in: ['WAITING', 'CALLED'] } } }),
      db.notification.count(),
      db.auditLog.count(),
    ]);

    // ── Queue stats ──
    const [totalOpenQueues, totalWaitingCustomers, totalCalledCustomers] = await Promise.all([
      db.agency.count({ where: { isQueueOpen: true, isActive: true } }),
      db.reservation.count({ where: { status: 'WAITING' } }),
      db.reservation.count({ where: { status: 'CALLED' } }),
    ]);

    // Queue sizes per open agency
    const queueSizes = await db.reservation.groupBy({
      by: ['agencyId'],
      where: { status: { in: ['WAITING', 'CALLED'] } },
      _count: { id: true },
    });
    const queueSizeValues = queueSizes.map((q) => q._count.id);
    const avgQueueSize = queueSizeValues.length > 0
      ? queueSizeValues.reduce((a, b) => a + b, 0) / queueSizeValues.length
      : 0;
    const maxQueueSize = queueSizeValues.length > 0 ? Math.max(...queueSizeValues) : 0;

    // Queues by category
    const agenciesByCategory = await db.agency.findMany({
      where: { isQueueOpen: true, isActive: true },
      select: { id: true, category: true },
    });
    const categoryMap = new Map<string, { open: number; waiting: number }>();
    for (const agency of agenciesByCategory) {
      const cat = agency.category || 'Other';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { open: 0, waiting: 0 });
      }
      categoryMap.get(cat)!.open += 1;
    }
    // Count waiting per category
    const waitingByCategory = await db.reservation.groupBy({
      by: ['agencyId'],
      where: { status: 'WAITING' },
      _count: { id: true },
    });
    const agencyIdToCategory = new Map(agenciesByCategory.map((a) => [a.id, a.category || 'Other']));
    for (const wbc of waitingByCategory) {
      const cat = agencyIdToCategory.get(wbc.agencyId) || 'Other';
      if (categoryMap.has(cat)) {
        categoryMap.get(cat)!.waiting += wbc._count.id;
      }
    }
    const queuesByCategory: Record<string, { open: number; waiting: number }> = {};
    for (const [cat, data] of categoryMap) {
      queuesByCategory[cat] = data;
    }

    // ── Today's activity ──
    const [todayJoins, todayCompletions, todayCancellations] = await Promise.all([
      db.reservation.count({
        where: { joinedAt: { gte: todayStart, lte: todayEnd } },
      }),
      db.reservation.count({
        where: { completedAt: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' },
      }),
      db.reservation.count({
        where: { cancelledAt: { gte: todayStart, lte: todayEnd }, status: 'CANCELLED' },
      }),
    ]);

    // Estimate avg wait time from completed reservations today
    const completedToday = await db.reservation.findMany({
      where: {
        completedAt: { gte: todayStart, lte: todayEnd },
        status: 'COMPLETED',
        calledAt: { not: null },
      },
      select: { joinedAt: true, calledAt: true },
      take: 100,
    });
    let avgWaitTime = 0;
    if (completedToday.length > 0) {
      const totalWaitMs = completedToday.reduce((acc, r) => {
        if (r.calledAt) {
          return acc + (new Date(r.calledAt).getTime() - new Date(r.joinedAt).getTime());
        }
        return acc;
      }, 0);
      avgWaitTime = Math.max(0, Math.round(totalWaitMs / completedToday.length / 1000 / 60)); // minutes
    }

    // ── Database file size (SQLite) ──
    let dbSizeBytes = 0;
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      const dbPathMatch = dbUrl.match(/file:(.+)/);
      const dbPath = dbPathMatch ? dbPathMatch[1] : path.join(process.cwd(), 'db', 'dev.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        dbSizeBytes = stats.size;
      }
    } catch {
      // ignore
    }

    // ── System info ──
    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      success: true,
      performance: {
        database: {
          totalUsers,
          totalAgencies,
          totalReservations,
          activeReservations,
          totalNotifications,
          totalAuditLogs,
          dbSizeBytes,
        },
        queues: {
          totalOpenQueues,
          totalWaitingCustomers,
          totalCalledCustomers,
          avgQueueSize: Math.round(avgQueueSize * 10) / 10,
          maxQueueSize,
          queuesByCategory,
        },
        today: {
          joins: todayJoins,
          completions: todayCompletions,
          cancellations: todayCancellations,
          avgWaitTime,
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
            arrayBuffers: memoryUsage.arrayBuffers,
          },
          nodeVersion: process.version,
          platform: process.platform,
          cpus: os.cpus().length,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[admin/performance] Error:', message);
    return NextResponse.json(
      { success: false, error: 'Operation failed', details: message },
      { status: 500 }
    );
  }
}
