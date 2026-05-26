'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { DailyReservationsChart } from './daily-reservations-chart';

interface AdminDailyChartCardProps {
  dailyActivity: number;
  t: (key: string) => string;
}

export function AdminDailyChartCard({ dailyActivity, t }: AdminDailyChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
    >
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              {t('dailyReservations')} — 7 Day Trend
            </CardTitle>
            <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="h-3 w-3 me-1" />
              {dailyActivity} today
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DailyReservationsChart dailyReservations={dailyActivity} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
