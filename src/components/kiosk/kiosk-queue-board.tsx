'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useRealtime } from '@/hooks/use-realtime';
import { isRTL, type Language } from '@/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Clock, Users, ArrowLeft, RefreshCw } from 'lucide-react';

interface CurrentlyServing {
  id: string;
  ticketNumber: string;
  serviceName: string;
  status: string;
  calledAt: string | null;
}

interface ServiceStat {
  serviceId: string;
  serviceName: string;
  serviceNameAr?: string | null;
  serviceNameFr?: string | null;
  prefix: string;
  waiting: number;
  estimatedWait: number;
}

interface QueueStatus {
  agency: {
    id: string;
    name: string;
    nameAr?: string | null;
    nameFr?: string | null;
    isQueueOpen: boolean;
    isPaused: boolean;
  };
  currentlyServing: CurrentlyServing[];
  serviceStats: ServiceStat[];
  totalWaiting: number;
  totalEstimatedWait: number;
  recentCalls: {
    id: string;
    ticketNumber: string;
    status: string;
    calledAt: string | null;
  }[];
}

interface KioskQueueBoardProps {
  agencyId: string;
  onBack: () => void;
  currentLang: Language;
}

export function KioskQueueBoard({
  agencyId,
  onBack,
  currentLang,
}: KioskQueueBoardProps) {
  const { t } = useLanguage();
  const realtime = useRealtime();
  const rtl = isRTL(currentLang);
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/kiosk/status?agencyId=${agencyId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  // Polling fallback — keeps working even if realtime is disconnected
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      setLastRefresh(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, [agencyId, fetchStatus]);

  // Join kiosk room for realtime updates
  useEffect(() => {
    if (!agencyId) return;
    realtime.joinKiosk(agencyId);
    return () => {
      realtime.leaveKiosk(agencyId);
    };
  }, [agencyId]);

  // Subscribe to realtime events — instantly refresh on any queue change
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const handleUpdate = () => {
      fetchStatus();
    };

    unsubscribers.push(realtime.onKioskUpdate(handleUpdate));
    unsubscribers.push(realtime.onQueueCalled(handleUpdate));
    unsubscribers.push(realtime.onQueueJoined(handleUpdate));
    unsubscribers.push(realtime.onQueueWalkIn(handleUpdate));
    unsubscribers.push(realtime.onQueuePaused(handleUpdate));
    unsubscribers.push(realtime.onQueueResumed(handleUpdate));

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [realtime, fetchStatus]);

  const getAgencyName = () => {
    if (!status) return '';
    if (currentLang === 'ar' && status.agency.nameAr) return status.agency.nameAr;
    if (currentLang === 'fr' && status.agency.nameFr) return status.agency.nameFr;
    return status.agency.name;
  };

  const getServiceName = (stat: ServiceStat) => {
    if (currentLang === 'ar' && stat.serviceNameAr) return stat.serviceNameAr;
    if (currentLang === 'fr' && stat.serviceNameFr) return stat.serviceNameFr;
    return stat.serviceName;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <RefreshCw className="h-12 w-12 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!status) {
    return (
      <div
        className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <p className="text-xl mb-4">{t('error')}</p>
        <button
          onClick={onBack}
          className="min-h-[60px] px-8 rounded-2xl bg-emerald-600 text-white font-semibold text-lg"
        >
          {t('kioskBack')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-900 text-white flex flex-col select-none"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="min-h-[48px] min-w-[48px] rounded-xl bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className={`h-5 w-5 ${rtl ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-emerald-400" />
              <h1 className="text-xl font-bold">{t('kioskQueueBoard')}</h1>
            </div>
            <p className="text-gray-400 text-sm">{getAgencyName()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <span className="flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            5s
          </span>
          {realtime.isConnected ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-wider">LIVE</span>
            </div>
          ) : (
            <span className="text-gray-500 font-semibold">● OFFLINE</span>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Now Serving Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
            <Users className="h-7 w-7" />
            {t('kioskNowServing')}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {status.currentlyServing.length > 0 ? (
              status.currentlyServing.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-900/40 border border-emerald-700/30 rounded-2xl p-6 text-center"
                >
                  <p className="text-5xl font-bold text-emerald-400 mb-2">
                    {item.ticketNumber}
                  </p>
                  <p className="text-emerald-200 text-lg">{item.serviceName}</p>
                  <p className="text-emerald-400/70 text-sm mt-1 uppercase">
                    {t('kioskNowServing')}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full bg-gray-800 rounded-2xl p-8 text-center">
                <p className="text-gray-400 text-lg">
                  {t('noQueue')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Service Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-300">
            {t('services')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {status.serviceStats.map((stat) => (
              <div
                key={stat.serviceId}
                className="bg-gray-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-gray-700 text-gray-300 mr-2">
                    {stat.prefix}
                  </span>
                  <span className="text-white font-semibold">
                    {getServiceName(stat)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber-400">{stat.waiting}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{t('kioskWaiting')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-teal-400">{stat.estimatedWait}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{t('kioskMinutes')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Calls */}
        {status.recentCalls.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-300 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent
            </h2>
            <div className="flex gap-3 flex-wrap">
              {status.recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="bg-gray-800/60 rounded-lg px-4 py-2 flex items-center gap-2"
                >
                  <span className="text-lg font-bold text-gray-200">
                    {call.ticketNumber}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      call.status === 'CALLED'
                        ? 'bg-emerald-900 text-emerald-400'
                        : call.status === 'SERVING'
                        ? 'bg-teal-900 text-teal-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {call.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-around">
        <div className="text-center">
          <p className="text-3xl font-bold text-emerald-400">
            {status.totalWaiting}
          </p>
          <p className="text-xs text-gray-400 uppercase">{t('kioskWaiting')}</p>
        </div>
        <div className="w-px h-10 bg-gray-700" />
        <div className="text-center">
          <p className="text-3xl font-bold text-teal-400">
            {status.totalEstimatedWait}
          </p>
          <p className="text-xs text-gray-400 uppercase">{t('kioskMinutes')}</p>
        </div>
      </div>
    </div>
  );
}
