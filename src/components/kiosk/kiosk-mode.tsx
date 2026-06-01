'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useRealtime } from '@/hooks/use-realtime';
import { isRTL, type Language } from '@/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Ticket,
  Clock,
  Users,
  Loader2,
  CheckCircle,
  Hash,
  Printer,
  RotateCcw,
  Globe,
  AlertTriangle,
  XCircle,
  Pause,
} from 'lucide-react';

type KioskStep = 'code' | 'services' | 'name' | 'ticket';

interface AgencyInfo {
  id: string;
  name: string;
  nameAr?: string | null;
  nameFr?: string | null;
  category: string;
  logoUrl?: string | null;
  workingHoursStart: string;
  workingHoursEnd: string;
  isQueueOpen: boolean;
  isPaused: boolean;
}

interface ServiceInfo {
  id: string;
  name: string;
  nameAr?: string | null;
  nameFr?: string | null;
  prefix: string;
  avgTime: number;
}

interface QueueStats {
  waiting: number;
  currentServing: string | null;
  estimatedWait: number;
}

interface TicketInfo {
  id: string;
  ticketNumber: string;
  position: number;
  estimatedWaitMinutes: number;
}

export function KioskMode() {
  const { t, lang, setLang } = useLanguage();
  const rtl = isRTL(lang);

  // State
  const [step, setStep] = useState<KioskStep>('code');
  const [agencyCode, setAgencyCode] = useState('');
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inactivity timer for ticket display (60 seconds)
  const [inactivitySeconds, setInactivitySeconds] = useState(0);

  const realtime = useRealtime();
  const prevAgencyIdRef = useRef<string | null>(null);

  // Fetch agency by code
  const fetchAgency = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kiosk/agency?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Agency not found');
        return;
      }
      setAgency(data.agency);
      setServices(data.services || []);
      setQueueStats(data.queueStats);
      // Auto-advance if queue is closed/paused
      if (data.agency.isQueueOpen && !data.agency.isPaused) {
        setStep('services');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper to refresh kiosk queue status
  const refreshKioskStatus = useCallback(async (agencyId: string) => {
    try {
      const res = await fetch(`/api/kiosk/status?agencyId=${agencyId}`);
      if (res.ok) {
        const data = await res.json();
        setQueueStats({
          waiting: data.totalWaiting ?? 0,
          currentServing: data.currentlyServing?.[0]?.ticketNumber ?? null,
          estimatedWait: data.totalEstimatedWait ?? 0,
        });
      }
    } catch {
      // silent
    }
  }, []);

  // Auto-refresh queue status every 10 seconds when on ticket screen
  useEffect(() => {
    if (step !== 'ticket' || !agency) return;
    const interval = setInterval(() => refreshKioskStatus(agency.id), 10000);
    return () => clearInterval(interval);
  }, [step, agency, refreshKioskStatus]);

  // ─── Realtime: Join kiosk room for instant updates ──────────────────
  useEffect(() => {
    if (!agency?.id) return;
    // Avoid re-joining if agency hasn't changed
    if (prevAgencyIdRef.current === agency.id) return;
    prevAgencyIdRef.current = agency.id;
    realtime.joinKiosk(agency.id);
    return () => {
      realtime.leaveKiosk(agency.id);
    };
  }, [agency?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Realtime: Instant updates on kiosk events ──────────────────────
  useEffect(() => {
    if (!agency?.id) return;
    const unsubscribers: (() => void)[] = [];

    const handleKioskEvent = () => {
      refreshKioskStatus(agency.id);
    };

    unsubscribers.push(realtime.onKioskUpdate(handleKioskEvent));
    unsubscribers.push(realtime.onQueueCalled(handleKioskEvent));
    unsubscribers.push(realtime.onQueuePaused(handleKioskEvent));
    unsubscribers.push(realtime.onQueueResumed(handleKioskEvent));
    unsubscribers.push(realtime.onQueueCompleted(handleKioskEvent));
    unsubscribers.push(realtime.onQueueJoined(handleKioskEvent));

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [agency?.id, realtime, refreshKioskStatus]);

  // Inactivity timer — auto-return after 60s on ticket screen
  useEffect(() => {
    if (step !== 'ticket') {
      setInactivitySeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setInactivitySeconds((prev) => {
        if (prev >= 60) {
          handleReset();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset inactivity on any interaction
  const resetInactivity = useCallback(() => {
    if (step === 'ticket') {
      setInactivitySeconds(0);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'ticket') return;
    const events = ['touchstart', 'click', 'keydown'] as const;
    const handler = () => resetInactivity();
    events.forEach((e) => window.addEventListener(e, handler));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [step, resetInactivity]);

  // Join queue
  const handleJoinQueue = async () => {
    if (!agency || !selectedService) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/kiosk/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: agency.id,
          serviceId: selectedService,
          customerName: customerName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to join queue');
        return;
      }
      setTicket(data.reservation);
      setStep('ticket');
      setInactivitySeconds(0);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Reset everything
  const handleReset = useCallback(() => {
    setStep('code');
    setAgencyCode('');
    setAgency(null);
    setServices([]);
    setQueueStats(null);
    setSelectedService(null);
    setCustomerName('');
    setTicket(null);
    setLoading(false);
    setError(null);
    setInactivitySeconds(0);
  }, []);

  // Get localized name
  const getLocalizedName = (obj: { name: string; nameAr?: string | null; nameFr?: string | null }) => {
    if (lang === 'ar' && obj.nameAr) return obj.nameAr;
    if (lang === 'fr' && obj.nameFr) return obj.nameFr;
    return obj.name;
  };

  // Print ticket
  const handlePrint = () => {
    window.print();
  };

  // Handle code submit
  const handleCodeSubmit = () => {
    if (agencyCode.trim()) {
      fetchAgency(agencyCode.trim());
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'ar', label: 'عربي' },
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
  ];

  const pageVariants = {
    enter: { opacity: 0, x: rtl ? -40 : 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: rtl ? 40 : -40 },
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex flex-col select-none overflow-hidden"
      dir={rtl ? 'rtl' : 'ltr'}
      onClick={resetInactivity}
      onTouchStart={resetInactivity}
    >
      {/* Language selector - top corner */}
      <div className="absolute top-4 end-4 flex gap-2 z-20 print:hidden">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`min-h-[48px] min-w-[48px] px-4 rounded-xl text-sm font-semibold transition-all ${
              lang === l.code
                ? 'bg-white text-emerald-700 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* BLASTI branding - top */}
      <div className="flex items-center justify-center pt-6 pb-2 print:hidden">
        <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white/10 p-1">
          <img src="/logo.png" alt="BLASTI" className="h-full w-full object-contain" />
        </div>
        <span className="ms-3 text-2xl font-bold text-white">BLASTI</span>
        {/* Live connection indicator */}
        {agency && (
          <span className={`ms-3 flex items-center gap-1.5 text-xs ${realtime.isConnected ? 'text-emerald-300' : 'text-amber-300'}`}>
            <span className={`h-2 w-2 rounded-full inline-block ${realtime.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {realtime.isConnected ? (t('live') || 'Live') : (t('polling') || 'Polling')}
          </span>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {/* ─── Step 1: Enter Agency Code ─── */}
          {step === 'code' && (
            <motion.div
              key="code"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('enterAgencyCode')}
                </h1>
                <p className="text-gray-500 mb-6 text-sm">
                  {t('agencyCodePlaceholder')}
                </p>

                <input
                  type="text"
                  value={agencyCode}
                  onChange={(e) => setAgencyCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCodeSubmit(); }}
                  placeholder={t('agencyCodePlaceholder')}
                  className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 px-5 text-xl text-center font-semibold focus:border-emerald-500 focus:outline-none transition-colors uppercase tracking-widest"
                  autoFocus
                  dir="ltr"
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCodeSubmit}
                  disabled={loading || !agencyCode.trim()}
                  className={`w-full min-h-[64px] rounded-2xl text-xl font-bold shadow-lg mt-6 flex items-center justify-center gap-3 transition-all ${
                    !agencyCode.trim() || loading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <Search className="h-6 w-6" />
                  )}
                  {t('search')}
                </motion.button>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {t('scanQrCodeKiosk')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2: Select Service ─── */}
          {step === 'services' && agency && (
            <motion.div
              key="services"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full max-w-lg"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
                {/* Agency header */}
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={handleReset}
                    className="min-h-[48px] min-w-[48px] rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
                  >
                    <svg className={`h-5 w-5 text-gray-600 ${rtl ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">
                      {getLocalizedName(agency)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {agency.workingHoursStart} — {agency.workingHoursEnd}
                    </p>
                  </div>
                </div>

                {/* Queue status badges */}
                {queueStats && (
                  <div className="flex gap-3 mb-6">
                    <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                      <Users className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-emerald-700">{queueStats.waiting}</p>
                      <p className="text-[10px] text-emerald-600">{t('kioskWaiting')}</p>
                    </div>
                    <div className="flex-1 bg-teal-50 rounded-xl p-3 text-center">
                      <Ticket className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-teal-700">{queueStats.currentServing || '—'}</p>
                      <p className="text-[10px] text-teal-600">{t('currentlyServingKiosk')}</p>
                    </div>
                    <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
                      <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-amber-700">{queueStats.estimatedWait}</p>
                      <p className="text-[10px] text-amber-600">{t('minutesKiosk')}</p>
                    </div>
                  </div>
                )}

                {/* Queue status warnings */}
                {!agency.isQueueOpen && (
                  <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 font-semibold">{t('queueClosedKiosk')}</p>
                  </div>
                )}
                {agency.isPaused && agency.isQueueOpen && (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                    <Pause className="h-6 w-6 text-amber-500 flex-shrink-0" />
                    <p className="text-amber-700 font-semibold">{t('queuePausedKiosk')}</p>
                  </div>
                )}

                {/* Service selection */}
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('selectServiceKiosk')}
                </h3>

                {services.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">{t('kioskNoServices')}</p>
                ) : (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {services.map((service) => {
                      const isSelected = selectedService === service.id;
                      return (
                        <motion.button
                          key={service.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedService(service.id)}
                          className={`w-full min-h-[72px] rounded-2xl p-4 text-start transition-all border-2 flex items-center justify-between ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                              : 'border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                              {service.prefix}
                            </span>
                            <div>
                              <p className="text-lg font-semibold text-gray-900">
                                {getLocalizedName(service)}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ~{service.avgTime} {t('minutesKiosk')}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0"
                            >
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Next button */}
                <motion.button
                  whileHover={{ scale: selectedService ? 1.02 : 1 }}
                  whileTap={{ scale: selectedService ? 0.98 : 1 }}
                  onClick={() => {
                    if (selectedService) {
                      setError(null);
                      setStep('name');
                    }
                  }}
                  disabled={!selectedService || !agency.isQueueOpen || agency.isPaused}
                  className={`w-full min-h-[64px] rounded-2xl text-xl font-bold shadow-lg mt-6 flex items-center justify-center gap-3 transition-all ${
                    !selectedService || !agency.isQueueOpen || agency.isPaused
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl'
                  }`}
                >
                  {t('next')}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Enter Name (optional) ─── */}
          {step === 'name' && agency && selectedService && (
            <motion.div
              key="name"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('enterYourName')}
                </h2>

                {/* Selected service summary */}
                {services.find((s) => s.id === selectedService) && (
                  <div className="mb-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-sm text-emerald-600 font-medium">
                      {services.find((s) => s.id === selectedService)?.prefix} — {getLocalizedName(services.find((s) => s.id === selectedService)!)}
                    </p>
                  </div>
                )}

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('enterYourName')}
                  className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 px-5 text-lg focus:border-emerald-500 focus:outline-none transition-colors text-center"
                  autoFocus
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoinQueue}
                  disabled={loading}
                  className="w-full min-h-[72px] rounded-2xl text-xl font-bold shadow-lg mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <Ticket className="h-7 w-7" />
                  )}
                  {t('joinQueueKiosk')}
                </motion.button>

                <button
                  onClick={() => { setStep('services'); setError(null); }}
                  className="mt-4 min-h-[48px] px-6 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                >
                  {t('kioskBack')}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 4: Ticket Display ─── */}
          {step === 'ticket' && ticket && agency && (
            <motion.div
              key="ticket"
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full max-w-md"
            >
              <div className="print-area">
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="text-center mb-4"
                >
                  <CheckCircle className="h-16 w-16 text-emerald-300 mx-auto" />
                </motion.div>

                {/* Thank you */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-medium text-emerald-100 mb-4 text-center"
                >
                  {t('kioskThankYou')}
                </motion.p>

                {/* Ticket card - BIG */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.2 }}
                  className="bg-white rounded-3xl p-8 shadow-2xl mb-6 ticket-card"
                >
                  <p className="text-sm font-semibold text-emerald-600 mb-2 uppercase tracking-wider text-center">
                    {t('yourTicketKiosk')}
                  </p>
                  <motion.p
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                    className="text-[72px] sm:text-[80px] leading-none font-bold text-gray-900 text-center"
                  >
                    {ticket.ticketNumber}
                  </motion.p>

                  {/* Agency name */}
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    {getLocalizedName(agency)}
                  </p>
                </motion.div>

                {/* Position & Wait - big numbers */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: rtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-center"
                  >
                    <Hash className="h-6 w-6 text-emerald-200 mx-auto mb-2" />
                    <p className="text-4xl font-bold text-white">{ticket.position}</p>
                    <p className="text-sm text-emerald-200">{t('positionInQueue')}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: rtl ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-center"
                  >
                    <Clock className="h-6 w-6 text-emerald-200 mx-auto mb-2" />
                    <p className="text-4xl font-bold text-white">{ticket.estimatedWaitMinutes}</p>
                    <p className="text-sm text-emerald-200">{t('minutesKiosk')}</p>
                  </motion.div>
                </div>

                {/* Currently serving */}
                {queueStats?.currentServing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center mb-6"
                  >
                    <p className="text-sm text-emerald-200">{t('currentlyServingKiosk')}</p>
                    <p className="text-3xl font-bold text-white">{queueStats.currentServing}</p>
                  </motion.div>
                )}
              </div>

              {/* Action buttons - hidden in print */}
              <div className="flex gap-3 print:hidden">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrint}
                  className="flex-1 min-h-[60px] rounded-2xl bg-white/20 backdrop-blur-sm text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
                >
                  <Printer className="h-5 w-5" />
                  {t('printTicket')}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="flex-1 min-h-[60px] rounded-2xl bg-white/20 backdrop-blur-sm text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
                >
                  <RotateCcw className="h-5 w-5" />
                  {t('newTicket')}
                </motion.button>
              </div>

              {/* Inactivity countdown */}
              {inactivitySeconds > 30 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-emerald-200/60 text-xs mt-4 print:hidden"
                >
                  {60 - inactivitySeconds}s
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="text-center pb-4 text-white/40 text-xs print:hidden">
        BLASTI — {t('kioskTitle')}
      </div>
    </div>
  );
}
