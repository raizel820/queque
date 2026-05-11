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

  const handleSharePosition = (res: Reservation) => {
    const agencyName = lang === 'ar' && res.agencyNameAr ? res.agencyNameAr : lang === 'fr' && res.agencyNameFr ? res.agencyNameFr : res.agencyName;
    const text = `🎫 QueueWise\n📍 ${agencyName}\n🔢 ${t('queueNumber')}: ${res.queueNumber}\n📊 ${t('queuePosition')}: #${res.position}\n⏱️ ${t('estimatedWait')}: ~${res.estimatedWait} ${t('min')}`;
    if (navigator.share) {
      navigator.share({ title: 'QueueWise - Queue Position', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
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

        // Circular countdown calculation
        const totalSec = countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
        const maxSec = res.estimatedWait * 60 || 1;
        const countdownProgress = Math.max(0, (totalSec / maxSec) * 100);
        const countdownDashOffset = countdownCircumference - (countdownProgress / 100) * countdownCircumference;

        return (
          <motion.div
            key={res.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
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
              <div className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 z-10 shadow-inner" />
              {/* Right perforation circle */}
              <div className="absolute end-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 z-10 shadow-inner" />

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
                          <Sparkles className="h-3 w-3 inline me-1" />
                          {t('statusCalled')}!
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
                      {/* Animated circular countdown */}
                      <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex flex-col items-center justify-center">
                        <div className="relative h-14 w-14">
                          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 80 80">
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
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">~{res.estimatedWait}</span>
                            <span className="text-[8px] text-muted-foreground">{t('min')}</span>
                          </div>
                        </div>
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
    </div>
  );
}
