'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SlideToConfirm } from '@/components/shared/slide-to-confirm';
import { startNotificationSound, stopNotificationSound, playConfirmSound } from '@/lib/sounds';
import {
  Users,
  Clock,
  TicketCheck,
  Volume2,
  VolumeX,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Timer,
  Radio,
  BellRing,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Reservation {
  id: string;
  queueNumber: string;
  status: string;
  position: number;
  peopleAhead: number;
  estimatedWait: number;
  currentServingNumber: string;
  agencyName: string;
  agencyNameAr?: string;
  agencyNameFr?: string;
  serviceName: string;
  serviceNameAr?: string;
  serviceNameFr?: string;
  joinedAt: string;
  reservedDate?: string;
}

export function CustomerQueue() {
  const { setView, user } = useAppStore();
  const { t, lang } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showTurnAlert, setShowTurnAlert] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [refreshInterval, setRefreshInterval] = useState<number>(10000);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [pulseKey, setPulseKey] = useState(0);
  const prevStatusRef = useRef<Record<string, string>>({});
  const soundStartedRef = useRef(false);

  const fetchReservations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/reservations/active?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.reservations ?? []).map((r: Record<string, unknown>) => {
          const agency = r.agency as Record<string, string> | undefined;
          const service = r.service as Record<string, string> | undefined;
          return {
            id: r.id,
            queueNumber: r.displayNumber || `${r.queueNumber}`,
            status: r.status,
            position: (r.position as number) || 0,
            peopleAhead: (r.peopleAhead as number) || 0,
            estimatedWait: (r.estimatedWait as number) || 0,
            currentServingNumber: (r.currentServingNumber as string) || '0',
            agencyName: agency?.name || 'Agency',
            agencyNameAr: agency?.nameAr,
            agencyNameFr: agency?.nameFr,
            serviceName: service?.name || 'Service',
            serviceNameAr: service?.nameAr,
            serviceNameFr: service?.nameFr,
            joinedAt: r.joinedAt,
            reservedDate: (r.reservedDate as string) || undefined,
          };
        });

        // Detect status changes to CALLED - trigger sound
        list.forEach((r: Reservation) => {
          if (prevStatusRef.current[r.id] && prevStatusRef.current[r.id] !== r.status && r.status === 'CALLED') {
            if (!soundStartedRef.current) {
              soundStartedRef.current = true;
              if (!soundMuted) {
                startNotificationSound();
              }
              setShowTurnAlert(true);
              // Request notification permission on first CALLED status
              if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'default') {
                  Notification.requestPermission();
                }
                if (Notification.permission === 'granted') {
                  new Notification(t('yourTurn') || 'Your Turn!', {
                    body: t('turnNotifBody') || 'Please proceed to the service counter.',
                    icon: '/favicon.ico',
                    tag: 'queuewise-turn',
                    requireInteraction: true,
                  });
                }
              }
            }
          }
        });

        // Update prev status map
        const currentStatuses: Record<string, string> = {};
        list.forEach((r: Reservation) => { currentStatuses[r.id] = r.status; });
        prevStatusRef.current = currentStatuses;

        setReservations(list);
        setLastUpdated(new Date());
        setPulseKey((k) => k + 1);

        // Check if any is CALLED
        const hasCalled = list.some((r: Reservation) => r.status === 'CALLED');
        if (hasCalled && !soundStartedRef.current) {
          soundStartedRef.current = true;
          if (!soundMuted) {
            startNotificationSound();
          }
          setShowTurnAlert(true);
          // Request notification permission on first CALLED status
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
              Notification.requestPermission();
            }
            if (Notification.permission === 'granted') {
              new Notification(t('yourTurn') || 'Your Turn!', {
                body: t('turnNotifBody') || 'Please proceed to the service counter.',
                icon: '/favicon.ico',
                tag: 'queuewise-turn',
                requireInteraction: true,
              });
            }
          }
        }
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, soundMuted]);

  // Countdown timer based on estimated wait
  useEffect(() => {
    const activeRes = reservations.find(
      (r) => r.status === 'WAITING' || r.status === 'CALLED'
    );
    if (!activeRes || activeRes.estimatedWait <= 0) return;

    const totalSeconds = activeRes.estimatedWait * 60;
    const endTime = Date.now() + totalSeconds * 1000;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setCountdown({
        hours: Math.floor(remaining / 3600),
        minutes: Math.floor((remaining % 3600) / 60),
        seconds: remaining % 60,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [reservations]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      stopNotificationSound();
    };
  }, []);

  // Auto-refresh with configurable interval
  useEffect(() => {
    fetchReservations();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchReservations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchReservations, refreshInterval]);

  // Time ago helper
  const getTimeAgo = () => {
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 5) return t('justNow');
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };
  const [timeAgo, setTimeAgo] = useState('');
  useEffect(() => {
    setTimeAgo(getTimeAgo());
    const interval = setInterval(() => setTimeAgo(getTimeAgo()), 5000);
    return () => clearInterval(interval);
  }, [lastUpdated, lang]);

  const handleConfirmTurn = () => {
    stopNotificationSound();
    playConfirmSound();
    setShowTurnAlert(false);
    soundStartedRef.current = false;
    toast.success(t('confirmed'));
  };

  const handleMuteSound = () => {
    setSoundMuted(true);
    stopNotificationSound();
    toast.success(t('notificationSoundOff'));
  };

  const handleUnmuteSound = () => {
    setSoundMuted(false);
    const hasCalled = reservations.some((r) => r.status === 'CALLED');
    if (hasCalled) {
      startNotificationSound();
    }
    toast.success(t('notificationSoundOn'));
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      const res = await fetch(`/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        toast.success(t('cancelReservation'));
        fetchReservations();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setCancelling(null);
    }
  };

  const activeRes = reservations.find(
    (r) => r.status === 'WAITING' || r.status === 'CALLED'
  );

  if (loading) {
    return (
      <div className="px-4 py-4 pb-24">
        <Skeleton className="h-8 w-32 mb-6 skeleton-shimmer" />
        <Skeleton className="h-72 rounded-2xl mb-4 skeleton-shimmer" />
        <Skeleton className="h-40 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  // Empty State
  if (!activeRes && reservations.length === 0) {
    return (
      <div className="px-4 py-4 pb-24 relative">
        {/* Subtle background pattern for empty state */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
        <h1 className="text-2xl font-bold text-foreground mb-1 relative">{t('myQueue')}</h1>
        <div className="flex flex-col items-center justify-center py-20 relative">
          <div className="relative mb-6">
            {/* Pulsing background ring */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.05, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-28 w-28 rounded-full bg-emerald-200 dark:bg-emerald-800"
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="relative h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            >
              <TicketCheck className="h-10 w-10 text-emerald-500" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="h-14 w-14 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center absolute -top-3 end-2"
            >
              <Clock className="h-7 w-7 text-teal-500" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
              className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center absolute bottom-0 start-6"
            >
              <Users className="h-6 w-6 text-amber-500" />
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t('noActiveReservations')}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              {t('welcomeSubtitle')}
            </p>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-6 rounded-xl h-11 shadow-lg shadow-emerald-500/20"
              onClick={() => setView('customer-home')}
            >
              {t('joinQueue')}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const getAgencyName = (r: Reservation) => {
    if (lang === 'ar' && r.agencyNameAr) return r.agencyNameAr;
    if (lang === 'fr' && r.agencyNameFr) return r.agencyNameFr;
    return r.agencyName;
  };

  const getServiceName = (r: Reservation) => {
    if (lang === 'ar' && r.serviceNameAr) return r.serviceNameAr;
    if (lang === 'fr' && r.serviceNameFr) return r.serviceNameFr;
    return r.serviceName;
  };

  const padZero = (n: number) => String(n).padStart(2, '0');

  // Progress ring helpers
  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <div className="px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">{t('myQueue')}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReservations}
          className="h-9 px-3 rounded-lg gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-xs font-medium">{t('refresh')}</span>
        </Button>
      </div>
      {/* Refresh interval selector + last updated */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[11px] text-muted-foreground">
          {t('updatedAgo')}: <span className="font-medium text-foreground">{timeAgo}</span>
        </span>
        <motion.div
          key={pulseKey}
          initial={{ opacity: [0.3, 1] }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-1.5"
        >
          <span className="text-[11px] text-muted-foreground">{t('refreshEvery')}:</span>
          <Select value={String(refreshInterval)} onValueChange={(v) => setRefreshInterval(Number(v))}>
            <SelectTrigger className="h-7 w-auto px-2 py-0 text-[11px] rounded-lg border-border">
              <SelectValue />
              <ChevronDown className="h-3 w-3 ms-1 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5000">{t('seconds5')}</SelectItem>
              <SelectItem value="10000">{t('seconds10')}</SelectItem>
              <SelectItem value="30000">{t('seconds30')}</SelectItem>
              <SelectItem value="0">{t('off')}</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {/* YOUR TURN! Alert Banner — Prominent with Slide to Confirm */}
      <AnimatePresence>
        {showTurnAlert && activeRes?.status === 'CALLED' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mb-4"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-5 text-white shadow-2xl shadow-emerald-500/40">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
                  }}
                />
              </div>
              {/* Animated glow border with scale pulse */}
              <motion.div
                animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.01, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl ring-2 ring-white/40"
              />
              {/* Dramatic outer glow */}
              <motion.div
                animate={{ opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 blur-lg"
              />

              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex-shrink-0 h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-emerald-900/20"
                  >
                    <BellRing className="h-8 w-8 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-100">{t('yourTurnAlert')}</p>
                    <motion.p
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-4xl font-black tracking-tight drop-shadow-lg"
                    >
                      {activeRes.queueNumber}
                    </motion.p>
                    <p className="text-sm text-emerald-100 truncate">
                      {getAgencyName(activeRes)}
                    </p>
                  </div>
                  {/* Sound toggle */}
                  <button
                    onClick={soundMuted ? handleUnmuteSound : handleMuteSound}
                    className="flex-shrink-0 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    title={soundMuted ? t('notificationSoundOn') : t('notificationSoundOff')}
                  >
                    {soundMuted ? (
                      <VolumeX className="h-5 w-5 text-white/70" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-white" />
                    )}
                  </button>
                </div>

                {/* Slide to Confirm */}
                <SlideToConfirm onConfirm={handleConfirmTurn} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Reservation Cards */}
      {reservations.map((res) => {
        const isCalled = res.status === 'CALLED';

        // Progress ring calculation
        const ringProgress =
          res.peopleAhead <= 0
            ? 100
            : Math.max(5, Math.min(95, 100 - (res.peopleAhead / 20) * 100));
        const ringDashOffset = ringCircumference - (ringProgress / 100) * ringCircumference;

        return (
          <motion.div
            key={res.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
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
                    {isCalled && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ms-auto text-xs font-medium bg-white/20 px-2.5 py-0.5 rounded-full"
                      >
                        ⚡ {t('statusCalled')}!
                      </motion.span>
                    )}
                    {/* Reserved date badge */}
                    {res.reservedDate && (
                      <span className="ms-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        📅 {new Date(res.reservedDate + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                <CardContent className="p-5">
                  {/* Progress Ring with Queue Number */}
                  <div className="flex justify-center mb-5">
                    <div className="relative">
                      <svg className="h-32 w-32" viewBox="0 0 120 120">
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
                          r={ringRadius}
                          fill="none"
                          strokeWidth="8"
                          className="stroke-gray-200 dark:stroke-gray-700"
                        />
                        {/* Progress arc */}
                        <circle
                          cx="60"
                          cy="60"
                          r={ringRadius}
                          fill="none"
                          stroke={`url(#ring-grad-${res.id})`}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
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
                        <span className="text-3xl font-black text-foreground tracking-tight">
                          {res.queueNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
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

                  {/* Agency & Service */}
                  <div className="text-center mb-5 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {getAgencyName(res)}
                    </p>
                    <p className="text-xs text-muted-foreground">{getServiceName(res)}</p>
                    {res.reservedDate && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        📅 {t('reservedFor')} {new Date(res.reservedDate + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {/* People Ahead */}
                    <div className="text-center p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20">
                      <div className="relative inline-block">
                        <Users className="h-4 w-4 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
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
                        className="text-lg font-bold text-teal-700 dark:text-teal-400"
                      >
                        {res.peopleAhead}
                      </motion.p>
                      <p className="text-[10px] text-muted-foreground">{t('peopleAhead')}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                        ~{res.estimatedWait}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t('min')}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                      <TicketCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                        {res.currentServingNumber}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t('currentlyServing')}</p>
                    </div>
                  </div>

                  {/* Countdown Display */}
                  {!isCalled && res.estimatedWait > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{t('estimatedWait') || ''}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <motion.div
                            key={`h-${countdown.hours}`}
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="h-12 w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50"
                          >
                            <span className="text-xl font-bold tabular-nums text-foreground">
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
                            className="h-12 w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50"
                          >
                            <span className="text-xl font-bold tabular-nums text-foreground">
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
                            className="h-12 w-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50"
                          >
                            <span className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                              {padZero(countdown.seconds)}
                            </span>
                          </motion.div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{t('secondsLabel')}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Position indicator */}
                  <div className="flex items-center justify-between mb-5 px-1">
                    <span className="text-xs text-muted-foreground">{t('queuePosition')}</span>
                    <div className="flex items-center gap-1.5">
                      <div aria-live="polite">
                      <span className="text-xs font-medium text-foreground">#{res.position}</span>
                      <span className="text-[10px] text-muted-foreground">/</span>
                      <span className="text-[10px] text-muted-foreground">
                        {res.peopleAhead + res.position}
                      </span>
                    </div>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  {res.status === 'WAITING' && (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-300"
                      onClick={() => handleCancel(res.id)}
                      disabled={cancelling === res.id}
                    >
                      {cancelling === res.id ? (
                        <Loader2 className="h-4 w-4 animate-spin me-2" />
                      ) : (
                        <XCircle className="h-4 w-4 me-2" />
                      )}
                      {t('cancelReservation')}
                    </Button>
                  )}

                  {/* CALLED — prominent info */}
                  {isCalled && (
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {t('statusCalled')} — {getAgencyName(res)}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
