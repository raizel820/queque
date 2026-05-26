'use client';

import { motion } from 'framer-motion';
import { TicketCheck } from 'lucide-react';
import type { TranslationKeys } from '@/i18n';
import { getTimeGreeting, getGreetingMessage } from './home-types';

interface HomeHeroProps {
  firstName: string;
  openAgencyCount: number;
  totalWaitingCount: number;
  activeReservations: { agencyName: string; position: number; agencyId: string }[];
  onScrollToSearch: () => void;
  t: (key: TranslationKeys) => string;
  lang: string;
}

export function HomeHero({
  firstName,
  openAgencyCount,
  totalWaitingCount,
  activeReservations,
  onScrollToSearch,
  t,
  lang,
}: HomeHeroProps) {
  if (!firstName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mb-4 parallax-container"
    >
      <button
        type="button"
        onClick={onScrollToSearch}
        className="w-full text-start rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-5 py-4 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
      >
        {/* Subtle parallax background pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '20px 20px',
        }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-lg font-bold text-white">
              {getTimeGreeting(t)}, {firstName}! 👋
            </p>
            <div className="flex items-center gap-2">
              {openAgencyCount > 0 && (
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {openAgencyCount} {t('agenciesNearbyStat')}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-emerald-100">{getGreetingMessage(lang)}</p>
          {/* Mini queue status */}
          {activeReservations.length > 0 && (
            <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <TicketCheck className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {activeReservations[0].agencyName}
                </p>
                <p className="text-[10px] text-emerald-100">
                  #{activeReservations[0].position} · {totalWaitingCount} {t('waitingInQueueStat')}
                </p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="h-2 w-2 rounded-full bg-emerald-300 pulse-ring"
              />
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}
