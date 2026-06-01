'use client';

import { Users, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TranslationKeys } from '@/i18n';
import type { DashboardStats } from './types';
import { AnimatedCounter, MiniSparkline } from './helpers';

interface TodaysSummaryProps {
  stats: DashboardStats | null;
  safeCompletionRate: number;
  sparkData1: number[];
  sparkData2: number[];
  sparkData3: number[];
  t: (key: TranslationKeys) => string;
}

export function TodaysSummary({ stats, safeCompletionRate, sparkData1, sparkData2, sparkData3, t }: TodaysSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 text-white shadow-lg shadow-emerald-500/15">
          <div className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-emerald-400/30 blur-lg" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1"><div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center"><Users className="h-3 w-3 text-emerald-100" /></div><span className="text-[9px] text-emerald-200 font-medium">{t('totalToday')}</span></div>
              <p className="text-xl sm:text-2xl font-black leading-none"><AnimatedCounter value={stats?.todayReservations ?? 0} /></p>
            </div>
            <MiniSparkline data={sparkData1} color="bg-emerald-300" />
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-3 text-white shadow-lg shadow-amber-500/15">
          <div className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-amber-400/30 blur-lg" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1"><div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center"><Clock className="h-3 w-3 text-amber-100" /></div><span className="text-[9px] text-amber-200 font-medium">{t('queueLengthShort')}</span></div>
              <p className="text-xl sm:text-2xl font-black leading-none"><AnimatedCounter value={stats?.currentlyWaiting ?? 0} /></p>
            </div>
            <MiniSparkline data={sparkData2} color="bg-amber-300" />
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-3 text-white shadow-lg shadow-teal-500/15">
          <div className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-teal-400/30 blur-lg" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1"><div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-teal-100" /></div><span className="text-[9px] text-teal-200 font-medium">{t('customersServed')}</span></div>
              <p className="text-xl sm:text-2xl font-black leading-none"><AnimatedCounter value={stats?.servedToday ?? 0} /></p>
            </div>
            <MiniSparkline data={sparkData3} color="bg-teal-300" />
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-3 text-white shadow-lg shadow-rose-500/15">
          <div className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-rose-400/30 blur-lg" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1"><div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center"><AlertTriangle className="h-3 w-3 text-rose-100" /></div><span className="text-[9px] text-rose-200 font-medium">{t('noShowShort')}</span></div>
              <p className="text-xl sm:text-2xl font-black leading-none"><AnimatedCounter value={stats?.noShowRate ?? 0} /><span className="text-sm font-semibold ms-0.5">%</span></p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-rose-200/60">{t('completionRateStat')}</p>
              <p className="text-sm font-bold">{safeCompletionRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
