'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { isRTL, type Language } from '@/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Monitor, Globe, Clock, Users } from 'lucide-react';

interface KioskLandingProps {
  agency: {
    id: string;
    name: string;
    nameAr?: string | null;
    nameFr?: string | null;
    logoUrl?: string | null;
    workingHoursStart: string;
    workingHoursEnd: string;
    isQueueOpen: boolean;
    isPaused: boolean;
  };
  queueStats: {
    waiting: number;
    currentServing: string | null;
    estimatedWait: number;
  };
  onTakeTicket: () => void;
  onViewBoard: () => void;
  onLanguageChange: (lang: Language) => void;
  currentLang: Language;
}

export function KioskLanding({
  agency,
  queueStats,
  onTakeTicket,
  onViewBoard,
  onLanguageChange,
  currentLang,
}: KioskLandingProps) {
  const { t } = useLanguage();
  const rtl = isRTL(currentLang);

  const getAgencyName = () => {
    if (currentLang === 'ar' && agency.nameAr) return agency.nameAr;
    if (currentLang === 'fr' && agency.nameFr) return agency.nameFr;
    return agency.name;
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'عربي' },
    { code: 'fr', label: 'FR' },
  ];

  // Idle timeout - auto-reset after 30 seconds of no interaction
  const [idleTimer, setIdleTimer] = useState(0);

  const resetIdle = useCallback(() => {
    setIdleTimer(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for any interaction
  useEffect(() => {
    const events = ['touchstart', 'click', 'keydown'] as const;
    const handler = () => resetIdle();
    events.forEach((e) => window.addEventListener(e, handler));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [resetIdle]);

  const isClosed = !agency.isQueueOpen;
  const isPaused = agency.isPaused;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center p-6 select-none"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      {/* Language selector */}
      <div className="absolute top-4 end-4 flex gap-2 z-10">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`min-h-[48px] min-w-[48px] px-4 rounded-xl text-sm font-semibold transition-all ${
              currentLang === lang.code
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white/80 text-gray-600 hover:bg-emerald-50 border border-gray-200'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-lg w-full"
      >
        {/* Logo & Name */}
        <div className="mb-8">
          {agency.logoUrl ? (
            <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-white shadow-md mb-4">
              <img
                src={agency.logoUrl}
                alt={agency.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md mb-4">
              <span className="text-3xl font-bold text-white">
                {agency.name.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900">
            {getAgencyName()}
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            {agency.workingHoursStart} — {agency.workingHoursEnd}
          </p>
        </div>

        {/* Queue Status */}
        <div className="grid grid-cols-3 gap-4 w-full mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <Users className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{queueStats.waiting}</p>
            <p className="text-xs text-gray-500">{t('kioskWaiting')}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <Ticket className="h-6 w-6 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {queueStats.currentServing || '—'}
            </p>
            <p className="text-xs text-gray-500">{t('kioskNowServing')}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {queueStats.estimatedWait}
            </p>
            <p className="text-xs text-gray-500">{t('kioskMinutes')}</p>
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {isClosed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center text-lg font-semibold"
            >
              {t('kioskQueueClosed')}
            </motion.div>
          )}
          {isPaused && !isClosed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-center text-lg font-semibold"
            >
              {t('kioskQueuePaused')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Take Ticket Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTakeTicket}
          disabled={isClosed || isPaused}
          className={`w-full min-h-[80px] rounded-2xl text-xl font-bold shadow-lg transition-all mb-4 flex items-center justify-center gap-3 ${
            isClosed || isPaused
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl'
          }`}
        >
          <Ticket className="h-8 w-8" />
          {t('kioskTakeTicket')}
        </motion.button>

        {/* Queue Board Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewBoard}
          className="w-full min-h-[64px] rounded-2xl text-lg font-semibold bg-white border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all flex items-center justify-center gap-3"
        >
          <Monitor className="h-6 w-6" />
          {t('kioskQueueBoard')}
        </motion.button>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-4 text-gray-400 text-sm">
        BLASTI — {t('kioskTitle')}
      </p>
    </div>
  );
}
