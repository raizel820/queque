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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore as useStore } from '@/store/use-app-store';

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

  const fetchReservations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/reservations/active?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.reservations ?? []).map((r: Record<string, unknown>) => {
          const agency = r.agency as Record<string, string> | undefined;
          const service = r.service as Record<string, string> | undefined;
          // Calculate position and people ahead
          return {
            id: r.id,
            queueNumber: r.displayNumber || `${r.queueNumber}`,
            status: r.status,
            position: 0,
            peopleAhead: 0,
            estimatedWait: r.estimatedWait || 0,
            currentServingNumber: '0',
            agencyName: agency?.name || 'Agency',
            agencyNameAr: agency?.nameAr,
            agencyNameFr: agency?.nameFr,
            serviceName: service?.name || 'Service',
            serviceNameAr: service?.nameAr,
            serviceNameFr: service?.nameFr,
            joinedAt: r.joinedAt,
          };
        });
        setReservations(list);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReservations();
    // Poll every 5 seconds
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
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-72 rounded-2xl mb-4" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  // Empty State
  if (!activeRes && reservations.length === 0) {
    return (
      <div className="px-4 py-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('myQueue')}</h1>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <TicketCheck className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {t('noActiveReservations')}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            {t('welcomeSubtitle')}
          </p>
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-6 rounded-xl h-11"
            onClick={() => setView('customer-home')}
          >
            {t('joinQueue')}
          </Button>
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
              className={`mb-4 border-0 shadow-lg overflow-hidden ${
                isCalled
                  ? 'ring-2 ring-emerald-400 dark:ring-emerald-500'
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
                    <Volume2 className="h-5 w-5 animate-pulse" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                  <span className="font-semibold text-sm">
                    {isCalled ? t('statusCalled') : t('statusWaiting')}
                  </span>
                </div>
              </div>

              <CardContent className="p-5">
                {/* Large Queue Number */}
                <div className="text-center mb-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    {t('yourQueueNumber')}
                  </p>
                  <div className="text-6xl md:text-7xl font-black text-foreground tracking-tight">
                    {res.queueNumber}
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
                  <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
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

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{t('queuePosition')}</span>
                    <span className="text-xs font-medium text-foreground">
                      #{res.position}
                    </span>
                  </div>
                  <Progress value={progressValue} className="h-2.5" />
                </div>

                {/* Cancel Button */}
                {res.status === 'WAITING' && (
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
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
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
