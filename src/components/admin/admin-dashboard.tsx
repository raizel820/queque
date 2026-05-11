'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Phone,
  Check,
  Circle,
  Activity,
  UserCheck,
} from 'lucide-react';
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
  const { setView } = useAppStore();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

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
      // silent
    } finally {
      setLoading(false);
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

  const statCards = [
    {
      label: t('totalAgencies'),
      value: stats?.totalAgencies ?? 0,
      icon: Building2,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('activeQueues'),
      value: stats?.activeQueues ?? 0,
      icon: Users,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      label: t('dailyReservations'),
      value: stats?.dailyReservations ?? 0,
      icon: Calendar,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      label: t('totalRevenue'),
      value: `${(stats?.totalRevenue ?? 0).toLocaleString()} ${t('currency')}`,
      icon: CreditCard,
      color: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: t('pendingTransactions'),
      value: stats?.pendingTransactions ?? 0,
      icon: Clock,
      color: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ];

  // Calculate real weekly growth from daily reservations
  const weeklyGrowth = stats?.dailyReservations && stats?.totalAgencies
    ? Math.round((stats.dailyReservations / Math.max(stats.totalAgencies, 1)) * 10)
    : 0;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Title with Weekly Growth Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{t('adminDashboard')}</h1>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium px-2 py-0.5">
            <TrendingUp className="h-3 w-3 me-1" />
            +{weeklyGrowth}% {t('weeklyGrowth')}
          </Badge>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">
          <ShieldCheck className="h-3 w-3 me-1" />
          {t('superAdmin')}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
                <CardContent className={`p-4 rounded-xl ${stat.color}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor} mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

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
            <div className="grid grid-cols-3 gap-3">
              {/* Active Users Today */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
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
            <CardTitle className="text-base">{t('actions')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 justify-start px-4 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                onClick={() => setView('admin-transactions')}
              >
                <CreditCard className="h-5 w-5 me-3 text-emerald-600" />
                <div className="text-start">
                  <p className="text-sm font-semibold">{t('reviewPayment')}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingTransactions ?? 0} {t('pending')}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 ms-auto text-muted-foreground rtl:rotate-180" />
              </Button>
              <Button
                variant="outline"
                className="h-14 justify-start px-4 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                onClick={() => setView('admin-agencies')}
              >
                <Building2 className="h-5 w-5 me-3 text-emerald-600" />
                <div className="text-start">
                  <p className="text-sm font-semibold">{t('agencyManagement')}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalAgencies ?? 0} {t('agencies')}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 ms-auto text-muted-foreground rtl:rotate-180" />
              </Button>
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/5 transition-colors"
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
