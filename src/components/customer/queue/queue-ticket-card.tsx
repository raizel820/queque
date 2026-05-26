'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import {
  Users,
  Clock,
  TicketCheck,
  Timer,
  Radio,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAgencyName, getServiceName, padZero, getQueueRingClass, formatDateLocalized } from './queue-utils';
import { RING_RADIUS, RING_CIRCUMFERENCE, COUNTDOWN_RADIUS, COUNTDOWN_CIRCUMFERENCE } from './queue-types';
import type { Reservation } from './queue-types';

interface QueueTicketCardProps {
  reservation: Reservation;
  isCalled: boolean;
  isFastPolling: boolean;
  countdown: { hours: number; minutes: number; seconds: number };
  ringDashOffset: number;
  countdownDashOffset: number;
  countdownProgress: number;
  children?: React.ReactNode;
}

export function QueueTicketCard({
  reservation: res,
  isCalled,
  isFastPolling,
  countdown,
  ringDashOffset,
  countdownDashOffset,
  countdownProgress,
  children,
}: QueueTicketCardProps) {
  const { t, lang } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isCalled ? { opacity: 1, scale: 1, x: [0, -3, 3, -3, 3, 0] } : { opacity: 1, scale: 1 }}
      transition={isCalled ? { duration: 0.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' } : { duration: 0.3 }}
      className="mb-4"
    >
      {/* Ticket-style card with torn edges */}
      <div className="relative">
        {/* Torn edge SVG decorations - top and bottom */}
        <svg className="absolute -top-px inset-x-0 w-full h-3 z-10" viewBox="0 0 400 12" preserveAspectRatio="none">
          <path d="M0,0 L0,12 Q10,6 20,12 Q30,0 40,12 Q50,0 60,12 Q70,0 80,12 Q90,0 100,12 Q110,0 120,12 Q130,0 140,12 Q150,0 160,12 Q170,0 180,12 Q190,0 200,12 Q210,0 220,12 Q230,0 240,12 Q250,0 260,12 Q270,0 280,12 Q290,0 300,12 Q310,0 320,12 Q330,0 340,12 Q350,0 360,12 Q370,0 380,12 Q390,0 400,12 L400,0 Z"
            className="fill-white dark:fill-gray-900"
          />
        </svg>
        <svg className="absolute -bottom-px inset-x-0 w-full h-3 z-10 rotate-180" viewBox="0 0 400 12" preserveAspectRatio="none">
          <path d="M0,0 L0,12 Q10,6 20,12 Q30,0 40,12 Q50,0 60,12 Q70,0 80,12 Q90,0 100,12 Q110,0 120,12 Q130,0 140,12 Q150,0 160,12 Q170,0 180,12 Q190,0 200,12 Q210,0 220,12 Q230,0 240,12 Q250,0 260,12 Q270,0 280,12 Q290,0 300,12 Q310,0 320,12 Q330,0 340,12 Q350,0 360,12 Q370,0 380,12 Q390,0 400,12 L400,0 Z"
            className="fill-white dark:fill-gray-900"
          />
        </svg>

        {/* Left perforation circle */}
        <div className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 z-10 shadow-inner" />
        {/* Right perforation circle */}
        <div className="absolute end-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 z-10 shadow-inner" />

        {/* Gradient border wrapper for called status */}
        <div
          className={`rounded-2xl p-[2px] transition-all duration-500 ${
            isCalled
              ? 'bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'bg-border dark:bg-gray-800'
          }`}
        >
          <Card className="border-0 shadow-none overflow-hidden bg-white dark:bg-gray-900 rounded-xl">
            {/* Status Banner */}
            <div
              className={`px-4 py-2.5 ${
                isCalled
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCalled ? (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Volume2 className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <Clock className="h-5 w-5" />
                )}
                <span className="font-semibold text-sm">
                  {isCalled ? t('statusCalled') : t('statusWaiting')}
                </span>
                <div className="flex items-center gap-1.5 ms-auto flex-shrink-0">
                  {isCalled && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-medium bg-white/20 px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    >
                      <Sparkles className="h-3 w-3 inline me-1" />
                      {t('statusCalled')}!
                    </motion.span>
                  )}
                  {/* Reserved date badge */}
                  {res.reservedDate && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                      📅 {formatDateLocalized(res.reservedDate, lang)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-4 sm:p-5">
              {/* Progress Ring with Queue Number */}
              <QueueProgressRing
                reservation={res}
                isCalled={isCalled}
                ringDashOffset={ringDashOffset}
              />

              {/* Agency & Service */}
              <div className="text-center mb-4 space-y-0.5">
                <p className="text-sm font-medium text-foreground truncate px-2">
                  {getAgencyName(res, lang)}
                </p>
                <p className="text-xs text-muted-foreground truncate px-2">{getServiceName(res, lang)}</p>
                {res.reservedDate && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    📅 {t('reservedFor')} {formatDateLocalized(res.reservedDate, lang)}
                  </p>
                )}
              </div>

              {/* Stats Row - responsive 3 cols */}
              <QueueStatsRow
                reservation={res}
                countdown={countdown}
                countdownDashOffset={countdownDashOffset}
              />

              {/* Countdown Display */}
              {!isCalled && res.estimatedWait > 0 && (
                <QueueCountdownDisplay countdown={countdown} />
              )}

              {/* Position indicator with pulsing animation & progress bar */}
              <QueuePositionIndicator reservation={res} />

              {/* Estimated Wait Time Display with clock icon and gradient background */}
              {!isCalled && res.estimatedWait > 0 && (
                <QueueWaitTimeDisplay
                  reservation={res}
                  countdown={countdown}
                  countdownProgress={countdownProgress}
                />
              )}

              {/* Children slot for action buttons and other sections */}
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

// --- Internal sub-components for the ticket card ---

function QueueProgressRing({
  reservation: res,
  isCalled,
  ringDashOffset,
}: {
  reservation: Reservation;
  isCalled: boolean;
  ringDashOffset: number;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex justify-center mb-4">
      <div className="relative">
        <svg className="h-32 w-32 sm:h-36 sm:w-36" viewBox="0 0 120 120">
          <defs>
            <linearGradient
              id={`ring-grad-${res.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            {isCalled && (
              <filter id={`glow-${res.id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
          </defs>
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
            className="stroke-gray-200 dark:stroke-gray-700"
          />
          {/* Progress arc */}
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            stroke={`url(#ring-grad-${res.id})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            transform="rotate(-90, 60, 60)"
            style={{
              strokeDashoffset: ringDashOffset,
              transition: 'stroke-dashoffset 1s ease-out',
            }}
            filter={isCalled ? `url(#glow-${res.id})` : undefined}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isCalled && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1 -end-1 z-10"
            >
              <div className="h-3 w-3 rounded-full bg-red-500 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </motion.div>
          )}
          <span className={`${getQueueRingClass(res.queueNumber)} text-foreground tracking-tight leading-tight`}>
            {res.queueNumber}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
            {t('yourQueueNumber')}
          </span>
          {/* Live indicator */}
          <div className="flex items-center gap-1 mt-1">
            <Radio className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 uppercase">
              {t('live')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueStatsRow({
  reservation: res,
  countdown,
  countdownDashOffset,
}: {
  reservation: Reservation;
  countdown: { hours: number; minutes: number; seconds: number };
  countdownDashOffset: number;
}) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
      {/* People Ahead */}
      <div className="text-center p-2 sm:p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20">
        <div className="relative inline-block">
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 mx-auto mb-0.5" />
          {res.peopleAhead > 0 && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-teal-500"
            />
          )}
        </div>
        <motion.p
          key={res.peopleAhead}
          initial={{ scale: 1.3, color: '#0d9488' }}
          animate={{ scale: 1, color: '#0f766e' }}
          transition={{ duration: 0.4 }}
          className="text-base sm:text-lg font-bold text-teal-700 dark:text-teal-400"
        >
          {res.peopleAhead}
        </motion.p>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground">{t('peopleAhead')}</p>
      </div>
      {/* Animated circular countdown */}
      <div className="text-center p-2 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex flex-col items-center justify-center">
        <div className="relative h-12 w-12 sm:h-14 sm:w-14">
          <svg className="h-12 w-12 sm:h-14 sm:w-14 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={COUNTDOWN_RADIUS} fill="none" strokeWidth="4" className="stroke-amber-200 dark:stroke-amber-800/50" />
            <motion.circle
              cx="40"
              cy="40"
              r={COUNTDOWN_RADIUS}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              stroke="url(#countdown-grad)"
              strokeDasharray={COUNTDOWN_CIRCUMFERENCE}
              className="text-amber-500"
              animate={{ strokeDashoffset: countdownDashOffset }}
              transition={{ duration: 1, ease: 'linear' }}
            />
            <defs>
              <linearGradient id="countdown-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">~{res.estimatedWait}</span>
            <span className="text-[7px] sm:text-[8px] text-muted-foreground">{t('min')}</span>
          </div>
        </div>
      </div>
      <div className="text-center p-2 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
        <TicketCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-0.5" />
        <p className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400">
          {res.currentServingNumber}
        </p>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground">{t('currentServing')}</p>
      </div>
    </div>
  );
}

function QueueCountdownDisplay({
  countdown,
}: {
  countdown: { hours: number; minutes: number; seconds: number };
}) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <Timer className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{t('estimatedWait') || ''}</span>
      </div>
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <div className="flex flex-col items-center">
          <motion.div
            key={`h-${countdown.hours}`}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-10 w-12 sm:h-12 sm:w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50"
          >
            <span className="text-lg sm:text-xl font-bold tabular-nums text-foreground">
              {padZero(countdown.hours)}
            </span>
          </motion.div>
          <span className="text-[10px] text-muted-foreground mt-1">{t('hours')}</span>
        </div>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-lg font-bold text-muted-foreground mb-4"
        >:</motion.span>
        <div className="flex flex-col items-center">
          <motion.div
            key={`m-${countdown.minutes}`}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-10 w-12 sm:h-12 sm:w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50"
          >
            <span className="text-lg sm:text-xl font-bold tabular-nums text-foreground">
              {padZero(countdown.minutes)}
            </span>
          </motion.div>
          <span className="text-[10px] text-muted-foreground mt-1">{t('minutesLabel')}</span>
        </div>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-lg font-bold text-muted-foreground mb-4"
        >:</motion.span>
        <div className="flex flex-col items-center">
          <motion.div
            key={`s-${countdown.seconds}`}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="h-10 w-12 sm:h-12 sm:w-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50"
          >
            <span className="text-lg sm:text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {padZero(countdown.seconds)}
            </span>
          </motion.div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{t('secondsLabel')}</span>
        </div>
      </div>
    </motion.div>
  );
}

function QueuePositionIndicator({
  reservation: res,
}: {
  reservation: Reservation;
}) {
  const { t } = useLanguage();

  return (
    <div className="mb-4 px-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{t('queuePosition')}</span>
        <div className="flex items-center gap-1.5" aria-live="polite">
          <motion.span
            key={res.position}
            initial={{ scale: 1.4, color: '#059669' }}
            animate={{ scale: 1, color: '#0f172a' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-sm font-bold text-foreground"
          >
            #{res.position}
          </motion.span>
          <span className="text-[10px] text-muted-foreground">/</span>
          <span className="text-[10px] text-muted-foreground">
            {res.peopleAhead + res.position}
          </span>
          {/* Pulsing indicator */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="h-2 w-2 rounded-full bg-emerald-500 pulse-ring"
          />
        </div>
      </div>
      {/* Progress bar showing position in queue */}
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${Math.max(5, Math.min(100, 100 - (res.peopleAhead / Math.max(res.peopleAhead + res.position, 1)) * 100))}%`,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
        />
      </div>
    </div>
  );
}

function QueueWaitTimeDisplay({
  reservation: res,
  countdown,
  countdownProgress,
}: {
  reservation: Reservation;
  countdown: { hours: number; minutes: number; seconds: number };
  countdownProgress: number;
}) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-3.5 rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/15 dark:via-orange-900/10 dark:to-amber-900/15 border border-amber-200/50 dark:border-amber-800/30 relative overflow-hidden"
    >
      {/* Subtle animated background shimmer */}
      <div className="absolute inset-0 shimmer-loading" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t('remainingTime')}</span>
          </div>
          <span className="text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/30 px-2 py-0.5 rounded-lg">
            {countdown.hours > 0
              ? `${padZero(countdown.hours)}:${padZero(countdown.minutes)}:${padZero(countdown.seconds)}`
              : `${padZero(countdown.minutes)}:${padZero(countdown.seconds)}`
            }
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-amber-200/40 dark:bg-amber-900/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
            initial={{ width: '0%' }}
            animate={{
              width: `${countdownProgress}%`,
            }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
        <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1.5 text-center font-medium">
          ~{res.estimatedWait > 60
            ? `${Math.floor(res.estimatedWait / 60)}${t('hours')} ${res.estimatedWait % 60 > 0 ? `${res.estimatedWait % 60}${t('min')}` : ''}`
            : `${res.estimatedWait} ${t('min')}`
          }
        </p>
      </div>
    </motion.div>
  );
}
