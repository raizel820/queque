'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Clock,
  TicketCheck,
  Volume2,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Timer,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
}

export function CustomerQueue() {
  const { setView, user } = useAppStore();
  const { t, lang } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showTurnAlert, setShowTurnAlert] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [prevStatus, setPrevStatus] = useState<Record<string, string>>({});

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
          };
        });

        // Detect status changes
        const currentStatuses: Record<string, string> = {};
        list.forEach((r: Reservation) => { currentStatuses[r.id] = r.status; });
        setPrevStatus((prev) => {
          const next = { ...prev };
          list.forEach((r: Reservation) => {
            if (prev[r.id] && prev[r.id] !== r.status && r.status === 'CALLED') {
              // Status changed to CALLED - will trigger shake
            }
          });
          return next;
        });

        setReservations(list);

        // Check if any is CALLED and show alert
        const hasCalled = list.some((r: Reservation) => r.status === 'CALLED');
        if (hasCalled) {
          setShowTurnAlert(true);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(fetchReservations, 5000);
    return () => clearInterval(interval);
  }, [fetchReservations]);

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

  // Empty State - improved with multiple overlapping icons
  if (!activeRes && reservations.length === 0) {
    return (
      <div className="px-4 py-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('myQueue')}</h1>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center absolute top-0 start-0"
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

  return (
    <div className="px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-foreground">{t('myQueue')}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchReservations}
          className="h-10 w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* YOUR TURN! Alert Banner */}
      <AnimatePresence>
        {showTurnAlert && activeRes?.status === 'CALLED' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-4"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-5 text-white shadow-2xl shadow-emerald-500/30">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
                  }}
                />
              </div>

              <div className="relative flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex-shrink-0 h-14 w-14 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <Volume2 className="h-7 w-7 text-white" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-100">{t('yourTurnAlert')}</p>
                  <p className="text-2xl font-extrabold tracking-tight">
                    {activeRes.queueNumber}
                  </p>
                  <p className="text-sm text-emerald-100 truncate">
                    {getAgencyName(activeRes)}
                  </p>
                </div>
                <button
                  onClick={() => setShowTurnAlert(false)}
                  className="flex-shrink-0 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Reservation */}
      {reservations.map((res) => {
        const isCalled = res.status === 'CALLED';
        const progressValue =
          res.peopleAhead <= 0
            ? 100
            : Math.max(5, Math.min(95, 100 - (res.peopleAhead / 20) * 100));

        return (
          <motion.div
            key={res.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`mb-4 border-0 shadow-lg overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 ${
                isCalled
                  ? 'animate-[pulse-glow_2s_ease-in-out_infinite]'
                  : ''
              }`}
            >
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
                </div>
              </div>

              <CardContent className="p-5">
                {/* Large Queue Number with Shake Animation + Pulsing Live Dot */}
                <div className="text-center mb-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    {t('yourQueueNumber')}
                  </p>
                  <div className="inline-flex items-center justify-center relative">
                    {/* Pulsing live dot */}
                    <motion.div
                      className="absolute -top-1 -end-1 z-10"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div className="h-3 w-3 rounded-full bg-red-500 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    </motion.div>
                    <motion.div
                      animate={
                        isCalled
                          ? {
                              x: [0, -3, 3, -3, 3, 0],
                              boxShadow: [
                                '0 0 0 0 rgba(16, 185, 129, 0.3)',
                                '0 0 0 20px rgba(16, 185, 129, 0)',
                                '0 0 0 0 rgba(16, 185, 129, 0)',
                              ],
                            }
                          : {}
                      }
                      transition={
                        isCalled
                          ? { duration: 0.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }
                          : {}
                      }
                      className="inline-flex items-center justify-center h-28 w-28 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 ring-4 ring-emerald-200 dark:ring-emerald-800"
                    >
                      <span className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                        {res.queueNumber}
                      </span>
                    </motion.div>
                  </div>
                  {/* Live indicator label */}
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Radio className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {t('live')}
                    </span>
                  </div>
                </div>

                {/* Agency & Service */}
                <div className="text-center mb-5 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {getAgencyName(res)}
                  </p>
                  <p className="text-xs text-muted-foreground">{getServiceName(res)}</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20">
                    <Users className="h-4 w-4 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-teal-700 dark:text-teal-400">
                      {res.peopleAhead}
                    </p>
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
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-xl font-bold tabular-nums text-foreground">
                            {padZero(countdown.hours)}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">{t('hours')}</span>
                      </div>
                      <span className="text-lg font-bold text-muted-foreground mb-4">:</span>
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-xl font-bold tabular-nums text-foreground">
                            {padZero(countdown.minutes)}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">{t('minutesLabel')}</span>
                      </div>
                      <span className="text-lg font-bold text-muted-foreground mb-4">:</span>
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-xl font-bold tabular-nums text-foreground">
                            {padZero(countdown.seconds)}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">{t('secondsLabel')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Progress Bar - Emerald to Teal gradient */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{t('queuePosition')}</span>
                    <span className="text-xs font-medium text-foreground">
                      #{res.position}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressValue}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
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

                {/* CALLED - prominent button */}
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
          </motion.div>
        );
      })}

      {/* Keyframes */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2);
          }
          50% {
            box-shadow: 0 0 20px 4px rgba(16, 185, 129, 0.15);
          }
        }
      `}</style>
    </div>
  );
}
