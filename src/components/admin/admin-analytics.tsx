'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  CalendarDays,
  Clock,
  TrendingUp,
  TrendingDown,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickStats {
  totalReservations: number;
  avgWaitTime: number;
  busiestDay: string;
  peakHour: string;
}

interface AnalyticsData {
  quickStats: QuickStats;
  registrationsTrend: { date: string; count: number }[];
  topAgencies: {
    agencyId: string;
    name: string;
    nameAr?: string;
    nameFr?: string;
    category: string;
    reservationCount: number;
  }[];
  peakHours: { hour: number; count: number }[];
  customerGrowth?: { date: string; total: number }[];
}

export function AdminAnalytics() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const getAgencyName = (a: { name: string; nameAr?: string; nameFr?: string }) => {
    if (lang === 'ar' && a.nameAr) return a.nameAr;
    if (lang === 'fr' && a.nameFr) return a.nameFr;
    return a.name;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // Ensure we always have 14 days
  const allRegistrations = data?.registrationsTrend ?? [];
  const last14Days = allRegistrations.slice(-14);

  // Pad with empty days if needed
  const now = new Date();
  const paddedLast14Days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    const found = last14Days.find((r) => r.date === key);
    paddedLast14Days.push({ date: key, count: found?.count ?? 0 });
  }

  const maxRegistrations = Math.max(...paddedLast14Days.map((d) => d.count), 1);

  // Ensure all 24 hours are present
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const peakHoursData = data?.peakHours ?? [];
  const fullPeakHours = allHours.map((hour) => {
    const found = peakHoursData.find((h) => h.hour === hour);
    return { hour, count: found?.count ?? 0 };
  });
  const maxPeakHour = Math.max(...fullPeakHours.map((h) => h.count), 1);

  // Weekly summary: compare this week (last 7 days) vs last week (7-14 days ago)
  const thisWeekTotal = paddedLast14Days.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const lastWeekTotal = paddedLast14Days.slice(0, 7).reduce((sum, d) => sum + d.count, 0);
  const weeklyChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;
  const weeklyChangePositive = weeklyChange >= 0;

  // Medal emojis for top 3 agencies
  const medalEmojis = ['🥇', '🥈', '🥉'];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 lg:p-6">
        <h1 className="text-2xl font-bold text-foreground mb-5">{t('analytics')}</h1>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('noAnalyticsData')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <h1 className="text-2xl font-bold text-foreground">{t('analytics')}</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Activity, label: t('totalReservationsAll'), value: data.quickStats.totalReservations, color: 'emerald' },
          { icon: Clock, label: t('avgWaitTimeStat'), value: `${data.quickStats.avgWaitTime} ${t('min')}`, color: 'teal' },
          { icon: CalendarDays, label: t('busiestDay'), value: data.quickStats.busiestDay, color: 'amber' },
          { icon: TrendingUp, label: t('peakHour'), value: data.quickStats.peakHour, color: 'rose' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          const colors: Record<string, string> = {
            emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
            teal: 'from-teal-500 to-teal-600 shadow-teal-500/20',
            amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
            rose: 'from-rose-500 to-rose-600 shadow-rose-500/20',
          };
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
                <CardContent className="p-4">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colors[stat.color]} flex items-center justify-center mb-3 shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              {t('weeklySummary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              {/* This Week */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                <p className="text-xs text-muted-foreground mb-1">{t('thisWeek')}</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{thisWeekTotal}</p>
                <p className="text-xs text-muted-foreground">{t('registrations')}</p>
              </div>
              {/* Last Week */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <p className="text-xs text-muted-foreground mb-1">{t('lastWeek')}</p>
                <p className="text-2xl font-bold text-foreground">{lastWeekTotal}</p>
                <p className="text-xs text-muted-foreground">{t('registrations')}</p>
              </div>
            </div>
            {/* Change indicator */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {weeklyChangePositive ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-semibold ${weeklyChangePositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {weeklyChangePositive ? '+' : ''}{weeklyChange.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">{t('weeklyGrowth')}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Registrations Trend */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              {t('registrationsTrend')}
              <span className="text-xs text-muted-foreground font-normal">({t('last14Days')})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-48">
              {paddedLast14Days.map((d, i) => {
                const height = maxRegistrations > 0 ? (d.count / maxRegistrations) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    <div className="text-[10px] text-muted-foreground mb-1 font-medium">
                      {d.count > 0 ? d.count : ''}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 2)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                      className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-700 dark:to-emerald-500 min-h-[2px]"
                    />
                    <div className="text-[9px] text-muted-foreground mt-1.5">
                      {formatDate(d.date)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Agencies */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                {t('topAgencies')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topAgencies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('noData')}</p>
              ) : (
                <div className="space-y-3">
                  {data.topAgencies.map((agency, idx) => {
                    const maxCount = data.topAgencies[0]?.reservationCount || 1;
                    const barWidth = (agency.reservationCount / maxCount) * 100;
                    return (
                      <motion.div
                        key={agency.agencyId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base flex-shrink-0">
                              {idx < 3 ? medalEmojis[idx] : (
                                <span className="text-xs font-bold text-muted-foreground w-5 inline-block text-center">{idx + 1}</span>
                              )}
                            </span>
                            <span className="font-medium text-foreground truncate">
                              {getAgencyName(agency)}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                            {agency.reservationCount} {t('reservations')}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              idx === 0
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : idx === 1
                                ? 'bg-gradient-to-r from-teal-400 to-teal-500'
                                : idx === 2
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500'
                            }`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Peak Hours */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                {t('peakHours')}
                <span className="text-xs text-muted-foreground font-normal">({t('hourly')})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-[3px] h-48">
                {fullPeakHours.map((h, i) => {
                  const height = maxPeakHour > 0 ? (h.count / maxPeakHour) * 100 : 0;
                  const isCurrentHour = new Date().getHours() === h.hour;
                  return (
                    <div
                      key={h.hour}
                      className="flex-1 flex flex-col items-center justify-end h-full"
                    >
                      <div className="text-[9px] text-muted-foreground mb-1">
                        {h.count > 0 ? h.count : ''}
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 1)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.02, ease: 'easeOut' }}
                        className={`w-full rounded-t-sm min-h-[1px] ${
                          isCurrentHour
                            ? 'bg-gradient-to-t from-emerald-700 to-emerald-400 dark:from-emerald-600 dark:to-emerald-300 ring-1 ring-emerald-400/50'
                            : 'bg-gradient-to-t from-teal-600/60 to-teal-400/60 dark:from-teal-700/60 dark:to-teal-500/60'
                        }`}
                      />
                      <div className={`text-[8px] mt-1 ${isCurrentHour ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                        {String(h.hour).padStart(2, '0')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
