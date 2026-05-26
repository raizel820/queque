'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Building2,
  UserCheck,
  Users,
  Wifi,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { AdminStats } from './types';

interface AdminSystemHealthProps {
  stats: AdminStats | null;
  t: (key: string) => string;
}

export function AdminSystemHealth({ stats, t }: AdminSystemHealthProps) {
  return (
    <>
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
          <div className="flex items-center gap-1 ms-2">
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('systemStatusOnline')}</span>
          </div>
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
    </>
  );
}
