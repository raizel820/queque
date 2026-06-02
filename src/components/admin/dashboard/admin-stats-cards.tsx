'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  Clock,
  UserPlus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { AdminStats } from './types';
import { AnimatedCounter } from './animated-counter';

interface StatCardItem {
  label: string;
  value: number;
  numericValue: number;
  prefix: string;
  suffix: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
  sparkColor: string;
}

interface AdminStatsCardsProps {
  stats: AdminStats | null;
  t: (key: string) => string;
}

export function AdminStatsCards({ stats, t }: AdminStatsCardsProps) {
  // Mini sparkline data (synthetic for visual enhancement)
  const sparklines = [
    [3, 5, 4, 7, 6, 8, 7, 9, 8, 10],
    [2, 4, 3, 5, 6, 4, 7, 5, 8, 6],
    [1, 3, 5, 4, 7, 6, 8, 7, 9, 8],
    [4, 3, 5, 6, 5, 7, 6, 8, 7, 9],
    [2, 1, 3, 2, 4, 3, 2, 3, 1, 2],
    [3, 4, 5, 6, 5, 7, 8, 7, 9, 8],
  ];

  const statCards: StatCardItem[] = [
    {
      label: t('totalAgencies'),
      value: stats?.totalAgencies ?? 0,
      numericValue: stats?.totalAgencies ?? 0,
      prefix: '',
      suffix: '',
      icon: Building2,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      sparkColor: '#10b981',
    },
    {
      label: t('activeQueues'),
      value: stats?.activeQueues ?? 0,
      numericValue: stats?.activeQueues ?? 0,
      prefix: '',
      suffix: '',
      icon: Users,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      sparkColor: '#14b8a6',
    },
    {
      label: t('dailyReservations'),
      value: stats?.dailyReservations ?? 0,
      numericValue: stats?.dailyReservations ?? 0,
      prefix: '',
      suffix: '',
      icon: Calendar,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      sparkColor: '#14b8a6',
    },
    {
      label: t('totalRevenue'),
      value: stats?.totalRevenue ?? 0,
      numericValue: stats?.totalRevenue ?? 0,
      prefix: '',
      suffix: ` ${t('currency')}`,
      icon: CreditCard,
      color: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      sparkColor: '#f59e0b',
    },
    {
      label: t('pendingTransactions'),
      value: stats?.pendingTransactions ?? 0,
      numericValue: stats?.pendingTransactions ?? 0,
      prefix: '',
      suffix: '',
      icon: Clock,
      color: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      sparkColor: '#ef4444',
    },
    {
      label: t('totalUsers'),
      value: stats?.totalUsers ?? 0,
      numericValue: stats?.totalUsers ?? 0,
      prefix: '',
      suffix: '',
      icon: UserPlus,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      sparkColor: '#10b981',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-4">
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
            <div className="rounded-2xl p-[1px] bg-gradient-to-br from-emerald-200/40 via-transparent to-teal-200/40 dark:from-emerald-700/20 dark:via-transparent dark:to-teal-700/20 group">
              <Card className="border-0 shadow-sm hover:shadow-xl hover:shadow-emerald-500/8 transition-all duration-300 hover:-translate-y-1.5 bg-white dark:bg-gray-900/90 rounded-[14px]">
                <CardContent className={`p-4 rounded-t-[14px] ${stat.color}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 ${
                      idx === 0 ? 'from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40'
                      : idx === 1 ? 'from-teal-200 to-teal-300 dark:from-teal-900/40 dark:to-teal-800/40'
                      : idx === 2 ? 'from-teal-200 to-emerald-200 dark:from-teal-900/40 dark:to-emerald-900/40'
                      : idx === 3 ? 'from-amber-200 to-amber-300 dark:from-amber-900/40 dark:to-amber-800/40'
                      : idx === 4 ? 'from-rose-200 to-rose-300 dark:from-rose-900/40 dark:to-rose-800/40'
                      : 'from-emerald-200 to-teal-200 dark:from-emerald-900/40 dark:to-teal-900/40'
                    } flex items-center justify-center shadow-sm`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    {/* Mini Sparkline SVG */}
                    <svg viewBox="0 0 80 28" className="w-16 h-8 opacity-60" fill="none">
                      <polyline points={points} stroke={stat.sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points={`${points} ${80},${28} 0,28`} fill={stat.sparkColor} fillOpacity="0.08" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent number-animate">
                    <AnimatedCounter value={stat.numericValue} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
