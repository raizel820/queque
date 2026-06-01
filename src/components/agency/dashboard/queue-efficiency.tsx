'use client';

import { CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TranslationKeys } from '@/i18n';
import { AnimatedCounter } from './helpers';

interface QueueEfficiencyProps {
  completionRate: number;
  servedToday: number;
  currentlyWaiting: number;
  avgWaitTime: number;
  t: (key: TranslationKeys) => string;
}

export function QueueEfficiency({ completionRate, servedToday, currentlyWaiting, avgWaitTime, t }: QueueEfficiencyProps) {
  const safeRate = isNaN(completionRate) ? 0 : Math.min(Math.max(completionRate, 0), 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (safeRate / 100) * circumference;

  const ringColor = safeRate >= 80 ? 'text-emerald-500' : safeRate >= 50 ? 'text-amber-500' : 'text-rose-500';
  const ringStroke = safeRate >= 80 ? '#10b981' : safeRate >= 50 ? '#f59e0b' : '#f43f5e';
  const bgColor = safeRate >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20' : safeRate >= 50 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-rose-50 dark:bg-rose-900/20';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />{t('queueEfficiency') || 'Queue Efficiency'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-6">
            {/* Circular Progress Ring */}
            <div className="relative flex-shrink-0">
              <svg width="110" height="110" viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-100 dark:text-gray-800"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={ringStroke}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={Math.round(safeRate)}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-2xl font-black ${ringColor}`}
                >
                  <AnimatedCounter value={Math.round(safeRate)} />
                </motion.span>
                <span className="text-[9px] text-muted-foreground font-medium">%</span>
              </div>
            </div>

            {/* Stats alongside the ring */}
            <div className="flex-1 space-y-3">
              <div className={`flex items-center gap-2.5 p-2 rounded-xl ${bgColor}`}>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground">{t('servedToday')}</p>
                  <p className="text-sm font-bold text-foreground">
                    <AnimatedCounter value={servedToday} />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-teal-50 dark:bg-teal-900/20">
                <Users className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground">{t('queueLengthShort')}</p>
                  <p className="text-sm font-bold text-foreground">
                    <AnimatedCounter value={currentlyWaiting} />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency label */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t('completionRateStat')}</p>
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${safeRate >= 80 ? 'bg-emerald-500' : safeRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
              <span className={`text-xs font-semibold ${ringColor}`}>
                {safeRate >= 80 ? (t('good') || 'Excellent') : safeRate >= 50 ? t('good') : (t('noData') || 'Needs Attention')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
