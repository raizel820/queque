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

export function AgencyDashboard() {
  const { user } = useAppStore();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [waitingList, setWaitingList] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  const agencyId = user?.agencyId || '';

  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch(`/api/agency/stats?agencyId=${encodeURIComponent(agencyId)}`),
        fetch(`/api/agency/queue?agencyId=${encodeURIComponent(agencyId)}&status=WAITING,CALLED`),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (listRes.ok) {
        const data = await listRes.json();
        setWaitingList(data.entries ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // Generate fake sparkline data
  const sparkData1 = [3, 5, 4, 7, 6, 8, 5];
  const sparkData2 = [4, 3, 5, 2, 6, 4, 3];
  const sparkData3 = [2, 4, 6, 5, 8, 9, 7];
  const sparkData4 = [15, 12, 18, 14, 20, 16, 13];

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('agencyDashboard')}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchData}
          className="h-10 w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

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
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
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
      <Card className="border-0 shadow-sm overflow-hidden">
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

      {/* Waiting List */}
      <Card className="border-0 shadow-sm">
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
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:shadow-sm transition-all duration-200 group"
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
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-foreground">{entry.customerName}</p>
                      <p className="text-xs text-muted-foreground">{getServiceName(entry)}</p>
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
    </div>
  );
}
