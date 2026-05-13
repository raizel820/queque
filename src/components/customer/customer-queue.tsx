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
  Share2,
  Sparkles,
  QrCode,
  ShieldAlert,
  Star,
  Search,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  rating?: number | null;
  skippedForNoShow?: boolean;
}

// Confetti particle component
function ConfettiParticles({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random(),
    size: 4 + Math.random() * 6,
    color: ['#10b981', '#14b8a6', '#f59e0b', '#f43f5e', '#06b6d4', '#a78bfa'][Math.floor(Math.random() * 6)],
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -10, x: `${p.x}%`, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            y: '120%',
            x: `${p.x + (Math.random() * 30 - 15)}%`,
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.5],
            rotate: [0, p.rotation * 2, p.rotation * 4],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          className="absolute top-0 rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
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
  const [confettiKey, setConfettiKey] = useState(0);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrReservation, setQrReservation] = useState<Reservation | null>(null);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [emergencyResId, setEmergencyResId] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState<Record<string, number>>({});
  const [submittingRating, setSubmittingRating] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState<Record<string, string>>({});
  const [feedbackSubmittedIds, setFeedbackSubmittedIds] = useState<Set<string>>(new Set());
  const [hoveredStar, setHoveredStar] = useState<Record<string, number>>({});
  const prevStatusRef = useRef<Record<string, string>>({});
  const soundStartedRef = useRef(false);
  const turnAlertRef = useRef<HTMLDivElement>(null);
  const [isFastPolling, setIsFastPolling] = useState(false);

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
            rating: (r.rating as number) ?? null,
            skippedForNoShow: (r.skippedForNoShow as boolean) || false,
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
              setConfettiKey((k) => k + 1);
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
          setConfettiKey((k) => k + 1);
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
  }, [user?.id, soundMuted, t]);

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

  // Load feedback submitted IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('queuewise_feedback_submitted');
      if (stored) {
        setFeedbackSubmittedIds(new Set(JSON.parse(stored)));
      }
    } catch { /* ignore */ }
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      stopNotificationSound();
    };
  }, []);

  // Smart polling: dynamically adjust interval based on position
  useEffect(() => {
    const waitingRes = reservations.find((r) => r.status === 'WAITING');
    if (waitingRes && waitingRes.peopleAhead <= 3 && waitingRes.peopleAhead > 0 && refreshInterval > 0) {
      // Position is close — use fast polling (3s)
      setIsFastPolling(true);
    } else {
      setIsFastPolling(false);
    }
  }, [reservations, refreshInterval]);

  // Auto-refresh with smart polling override
  useEffect(() => {
    fetchReservations();
    const effectiveInterval = isFastPolling ? 3000 : refreshInterval;
    if (effectiveInterval > 0) {
      const interval = setInterval(fetchReservations, effectiveInterval);
      return () => clearInterval(interval);
    }
  }, [fetchReservations, refreshInterval, isFastPolling]);

  // Auto-scroll to turn alert banner when it appears
  useEffect(() => {
    if (showTurnAlert && turnAlertRef.current) {
      turnAlertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showTurnAlert]);

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

  const handleLeaveQueue = async () => {
    setCancelling('leaving');
    try {
      const res = await fetch(`/api/reservations/cancel-active?userId=${user?.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(t('queueLeft'));
        setLeaveDialogOpen(false);
        stopNotificationSound();
        soundStartedRef.current = false;
        setView('customer-home');
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

  const handleReclaim = async (id: string) => {
    setCancelling(id);
    try {
      const res = await fetch('/api/reservations/reclaim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id }),
      });
      if (res.ok) {
        toast.success(t('reclaimSuccess'));
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

  const handleSubmitRating = async (resId: string, rating: number) => {
    setSubmittingRating(resId);
    try {
      const comment = feedbackComment[resId]?.trim() || '';
      const res = await fetch(`/api/reservations/${resId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, notes: comment }),
      });
      if (res.ok) {
        setUserRating((prev) => ({ ...prev, [resId]: rating }));
        // Persist to localStorage so we don't show again
        setFeedbackSubmittedIds((prev) => {
          const next = new Set(prev);
          next.add(resId);
          try { localStorage.setItem('queuewise_feedback_submitted', JSON.stringify([...next])); } catch { /* ignore */ }
          return next;
        });
        toast.success(t('feedbackSubmitted'));
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setSubmittingRating(null);
    }
  };

  const handleSharePosition = (res: Reservation) => {
    const agencyName = lang === 'ar' && res.agencyNameAr ? res.agencyNameAr : lang === 'fr' && res.agencyNameFr ? res.agencyNameFr : res.agencyName;
    const serviceName = lang === 'ar' && res.serviceNameAr ? res.serviceNameAr : lang === 'fr' && res.serviceNameFr ? res.serviceNameFr : res.serviceName;
    const shareText = t('queueShareText')
      .replace('{position}', String(res.position))
      .replace('{agency}', agencyName)
      .replace('{service}', serviceName)
      .replace('{number}', res.queueNumber);
    if (navigator.share) {
      navigator.share({ title: 'QueueWise', text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success(t('copied') || 'Copied to clipboard');
      }).catch(() => {
        toast.error(t('error'));
      });
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
        <h1 className="text-2xl font-bold mb-1 relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">{t('myQueue')}</h1>
        <div className="flex flex-col items-center justify-center py-16 relative">
          <div className="relative mb-8">
            {/* Pulsing background ring */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.05, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-emerald-200 dark:bg-emerald-800"
            />
            {/* Decorative dashed circle */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-28 w-28 rounded-full border-2 border-dashed border-emerald-200/60 dark:border-emerald-700/40"
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
            className="text-center max-w-xs"
          >
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t('noActiveReservations')}
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              {t('welcomeSubtitle')}
            </p>
            <p className="text-xs text-muted-foreground/70 mb-6">
              {t('joinQueueHint') || 'Find an agency nearby and join their queue to save time'}
            </p>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-6 rounded-xl h-11 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300"
              onClick={() => setView('customer-home')}
            >
              <Search className="h-4 w-4 me-2" />
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

  // Circular countdown helpers
  const countdownRadius = 36;
  const countdownCircumference = 2 * Math.PI * countdownRadius;

  return (
    <div className="px-4 py-4 pb-24">
      {/* Wave/pulse background when waiting */}
      {activeRes && activeRes.status === 'WAITING' && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.03, 0.01, 0.03],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-400 dark:bg-emerald-600"
          />
          <motion.div
            animate={{
              scale: [1.2, 1.8, 1.2],
              opacity: [0.02, 0.005, 0.02],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 start-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-teal-400 dark:bg-teal-600"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">{t('myQueue')}</h1>
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

      {/* Fast Polling Pulse Indicator */}
      <AnimatePresence>
        {isFastPolling && activeRes?.status === 'WAITING' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30"
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="h-2.5 w-2.5 rounded-full bg-amber-500"
            />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {t('smartPollingActive')}
            </span>
            <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
              · {t('smartPollingDesc')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YOUR TURN! Alert Banner — Prominent with Slide to Confirm */}
      <AnimatePresence>
        {showTurnAlert && activeRes?.status === 'CALLED' && (
          <motion.div
            ref={turnAlertRef}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mb-4"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-4 sm:p-5 text-white shadow-2xl shadow-emerald-500/40">
              {/* Confetti on CALLED */}
              <ConfettiParticles key={confettiKey} active={true} />
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
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex-shrink-0 h-10 w-10 sm:h-16 sm:w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-emerald-900/20"
                  >
                    <BellRing className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-emerald-100">{t('yourTurnAlert')}</p>
                    <motion.p
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-xl sm:text-4xl font-black tracking-tight drop-shadow-lg"
                    >
                      {activeRes.queueNumber}
                    </motion.p>
                    <p className="text-xs text-emerald-100 truncate">
                      {getAgencyName(activeRes)}
                    </p>
                  </div>
                  {/* Sound toggle */}
                  <button
                    onClick={soundMuted ? handleUnmuteSound : handleMuteSound}
                    className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    title={soundMuted ? t('notificationSoundOn') : t('notificationSoundOff')}
                  >
                    {soundMuted ? (
                      <VolumeX className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white/70" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
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

        // Circular countdown calculation
        const totalSec = countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
        const maxSec = res.estimatedWait * 60 || 1;
        const countdownProgress = Math.max(0, (totalSec / maxSec) * 100);
        const countdownDashOffset = countdownCircumference - (countdownProgress / 100) * countdownCircumference;

        return (
          <motion.div
            key={res.id}
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
                  className={isCalled ? 'fill-white dark:fill-gray-900' : 'fill-white dark:fill-gray-900'}
                />
              </svg>
              <svg className="absolute -bottom-px inset-x-0 w-full h-3 z-10 rotate-180" viewBox="0 0 400 12" preserveAspectRatio="none">
                <path d="M0,0 L0,12 Q10,6 20,12 Q30,0 40,12 Q50,0 60,12 Q70,0 80,12 Q90,0 100,12 Q110,0 120,12 Q130,0 140,12 Q150,0 160,12 Q170,0 180,12 Q190,0 200,12 Q210,0 220,12 Q230,0 240,12 Q250,0 260,12 Q270,0 280,12 Q290,0 300,12 Q310,0 320,12 Q330,0 340,12 Q350,0 360,12 Q370,0 380,12 Q390,0 400,12 L400,0 Z"
                  className={isCalled ? 'fill-white dark:fill-gray-900' : 'fill-white dark:fill-gray-900'}
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
                            📅 {new Date(res.reservedDate + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4 sm:p-5">
                    {/* Progress Ring with Queue Number */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <svg className="h-28 w-28 sm:h-32 sm:w-32" viewBox="0 0 120 120">
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
                    <div className="text-center mb-4 space-y-0.5">
                      <p className="text-sm font-medium text-foreground truncate px-2">
                        {getAgencyName(res)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate px-2">{getServiceName(res)}</p>
                      {res.reservedDate && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          📅 {t('reservedFor')} {new Date(res.reservedDate + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>

                    {/* Stats Row - responsive 3 cols */}
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
                            <circle cx="40" cy="40" r={countdownRadius} fill="none" strokeWidth="4" className="stroke-amber-200 dark:stroke-amber-800/50" />
                            <motion.circle
                              cx="40"
                              cy="40"
                              r={countdownRadius}
                              fill="none"
                              strokeWidth="4"
                              strokeLinecap="round"
                              stroke="url(#countdown-grad)"
                              strokeDasharray={countdownCircumference}
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
                    )}

                    {/* Position indicator */}
                    <div className="flex items-center justify-between mb-4 px-1">
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

                    {/* Wait Time Prediction with Progress Bar */}
                    {!isCalled && res.estimatedWait > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-800/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{t('remainingTime')}</span>
                          </div>
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            {countdown.hours > 0
                              ? `${padZero(countdown.hours)}:${padZero(countdown.minutes)}:${padZero(countdown.seconds)}`
                              : `${padZero(countdown.minutes)}:${padZero(countdown.seconds)}`
                            }
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-amber-200/50 dark:bg-amber-900/40 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                            initial={{ width: '0%' }}
                            animate={{
                              width: `${countdownProgress}%`,
                            }}
                            transition={{ duration: 1, ease: 'linear' }}
                          />
                        </div>
                        <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1 text-center">
                          ~{res.estimatedWait > 60
                            ? `${Math.floor(res.estimatedWait / 60)}${t('hours')} ${res.estimatedWait % 60 > 0 ? `${res.estimatedWait % 60}${t('min')}` : ''}`
                            : `${res.estimatedWait} ${t('min')}`
                          }
                        </p>
                      </motion.div>
                    )}

                    {/* Share Position + QR Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-10 rounded-xl border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 gap-2"
                          onClick={() => handleSharePosition(res)}
                        >
                          <Share2 className="h-4 w-4" />
                          {t('sharePosition') || 'Share'}
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-10 rounded-xl border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 gap-2"
                          onClick={() => {
                            setQrReservation(res);
                            setQrDialogOpen(true);
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                          {t('shareViaQR')}
                        </Button>
                      </motion.div>
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

                    {/* Leave Queue Button */}
                    {res.status === 'WAITING' && (
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 font-semibold transition-all duration-300 gap-2"
                        onClick={() => setLeaveDialogOpen(true)}
                      >
                        <XCircle className="h-4 w-4" />
                        {t('leaveQueue')}
                      </Button>
                    )}

                    {/* Skipped - Reclaim Button */}
                    {res.skippedForNoShow && res.status === 'CALLED' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          <span className="text-xs text-amber-700 dark:text-amber-400">{t('skippedWarning')}</span>
                        </div>
                        <Button
                          className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300"
                          onClick={() => handleReclaim(res.id)}
                          disabled={cancelling === res.id}
                        >
                          {cancelling === res.id ? (
                            <Loader2 className="h-4 w-4 animate-spin me-2" />
                          ) : (
                            <ShieldAlert className="h-4 w-4 me-2" />
                          )}
                          {t('reclaimPosition')}
                        </Button>
                      </motion.div>
                    )}

                    {/* Feedback for COMPLETED reservations */}
                    {res.status === 'COMPLETED' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3"
                      >
                        {feedbackSubmittedIds.has(res.id) || res.rating ? (
                          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
                            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              {t('thankYouFeedback')}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground text-center">{t('commentFeedback')}</p>
                            {/* Star rating row */}
                            <div className="flex justify-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = star <= (hoveredStar[res.id] || 0);
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    className="p-1 transition-transform hover:scale-125 disabled:opacity-30"
                                    disabled={submittingRating === res.id}
                                    onClick={() => setHoveredStar((prev) => ({ ...prev, [res.id]: star }))}
                                    onMouseEnter={() => setHoveredStar((prev) => ({ ...prev, [res.id]: star }))}
                                    onMouseLeave={() => setHoveredStar((prev) => ({ ...prev, [res.id]: 0 }))}
                                  >
                                    <Star
                                      className={`h-7 w-7 transition-colors ${
                                        isFilled
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            {/* Selected stars display */}
                            {hoveredStar[res.id] ? (
                              <p className="text-center text-xs text-muted-foreground">
                                {hoveredStar[res.id]}/5 {t('rateExperience')}
                              </p>
                            ) : null}
                            {/* Comment textarea */}
                            <textarea
                              value={feedbackComment[res.id] || ''}
                              onChange={(e) => setFeedbackComment((prev) => ({ ...prev, [res.id]: e.target.value }))}
                              placeholder={t('feedbackComment')}
                              className="w-full h-20 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                              dir={lang === 'ar' ? 'rtl' : 'ltr'}
                            />
                            {/* Submit button */}
                            <Button
                              className="w-full h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                              onClick={() => {
                                const rating = hoveredStar[res.id];
                                if (rating && rating >= 1 && rating <= 5) {
                                  handleSubmitRating(res.id, rating);
                                }
                              }}
                              disabled={submittingRating === res.id || !hoveredStar[res.id]}
                            >
                              {submittingRating === res.id ? (
                                <Loader2 className="h-4 w-4 animate-spin me-2" />
                              ) : null}
                              <Star className="h-4 w-4 me-1" />
                              {t('submitFeedback')}
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Emergency Cancel Button - shown only for WAITING status */}
                    {res.status === 'WAITING' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-3"
                      >
                        <Button
                          variant="outline"
                          className="w-full h-11 rounded-xl border-2 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 font-semibold transition-all duration-300 gap-2"
                          onClick={() => {
                            setEmergencyResId(res.id);
                            setEmergencyDialogOpen(true);
                          }}
                        >
                          <ShieldAlert className="h-4 w-4" />
                          {t('emergencyCancel')}
                        </Button>
                      </motion.div>
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
            </div>
          </motion.div>
        );
      })}

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" />
              {t('qrCodeTitle')}
            </DialogTitle>
            <DialogDescription>{t('qrCodeDesc')}</DialogDescription>
          </DialogHeader>
          {qrReservation && (
            <div className="flex flex-col items-center gap-4 py-4">
              {/* QR Code placeholder with ticket info */}
              <div className="relative p-4 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                <svg className="h-48 w-48" viewBox="0 0 200 200" fill="none">
                  {/* QR code corner squares */}
                  <rect x="10" y="10" width="60" height="60" rx="4" className="fill-emerald-600" />
                  <rect x="130" y="10" width="60" height="60" rx="4" className="fill-emerald-600" />
                  <rect x="10" y="130" width="60" height="60" rx="4" className="fill-emerald-600" />
                  {/* Inner white squares for QR corners */}
                  <rect x="18" y="18" width="44" height="44" rx="2" className="fill-white" />
                  <rect x="138" y="18" width="44" height="44" rx="2" className="fill-white" />
                  <rect x="18" y="138" width="44" height="44" rx="2" className="fill-white" />
                  <rect x="26" y="26" width="28" height="28" rx="1" className="fill-emerald-600" />
                  <rect x="146" y="26" width="28" height="28" rx="1" className="fill-emerald-600" />
                  <rect x="26" y="146" width="28" height="28" rx="1" className="fill-emerald-600" />
                  {/* Data pattern dots */}
                  <rect x="80" y="10" width="8" height="8" className="fill-emerald-500" />
                  <rect x="96" y="10" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="10" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="26" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="26" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="42" width="8" height="8" className="fill-emerald-500" />
                  <rect x="96" y="42" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="42" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="58" width="8" height="8" className="fill-emerald-500" />
                  <rect x="96" y="58" width="8" height="8" className="fill-emerald-500" />
                  <rect x="10" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="26" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="42" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="58" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="96" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="130" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="146" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="162" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="178" y="80" width="8" height="8" className="fill-emerald-500" />
                  <rect x="10" y="96" width="8" height="8" className="fill-emerald-500" />
                  <rect x="42" y="96" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="96" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="96" width="8" height="8" className="fill-emerald-500" />
                  <rect x="130" y="96" width="8" height="8" className="fill-emerald-500" />
                  <rect x="162" y="96" width="8" height="8" className="fill-emerald-500" />
                  <rect x="10" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="26" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="42" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="58" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="96" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="130" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="146" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="178" y="112" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="130" width="8" height="8" className="fill-emerald-500" />
                  <rect x="96" y="130" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="130" width="8" height="8" className="fill-emerald-500" />
                  <rect x="130" y="130" width="8" height="8" className="fill-emerald-500" />
                  <rect x="146" y="130" width="8" height="8" className="fill-emerald-500" />
                  <rect x="162" y="130" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="146" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="146" width="8" height="8" className="fill-emerald-500" />
                  <rect x="130" y="146" width="8" height="8" className="fill-emerald-500" />
                  <rect x="162" y="146" width="8" height="8" className="fill-emerald-500" />
                  <rect x="178" y="146" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="162" width="8" height="8" className="fill-emerald-500" />
                  <rect x="96" y="162" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="162" width="8" height="8" className="fill-emerald-500" />
                  <rect x="130" y="162" width="8" height="8" className="fill-emerald-500" />
                  <rect x="146" y="162" width="8" height="8" className="fill-emerald-500" />
                  <rect x="80" y="178" width="8" height="8" className="fill-emerald-500" />
                  <rect x="96" y="178" width="8" height="8" className="fill-emerald-500" />
                  <rect x="112" y="178" width="8" height="8" className="fill-emerald-500" />
                  <rect x="146" y="178" width="8" height="8" className="fill-emerald-500" />
                  <rect x="162" y="178" width="8" height="8" className="fill-emerald-500" />
                  <rect x="178" y="178" width="8" height="8" className="fill-emerald-500" />
                  {/* Center label */}
                  <rect x="82" y="132" width="36" height="36" rx="4" className="fill-white" />
                  <text x="100" y="156" textAnchor="middle" className="fill-emerald-600" fontSize="10" fontWeight="bold">QW</text>
                </svg>
              </div>
              {/* Ticket Info Display */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <span className="text-xs text-muted-foreground">{t('myQueue')}</span>
                  <span className="text-sm font-bold text-foreground">{qrReservation.queueNumber}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <span className="text-xs text-muted-foreground">{getAgencyName(qrReservation)}</span>
                  <span className="text-sm font-medium text-foreground">#{qrReservation.position}</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl gap-2"
                onClick={() => {
                  toast.info(t('comingSoon'));
                }}
              >
                <QrCode className="h-4 w-4" />
                {t('downloadQR')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Emergency Cancel AlertDialog */}
      <AlertDialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              {t('emergencyCancel')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('emergencyCancelDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => {
                if (emergencyResId) {
                  handleCancel(emergencyResId);
                }
                setEmergencyDialogOpen(false);
              }}
            >
              {t('emergencyCancelConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Queue Confirmation AlertDialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" />
              {t('leaveQueueConfirm') || 'Leave Queue?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('leaveQueueDesc') || 'Are you sure you want to leave the queue? This action cannot be undone and you will lose your position.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleLeaveQueue}
              disabled={cancelling === 'leaving'}
            >
              {cancelling === 'leaving' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('leaving') || 'Leaving...'}
                </span>
              ) : (
                t('leaveQueue') || 'Leave Queue'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
