'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Database,
  Users,
  Clock,
  Server,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  HardDrive,
  Cpu,
  MemoryStick,
  Zap,
  UserCheck,
  Timer,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Interfaces ─────────────────────────────────────────────────────
interface PerformanceData {
  database: {
    totalUsers: number;
    totalAgencies: number;
    totalReservations: number;
    activeReservations: number;
    totalNotifications: number;
    totalAuditLogs: number;
    dbSizeBytes: number;
  };
  queues: {
    totalOpenQueues: number;
    totalWaitingCustomers: number;
    totalCalledCustomers: number;
    avgQueueSize: number;
    maxQueueSize: number;
    queuesByCategory: Record<string, { open: number; waiting: number }>;
  };
  today: {
    joins: number;
    completions: number;
    cancellations: number;
    avgWaitTime: number;
  };
  system: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    nodeVersion: string;
    platform: string;
    cpus: number;
  };
}

interface LoadTestResults {
  success: boolean;
  hasResults: boolean;
  summary: string | null;
  report: Record<string, unknown> | null;
}

// ─── Animation variants ────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ─── Helpers ────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getHealthStatus(heapUsed: number, heapTotal: number): 'healthy' | 'warning' | 'critical' {
  const usagePercent = heapTotal > 0 ? (heapUsed / heapTotal) * 100 : 0;
  if (usagePercent < 70) return 'healthy';
  if (usagePercent < 90) return 'warning';
  return 'critical';
}

function getHealthColor(status: 'healthy' | 'warning' | 'critical') {
  switch (status) {
    case 'healthy': return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
    case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    case 'critical': return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  }
}

// Generate synthetic activity data for the area chart
function generateActivityData(joins: number) {
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  return hours.map((hour, idx) => {
    const base = Math.max(1, Math.round(joins / 8));
    const peak = idx >= 2 && idx <= 5 ? 1.5 : 0.6;
    const variation = 0.7 + Math.random() * 0.6;
    return {
      hour,
      reservations: Math.max(0, Math.round(base * peak * variation)),
    };
  });
}

// ─── Component ──────────────────────────────────────────────────────
export function PerformanceDashboard() {
  const { t } = useLanguage();
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loadTest, setLoadTest] = useState<LoadTestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [perfRes, ltRes] = await Promise.all([
        fetch('/api/admin/performance'),
        fetch('/api/admin/loadtest-results'),
      ]);
      if (perfRes.ok) {
        const perfData = await perfRes.json();
        if (perfData.success) {
          setPerformance(perfData.performance);
        }
      }
      if (ltRes.ok) {
        const ltData = await ltRes.json();
        setLoadTest(ltData);
      }
      setLastRefresh(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
        <p className="text-sm">{t('failedToLoadPerformance' as any)}</p>
        <button
          onClick={() => fetchData(true)}
          className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  const healthStatus = getHealthStatus(
    performance.system.memoryUsage.heapUsed,
    performance.system.memoryUsage.heapTotal
  );
  const healthColors = getHealthColor(healthStatus);
  const memoryUsagePercent = performance.system.memoryUsage.heapTotal > 0
    ? Math.round((performance.system.memoryUsage.heapUsed / performance.system.memoryUsage.heapTotal) * 100)
    : 0;

  const activityData = generateActivityData(performance.today.joins);

  // Extract load test metrics from report
  const ltReport = loadTest?.report as Record<string, unknown> | null;
  const ltMetrics = ltReport?.metrics as Record<string, unknown> | undefined;
  const ltRootGauge = ltReport?.root_gauge as Record<string, unknown> | undefined;

  const totalRequests = (ltMetrics?.http_reqs as Record<string, unknown>)?.count as number
    ?? (ltRootGauge?.requests_total as number)
    ?? 0;
  const errorRate = (ltMetrics?.http_req_failed as Record<string, unknown>)?.rate as number ?? 0;
  const p95Latency = (ltMetrics?.http_req_duration as Record<string, unknown>)?.values as Record<string, unknown> | undefined
    ? ((ltMetrics?.http_req_duration as Record<string, unknown>).values as Record<string, unknown>)['p(95)'] as number
    : undefined;
  const rps = (ltMetrics?.http_reqs as Record<string, unknown>)?.rate as number ?? 0;
  const iterationCount = (ltMetrics?.iterations as Record<string, unknown>)?.count as number ?? 0;
  const vusMax = (ltMetrics?.vus_max as Record<string, unknown>)?.value as number ?? 0;

  return (
    <div className="space-y-5">
      {/* ─── Refresh bar ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs text-muted-foreground">
            {t('liveUpdated' as any)} {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={t('refreshPerformanceData' as any)}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── Main Stats Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Database Stats Card ── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center shadow-sm">
                  <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                {t('databaseStats' as any)}
                <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 ms-auto">
                  SQLite
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('totalUsersLabel' as any), value: performance.database.totalUsers, icon: Users, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: t('agenciesLabel' as any), value: performance.database.totalAgencies, icon: HardDrive, color: 'text-teal-600 dark:text-teal-400' },
                  { label: t('reservationsLabel' as any), value: performance.database.totalReservations, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
                  { label: t('activeResLabel' as any), value: performance.database.activeReservations, icon: Activity, color: 'text-rose-600 dark:text-rose-400' },
                  { label: t('notificationsLabel' as any), value: performance.database.totalNotifications, icon: Zap, color: 'text-purple-600 dark:text-purple-400' },
                  { label: t('auditLogsLabel' as any), value: performance.database.totalAuditLogs, icon: BarChart3, color: 'text-cyan-600 dark:text-cyan-400' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-foreground leading-tight">
                          {item.value.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* DB Size */}
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30">
                <HardDrive className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{t('dbSize' as any)}:</span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatBytes(performance.database.dbSizeBytes)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Queue Stats Card ── */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-200 to-teal-300 dark:from-teal-900/40 dark:to-teal-800/40 flex items-center justify-center shadow-sm">
                  <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                {t('queueStats' as any)}
                <Badge className="text-[9px] px-1.5 py-0 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0 ms-auto">
                  {t('liveLabel' as any)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('openQueues' as any), value: performance.queues.totalOpenQueues, icon: Server, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: t('waitingLabel'), value: performance.queues.totalWaitingCustomers, icon: Users, color: 'text-amber-600 dark:text-amber-400' },
                  { label: t('calledLabel' as any), value: performance.queues.totalCalledCustomers, icon: UserCheck, color: 'text-teal-600 dark:text-teal-400' },
                  { label: t('avgQueueSize' as any), value: performance.queues.avgQueueSize, icon: BarChart3, color: 'text-cyan-600 dark:text-cyan-400' },
                  { label: t('maxQueueSize' as any), value: performance.queues.maxQueueSize, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-200 to-teal-300 dark:from-teal-900/40 dark:to-teal-800/40 flex items-center justify-center flex-shrink-0">
                        <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-foreground leading-tight">
                          {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Queue by category */}
              {Object.keys(performance.queues.queuesByCategory).length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t('byCategory' as any)}</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {Object.entries(performance.queues.queuesByCategory).map(([cat, data]) => (
                      <div key={cat} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-xs">
                        <span className="text-muted-foreground truncate">{cat}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                            {data.open} {t('openLower' as any)}
                          </Badge>
                          <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                            {data.waiting} {t('waitingLower' as any)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Today's Activity Card ── */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center shadow-sm">
                  <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                {t('todaysActivity' as any)}
                <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 ms-auto">
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center flex-shrink-0">
                    <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 leading-tight">
                      {performance.today.joins.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t('joins' as any)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/10">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-200 to-teal-300 dark:from-teal-900/40 dark:to-teal-800/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-teal-700 dark:text-teal-400 leading-tight">
                      {performance.today.completions.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t('completions' as any)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-200 to-red-300 dark:from-red-900/40 dark:to-red-800/40 flex items-center justify-center flex-shrink-0">
                    <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400 leading-tight">
                      {performance.today.cancellations.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t('cancellations' as any)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400 leading-tight">
                      {performance.today.avgWaitTime}m
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t('avgWait' as any)}</p>
                  </div>
                </div>
              </div>

              {/* Activity Area Chart */}
              <div className="mt-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {t('hourlyReservationActivity' as any)}
                </p>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="reservations"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#colorReservations)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── System Health Card ── */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-200 to-rose-300 dark:from-rose-900/40 dark:to-rose-800/40 flex items-center justify-center shadow-sm">
                  <Server className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                {t('systemHealth')}
                <Badge className={`text-[9px] px-1.5 py-0 border-0 ms-auto ${healthColors.badge}`}>
                  {healthStatus === 'healthy' ? t('healthy' as any) : healthStatus === 'warning' ? t('warning' as any) : t('critical' as any)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Uptime */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t('uptime')}</p>
                  <p className="text-sm font-bold text-foreground">{formatUptime(performance.system.uptime)}</p>
                </div>
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>

              {/* Memory Usage */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 space-y-2">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">{t('memory' as any)}</span>
                  <span className="text-[10px] text-muted-foreground ms-auto">
                    {formatBytes(performance.system.memoryUsage.heapUsed)} / {formatBytes(performance.system.memoryUsage.heapTotal)}
                  </span>
                </div>
                <Progress value={memoryUsagePercent} className="h-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] text-muted-foreground">
                    {t('rss' as any)}: <span className="font-medium text-foreground">{formatBytes(performance.system.memoryUsage.rss)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {t('heap' as any)}: <span className="font-medium text-foreground">{memoryUsagePercent}%</span>
                  </div>
                </div>
              </div>

              {/* Platform info */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <p className="text-sm font-bold text-foreground">{performance.system.cpus}</p>
                  <p className="text-[9px] text-muted-foreground">{t('cpus' as any)}</p>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-bold text-foreground">{performance.system.nodeVersion}</p>
                  <p className="text-[9px] text-muted-foreground">{t('node' as any)}</p>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <HardDrive className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <p className="text-xs font-bold text-foreground capitalize">{performance.system.platform}</p>
                  <p className="text-[9px] text-muted-foreground">{t('os' as any)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Load Test Results Card ─── */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-200 to-cyan-300 dark:from-cyan-900/40 dark:to-cyan-800/40 flex items-center justify-center shadow-sm">
                <BarChart3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              {t('loadTestResults' as any)}
              {loadTest?.hasResults ? (
                <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 ms-auto">
                  {t('available' as any)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground ms-auto">
                  {t('noDataLabel' as any)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadTest?.hasResults ? (
              <div className="space-y-3">
                {/* Key metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: t('totalRequests' as any), value: totalRequests > 0 ? totalRequests.toLocaleString() : '—', icon: Activity, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: t('errorRate' as any), value: errorRate > 0 ? `${(errorRate * 100).toFixed(1)}%` : '—', icon: AlertTriangle, color: errorRate > 0.05 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
                    { label: t('p95Latency' as any), value: p95Latency !== undefined ? `${Math.round(p95Latency)}ms` : '—', icon: Timer, color: p95Latency && p95Latency > 1000 ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400' },
                    { label: t('rpsLabel' as any), value: rps > 0 ? rps.toFixed(1) : '—', icon: Zap, color: 'text-cyan-600 dark:text-cyan-400' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                        <Icon className={`h-4 w-4 ${item.color} flex-shrink-0`} />
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.value}</p>
                          <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional metrics */}
                {(iterationCount > 0 || vusMax > 0) && (
                  <div className="flex items-center gap-4 px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200/50 dark:border-cyan-800/30">
                    {iterationCount > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {t('iterations' as any)}: <span className="font-medium text-foreground">{iterationCount.toLocaleString()}</span>
                      </span>
                    )}
                    {vusMax > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {t('maxVus' as any)}: <span className="font-medium text-foreground">{vusMax}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Summary text */}
                {loadTest.summary && (
                  <details className="group">
                    <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      {t('viewFullSummary' as any)}
                    </summary>
                    <pre className="mt-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 overflow-x-auto text-[10px] text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {loadTest.summary}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t('noLoadTestResults' as any)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('runToGenerate' as any).replace('{command}', 'bun run test:load:10k')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
