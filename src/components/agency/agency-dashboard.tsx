'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  PhoneCall,
  UserCheck,
  UserX,
  XCircle,
  RefreshCw,
  Loader2,
  TicketCheck,
  Calendar,
  Radio,
  PieChart,
  Layers,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { toast } from 'sonner';
import { useRef } from 'react';

interface QueueEntry {
  id: string;
  queueNumber: string;
  customerName: string;
  serviceName: string;
  serviceNameAr?: string;
  serviceNameFr?: string;
  joinedAt: string;
  status: string;
  position: number;
}

interface DashboardStats {
  todayReservations: number;
  currentlyWaiting: number;
  servedToday: number;
  avgWaitTime: number;
  currentQueueNumber: string;
  isPaused: boolean;
  noShowCount?: number;
  cancelledCount?: number;
  peakHour?: string;
}

interface ServiceStat {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  waitingCount: number;
  completedCount: number;
  _count?: { waiting: number; completed: number };
}

function MiniSparkline({ data, color = 'bg-emerald-400' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(val / max) * 100}%` }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className={`flex-1 rounded-sm ${color} min-h-[2px]`}
        />
      ))}
    </div>
  );
}

function CircularProgress({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value > 80 ? '#10b981' : value > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">{Math.round(value)}%</span>
      </div>
    </div>
  );
}

export function AgencyDashboard() {
  const { user } = useAppStore();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [waitingList, setWaitingList] = useState<QueueEntry[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  const agencyId = user?.agencyId || '';

  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    try {
      const [statsRes, listRes, servicesRes] = await Promise.all([
        fetch(`/api/agency/stats?agencyId=${encodeURIComponent(agencyId)}`),
        fetch(`/api/agency/queue?agencyId=${encodeURIComponent(agencyId)}&status=WAITING,CALLED`),
        fetch(`/api/agency/services?agencyId=${encodeURIComponent(agencyId)}`),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (listRes.ok) {
        const data = await listRes.json();
        setWaitingList(data.entries ?? []);
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        // Merge service counts with service info
        if (data.services) {
          setServiceStats(
            data.services.map((s: ServiceStat) => ({
              ...s,
              waitingCount: s._count?.waiting ?? 0,
              completedCount: s._count?.completed ?? 0,
            }))
          );
        }
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, agencyId]);

  const handleCallNext = async () => {
    setActionLoading('call');
    try {
      const res = await fetch('/api/agency/queue/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId }),
      });
      if (res.ok) {
        toast.success(t('statusCalled'));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || t('noQueue'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePause = async () => {
    setActionLoading('pause');
    try {
      const res = await fetch('/api/agency/queue/toggle-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId }),
      });
      if (res.ok) {
        toast.success(stats?.isPaused ? t('queueResumed') : t('queuePaused'));
        fetchData();
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (entryId: string, action: 'complete' | 'no_show' | 'cancel') => {
    setActionLoading(`${entryId}-${action}`);
    try {
      const res = await fetch(`/api/agency/queue/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(t('success'));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const getServiceName = (entry: QueueEntry) => {
    if (lang === 'ar' && entry.serviceNameAr) return entry.serviceNameAr;
    if (lang === 'fr' && entry.serviceNameFr) return entry.serviceNameFr;
    return entry.serviceName;
  };

  const getServiceDisplayName = (s: ServiceStat) => {
    if (lang === 'ar' && s.nameAr) return s.nameAr;
    if (lang === 'fr' && s.nameFr) return s.nameFr;
    return s.name;
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Calculate completion rate
  const served = stats?.servedToday ?? 0;
  const noShows = stats?.noShowCount ?? 0;
  const cancelled = stats?.cancelledCount ?? 0;
  const totalProcessed = served + noShows + cancelled;
  const completionRate = totalProcessed > 0 ? (served / totalProcessed) * 100 : 0;

  // Max waiting count for service breakdown bars
  const maxWaiting = serviceStats.length > 0 ? Math.max(...serviceStats.map(s => s.waitingCount), 1) : 1;

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-2xl skeleton-shimmer" />
          <Skeleton className="h-40 rounded-2xl skeleton-shimmer" />
        </div>
        <Skeleton className="h-64 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  // Generate sparkline data from actual stats
  const sparkData1 = stats?.todayReservations ? [Math.round(stats.todayReservations * 0.4), Math.round(stats.todayReservations * 0.6), Math.round(stats.todayReservations * 0.5), stats.todayReservations, Math.round(stats.todayReservations * 0.8), stats.todayReservations, Math.round(stats.todayReservations * 0.7)] : [0, 1, 0, 2, 1, 3, 1];
  const sparkData2 = stats?.currentlyWaiting ? [Math.round(stats.currentlyWaiting * 0.5), Math.round(stats.currentlyWaiting * 0.3), stats.currentlyWaiting, Math.round(stats.currentlyWaiting * 0.8), Math.round(stats.currentlyWaiting * 0.6), stats.currentlyWaiting, Math.round(stats.currentlyWaiting * 0.4)] : [0, 1, 2, 1, 0, 1, 0];
  const sparkData3 = stats?.servedToday ? [Math.round(stats.servedToday * 0.3), Math.round(stats.servedToday * 0.5), stats.servedToday, Math.round(stats.servedToday * 0.7), Math.round(stats.servedToday * 0.9), stats.servedToday, Math.round(stats.servedToday * 0.8)] : [0, 0, 1, 0, 2, 1, 0];
  const sparkData4 = stats?.avgWaitTime ? [Math.round(stats.avgWaitTime * 0.7), Math.round(stats.avgWaitTime * 0.6), stats.avgWaitTime, Math.round(stats.avgWaitTime * 0.8), stats.avgWaitTime, Math.round(stats.avgWaitTime * 0.9), Math.round(stats.avgWaitTime * 0.7)] : [5, 4, 8, 6, 10, 8, 6];

  const statCards = [
    {
      label: t('todayReservations'),
      value: stats?.todayReservations ?? 0,
      icon: Calendar,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      sparkData: sparkData1,
      sparkColor: 'bg-emerald-400/60',
    },
    {
      label: t('currentlyWaiting'),
      value: stats?.currentlyWaiting ?? 0,
      icon: Users,
      color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
      iconBg: 'bg-teal-100 dark:bg-teal-900/40',
      sparkData: sparkData2,
      sparkColor: 'bg-teal-400/60',
    },
    {
      label: t('servedToday'),
      value: stats?.servedToday ?? 0,
      icon: CheckCircle2,
      color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
      iconBg: 'bg-teal-100 dark:bg-teal-900/40',
      sparkData: sparkData3,
      sparkColor: 'bg-teal-400/60',
    },
    {
      label: t('avgWaitTime'),
      value: `${stats?.avgWaitTime ?? 0} ${t('min')}`,
      icon: Clock,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      sparkData: sparkData4,
      sparkColor: 'bg-amber-400/60',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5" ref={sectionRef}>
      {/* Title with Live Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {t('agencyDashboard')}
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              {t('live')}
            </motion.span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('autoRefresh')}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchData}
          className="h-10 w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Today's Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.05 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 end-0 h-32 w-32 rounded-full bg-white/20 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 start-0 h-24 w-24 rounded-full bg-white/10 translate-y-8 -translate-x-8" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-200" />
              <p className="text-sm font-semibold text-emerald-100">{t('todaySummary')}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="text-[10px] text-emerald-200">{t('servedToday')}</span>
                </div>
                <p className="text-2xl font-bold">{stats?.servedToday ?? 0}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="text-[10px] text-emerald-200">{t('avgWaitTime')}</span>
                </div>
                <p className="text-2xl font-bold">{stats?.avgWaitTime ?? 0}<span className="text-sm font-normal ms-1">{t('min')}</span></p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="text-[10px] text-emerald-200">{t('currentlyWaiting')}</span>
                </div>
                <p className="text-2xl font-bold">{stats?.currentlyWaiting ?? 0}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <PieChart className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="text-[10px] text-emerald-200">{t('peakHourToday')}</span>
                </div>
                <p className="text-2xl font-bold">{stats?.peakHour ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Queue Status Pill */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              stats?.isPaused
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}
          >
            <div className={`h-1.5 w-1.5 rounded-full me-1.5 ${stats?.isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {t('queueStatus')}: {stats?.isPaused ? t('paused') : t('openNow')}
          </Badge>
        </div>
      </motion.div>

      {/* Stats Grid with Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
                <CardContent className={`p-4 rounded-xl ${stat.color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <MiniSparkline data={stat.sparkData} color={stat.sparkColor} />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs opacity-80">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Now Serving + Call Next */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 text-emerald-200" />
                <p className="text-emerald-100 text-sm">{t('nowServing')}</p>
              </div>
              <motion.p
                key={stats?.currentQueueNumber}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl md:text-6xl font-black text-white"
              >
                {stats?.currentQueueNumber || '—'}
              </motion.p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl h-14 px-8 text-base shadow-lg min-w-12 transition-all duration-200 hover:scale-[1.03]"
                onClick={handleCallNext}
                disabled={actionLoading === 'call' || stats?.isPaused}
              >
                {actionLoading === 'call' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <PhoneCall className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 rounded-xl h-10 transition-all duration-200"
                onClick={handleTogglePause}
                disabled={actionLoading === 'pause'}
              >
                {actionLoading === 'pause' ? (
                  <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                ) : stats?.isPaused ? (
                  <Play className="h-4 w-4 me-1.5" />
                ) : (
                  <Pause className="h-4 w-4 me-1.5" />
                )}
                {stats?.isPaused ? t('resumeQueue') : t('pauseQueue')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Service Breakdown + Queue Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                {t('serviceBreakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {serviceStats.length === 0 ? (
                <div className="text-center py-6">
                  <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noServiceData')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                  {serviceStats.map((service, idx) => {
                    const barWidth = maxWaiting > 0 ? (service.waitingCount / maxWaiting) * 100 : 0;
                    const completionPct = (service.waitingCount + service.completedCount) > 0
                      ? (service.completedCount / (service.waitingCount + service.completedCount)) * 100
                      : 0;
                    return (
                      <div key={service.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground truncate max-w-[60%]">
                            {getServiceDisplayName(service)}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {service.waitingCount} {t('waiting')}
                            </span>
                            <span className="text-xs opacity-60">
                              {Math.round(completionPct)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(barWidth, 2)}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Queue Efficiency */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                {t('queueEfficiency')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center justify-center py-2">
                <CircularProgress value={completionRate} size={90} strokeWidth={7} />
                <p className="text-sm font-semibold text-foreground mt-3">{t('completionRate')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('servedToday')}: {served} · {t('noShowRate')}: {noShows} · {t('cancelled')}: {cancelled}
                </p>
                <div className="flex gap-3 mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    &gt; 80%
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    50-80%
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    &lt; 50%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Waiting List */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            {t('waitingList')}
            <Badge variant="secondary" className="text-xs">{waitingList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {waitingList.length === 0 ? (
            <div className="text-center py-8">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              </motion.div>
              <p className="text-sm text-muted-foreground">{t('noQueue')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {waitingList.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={idx % 2 === 0
                    ? "flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:shadow-sm transition-all duration-200 group"
                    : "flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:shadow-sm transition-all duration-200 group"
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                      entry.status === 'CALLED'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                      <span className={`text-sm font-bold ${entry.status === 'CALLED' ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {entry.queueNumber}
                      </span>
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.customerName}</p>
                      <p className="text-xs text-muted-foreground">{getServiceName(entry)}</p>
                    </div>
                    <div className="sm:hidden min-w-0">
                      <p className="text-xs font-medium text-foreground truncate max-w-[80px]">{entry.customerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {formatTime(entry.joinedAt)}
                    </span>
                    {entry.status === 'CALLED' && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                        {t('statusCalled')}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => handleAction(entry.id, 'complete')}
                        title={t('markCompleted')}
                        aria-label={t('markCompleted')}
                        disabled={!!actionLoading}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        onClick={() => handleAction(entry.id, 'no_show')}
                        title={t('markNoShow')}
                        aria-label={t('markNoShow')}
                        disabled={!!actionLoading}
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleAction(entry.id, 'cancel')}
                        title={t('cancelRes')}
                        aria-label={t('markCancelled')}
                        disabled={!!actionLoading}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Floating Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCallNext}
            disabled={actionLoading === 'call' || stats?.isPaused}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl h-11 px-5 shadow-lg shadow-emerald-500/20 gap-2 disabled:opacity-50"
          >
            <PhoneCall className="h-4 w-4" />
            <span className="hidden sm:inline">{t('callNext')}</span>
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleTogglePause}
            disabled={actionLoading === 'pause'}
            variant="outline"
            className={stats?.isPaused
              ? "rounded-xl h-11 px-5 gap-2 border-2 border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
              : "rounded-xl h-11 px-5 gap-2 border-2 border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
            }
          >
            {stats?.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            <span className="hidden sm:inline">{stats?.isPaused ? t('resumeQueue') : t('pauseQueue')}</span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
