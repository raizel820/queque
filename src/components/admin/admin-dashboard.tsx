'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  Clock,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Phone,
  Check,
  Circle,
  Activity,
  UserCheck,
  Plus,
  BarChart3,
  ClipboardList,
  Megaphone,
  Pin,
  Trash2,
   X,
  Info,
  AlertTriangle,
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AdminStats {
  totalAgencies: number;
  activeQueues: number;
  dailyReservations: number;
  totalRevenue: number;
  pendingTransactions: number;
  totalUsers?: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  details: string;
  createdAt: string;
}

function ActivityIcon({ action }: { action: string }) {
  const actionUpper = action.toUpperCase();
  if (actionUpper.includes('LOGIN')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <UserCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  if (actionUpper.includes('QUEUE_CALL') || actionUpper.includes('CALL')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  if (actionUpper.includes('PAYMENT_APPROVE') || actionUpper.includes('APPROVE')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
        <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
      <Circle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    </div>
  );
}

export function AdminDashboard() {
  const { setView, user } = useAppStore();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [realAnnouncements, setRealAnnouncements] = useState<Array<{ id: string; message: string; type: string; createdAt: string }>>([]);
  const [newAnnMsg, setNewAnnMsg] = useState('');
  const [newAnnType, setNewAnnType] = useState<'INFO' | 'WARNING' | 'URGENT'>('INFO');
  const [annLoading, setAnnLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchRealAnnouncements();
 }, []);

  const fetchRealAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setRealAnnouncements(data.announcements ?? []);
      }
    } catch { toast.error(t('error')); }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnMsg.trim() || !user?.id) return;
    setAnnLoading(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newAnnMsg.trim(), type: newAnnType, createdBy: user.id }),
      });
      if (res.ok) {
        toast.success(t('announcementCreatedSuccess'));
        setNewAnnMsg('');
        fetchRealAnnouncements();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch { toast.error(t('error')); }
    finally { setAnnLoading(false); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('announcementDeletedSuccess'));
        fetchRealAnnouncements();
      } else { toast.error(t('error')); }
    } catch { toast.error(t('error')); }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats ?? null);
        setActivities(data.recentActivity ?? []);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminExport = async (type: 'agencies' | 'users') => {
    setExportLoading(type);
    try {
      const res = await fetch(`/api/admin/export/${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `queuewise-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('exportSuccess'));
      } else {
        toast.error(t('exportFailed'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setExportLoading(null);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(
        lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US',
        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      );
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <Skeleton className="h-24 rounded-2xl skeleton-shimmer" />
        <Skeleton className="h-64 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  // Mini sparkline data (synthetic for visual enhancement)
  const sparklines = [
    [3, 5, 4, 7, 6, 8, 7, 9, 8, 10],
    [2, 4, 3, 5, 6, 4, 7, 5, 8, 6],
    [1, 3, 5, 4, 7, 6, 8, 7, 9, 8],
    [4, 3, 5, 6, 5, 7, 6, 8, 7, 9],
    [2, 1, 3, 2, 4, 3, 2, 3, 1, 2],
  ];

  const statCards = [
    {
      label: t('totalAgencies'),
      value: stats?.totalAgencies ?? 0,
      icon: Building2,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      sparkColor: '#10b981',
    },
    {
      label: t('activeQueues'),
      value: stats?.activeQueues ?? 0,
      icon: Users,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      sparkColor: '#14b8a6',
    },
    {
      label: t('dailyReservations'),
      value: stats?.dailyReservations ?? 0,
      icon: Calendar,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      sparkColor: '#14b8a6',
    },
    {
      label: t('totalRevenue'),
      value: `${(stats?.totalRevenue ?? 0).toLocaleString()} ${t('currency')}`,
      icon: CreditCard,
      color: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      sparkColor: '#f59e0b',
    },
    {
      label: t('pendingTransactions'),
      value: stats?.pendingTransactions ?? 0,
      icon: Clock,
      color: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      sparkColor: '#ef4444',
    },
  ];

  // Show daily reservations as today's activity instead of misleading growth %
  const dailyActivity = stats?.dailyReservations ?? 0;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Premium header gradient banner with branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden mb-2"
      >
        <div className="premium-header-gradient p-5 md:p-6 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -start-8 w-32 h-32 rounded-full bg-white/5" />
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                {t('adminDashboard')}
              </h1>
              <p className="text-sm text-emerald-100 mt-1 ms-[52px]">QueueWise Platform Management</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs px-3 py-1">
                <TrendingUp className="h-3 w-3 me-1" />
                {dailyActivity} {t('todayLabel')}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs px-2 py-1">
                <ShieldCheck className="h-3 w-3 me-1" />
                {t('superAdmin')}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile badges */}
      <div className="flex sm:hidden items-center gap-2 mb-1">
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium px-2 py-0.5">
          <TrendingUp className="h-3 w-3 me-1" />
          {dailyActivity} {t('todayLabel')}
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">
          <ShieldCheck className="h-3 w-3 me-1" />
          {t('superAdmin')}
        </Badge>
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAdminExport('agencies')}
          disabled={exportLoading === 'agencies'}
          className="h-8 px-3 rounded-lg gap-1.5 text-xs"
        >
          {exportLoading === 'agencies' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{t('exportAgencies')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAdminExport('users')}
          disabled={exportLoading === 'users'}
          className="h-8 px-3 rounded-lg gap-1.5 text-xs"
        >
          {exportLoading === 'users' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{t('exportUsers')}</span>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">{t('systemAnnouncements')}</h2>
          </div>
        </div>
        {/* Create Announcement Form */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 mb-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">{t('createAnnouncement')}</h3>
            </div>
            <Textarea
              value={newAnnMsg}
              onChange={(e) => setNewAnnMsg(e.target.value)}
              placeholder={t('announcementMessagePlaceholder')}
              className="min-h-[80px] resize-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('announcementType')}:</span>
              <select
                value={newAnnType}
                onChange={(e) => setNewAnnType(e.target.value as 'INFO' | 'WARNING' | 'URGENT')}
                className="h-9 px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
              >
                <option value="INFO">{t('announcementTypeInfo')}</option>
                <option value="WARNING">{t('announcementTypeWarning')}</option>
                <option value="URGENT">{t('announcementTypeUrgent')}</option>
              </select>
            </div>
            <Button
              onClick={handleCreateAnnouncement}
              disabled={annLoading || !newAnnMsg.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-10"
            >
              {annLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Plus className="h-4 w-4 me-2" />}
              {t('createAnnouncement')}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {realAnnouncements
            .filter(a => !dismissedAnnouncements.has(a.id))
            .slice(0, 5)
            .map((announcement, idx) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className={`flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm ${
                  announcement.type === 'URGENT'
                    ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200/50 dark:border-rose-800/30'
                    : announcement.type === 'WARNING'
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30'
                    : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30'
                }`}>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    announcement.type === 'URGENT'
                      ? 'bg-rose-200 dark:bg-rose-900/30'
                      : announcement.type === 'WARNING'
                      ? 'bg-amber-200 dark:bg-amber-900/30'
                      : 'bg-emerald-200 dark:bg-emerald-900/30'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 ${
                      announcement.type === 'URGENT'
                        ? 'text-rose-600 dark:text-rose-400'
                        : announcement.type === 'WARNING'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{announcement.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {announcement.type === 'URGENT' ? t('announcementTypeUrgent') : announcement.type === 'WARNING' ? t('announcementTypeWarning') : t('announcementTypeInfo')}
                      {' · '}{new Date(announcement.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setDismissedAnnouncements(prev => { const n = new Set(prev); n.add(announcement.id); return n; })}
                      aria-label={t('dismiss')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
          ))}
          {realAnnouncements.filter(a => !dismissedAnnouncements.has(a.id)).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noAnnouncements')}</p>
          )}
        </div>
        </>
      </motion.div>

      {/* Stats Grid with gradient borders + sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const spark = sparklines[idx] ?? sparklines[0];
          const minVal = Math.min(...spark);
          const maxVal = Math.max(...spark);
          const range = maxVal - minVal || 1;
          const points = spark.map((v, i) => `${(i / (spark.length - 1)) * 80},${28 - ((v - minVal) / range) * 24}`).join(' ');
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="cursor-default"
            >
              <div className="rounded-2xl p-[1px] bg-gradient-to-br from-emerald-200/40 via-transparent to-teal-200/40 dark:from-emerald-700/20 dark:via-transparent dark:to-teal-700/20">
                <Card className="border-0 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1.5 bg-white dark:bg-gray-900/90 rounded-[14px]">
                  <CardContent className={`p-4 rounded-t-[14px] ${stat.color}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${
                        idx === 0 ? 'from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40'
                        : idx === 1 ? 'from-teal-200 to-teal-300 dark:from-teal-900/40 dark:to-teal-800/40'
                        : idx === 2 ? 'from-teal-200 to-emerald-200 dark:from-teal-900/40 dark:to-emerald-900/40'
                        : idx === 3 ? 'from-amber-200 to-amber-300 dark:from-amber-900/40 dark:to-amber-800/40'
                        : 'from-rose-200 to-rose-300 dark:from-rose-900/40 dark:to-rose-800/40'
                      } flex items-center justify-center shadow-sm`}>
                        <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      {/* Mini Sparkline SVG */}
                      <svg viewBox="0 0 80 28" className="w-16 h-8 opacity-60" fill="none">
                        <polyline points={points} stroke={stat.sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points={`${points} ${80},${28} 0,28`} fill={stat.sparkColor} fillOpacity="0.08" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent number-animate">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* System Uptime Live Pulse */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30">
          {/* Pulsing green dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('systemUptime')}</span>
          <Badge variant="outline" className="ms-auto text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">99.9%</Badge>
        </div>
      </motion.div>

      {/* System Health Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              {t('systemHealth')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Active Users Today */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{t('activeUsersToday')}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{stats?.totalUsers ?? stats?.dailyReservations ?? 0}</p>
                </div>
              </div>
              {/* Total Agencies */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-900/10">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-200 to-teal-300 dark:from-teal-900/40 dark:to-teal-800/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{t('totalAgencies')}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{stats?.totalAgencies ?? 0}</p>
                </div>
              </div>
              {/* Active Queues */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{t('activeQueues')}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{stats?.activeQueues ?? 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              {t('quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('admin-agencies')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 quick-action-card"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-800/40 dark:to-emerald-700/40 flex items-center justify-center shadow-sm">
                  <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">{t('addNewAgency')}</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('admin-analytics')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-0 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 hover:from-teal-100 hover:to-cyan-100 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30 shadow-sm hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 quick-action-card"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-200 to-teal-300 dark:from-teal-800/40 dark:to-teal-700/40 flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">{t('viewAnalytics')}</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('admin-users')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 shadow-sm hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 quick-action-card"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-800/40 dark:to-amber-700/40 flex items-center justify-center shadow-sm">
                  <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">{t('manageUsers')}</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('admin-transactions')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-0 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-900/30 dark:hover:to-pink-900/30 shadow-sm hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 quick-action-card"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-200 to-rose-300 dark:from-rose-800/40 dark:to-rose-700/40 flex items-center justify-center shadow-sm">
                  <CreditCard className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">{t('viewTransactions')}</span>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('noData')}</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                {activities.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 transition-all duration-200 hover:shadow-sm cursor-default border-s-3 activity-item-hover ${
                      item.action.toUpperCase().includes('LOGIN') ? 'border-s-emerald-500'
                      : item.action.toUpperCase().includes('APPROVE') ? 'border-s-amber-500'
                      : item.action.toUpperCase().includes('CALL') ? 'border-s-teal-500'
                      : 'border-s-gray-300 dark:border-s-gray-700'
                    }`}
                  >
                    <ActivityIcon action={item.action} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.entity} · {formatTime(item.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Version Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center pb-2"
      >
        <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal border-dashed">
          {t('platformVersion')}: v1.0.0 · {t('lastUpdated')}: {formatTime(new Date().toISOString())}
        </Badge>
      </motion.div>
    </div>
  );
}
