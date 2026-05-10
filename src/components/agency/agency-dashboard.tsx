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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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

export function AgencyDashboard() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [waitingList, setWaitingList] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/agency/stats'),
        fetch('/api/agency/queue?status=WAITING,CALLED'),
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
  }, [fetchData]);

  const handleCallNext = async () => {
    setActionLoading('call');
    try {
      const res = await fetch('/api/agency/queue/call-next', { method: 'POST' });
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
      const res = await fetch('/api/agency/queue/toggle-pause', { method: 'POST' });
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

  const statCards = [
    {
      label: t('todayReservations'),
      value: stats?.todayReservations ?? 0,
      icon: Calendar,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    {
      label: t('currentlyWaiting'),
      value: stats?.currentlyWaiting ?? 0,
      icon: Users,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    {
      label: t('servedToday'),
      value: stats?.servedToday ?? 0,
      icon: CheckCircle2,
      color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
      iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    },
    {
      label: t('avgWaitTime'),
      value: `${stats?.avgWaitTime ?? 0} ${t('min')}`,
      icon: Clock,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className={`p-4 rounded-xl ${stat.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs opacity-80">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Current Number + Call Next */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm mb-1">{t('currentNumber')}</p>
              <p className="text-5xl md:text-6xl font-black text-white">
                {stats?.currentQueueNumber || '—'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl h-14 px-8 text-base shadow-lg min-w-12"
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
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 rounded-xl h-10"
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
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('noQueue')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {waitingList.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
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
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
                        {t('statusCalled')}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
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
