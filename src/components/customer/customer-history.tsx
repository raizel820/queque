'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QueueStatusBadge } from '@/components/shared/queue-status-badge';
import { TicketCheck, Calendar, MapPin, Filter, RotateCcw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { TranslationKeys } from '@/i18n';

interface HistoryItem {
  id: string;
  queueNumber: string;
  status: string;
  agencyId: string;
  serviceId: string;
  agencyName: string;
  agencyNameAr?: string;
  agencyNameFr?: string;
  serviceName: string;
  serviceNameAr?: string;
  serviceNameFr?: string;
  joinedAt: string;
  completedAt?: string;
}

const statusFilters: { key: TranslationKeys; value: string }[] = [
  { key: 'all', value: 'ALL' },
  { key: 'completed', value: 'COMPLETED' },
  { key: 'cancelled', value: 'CANCELLED' },
  { key: 'statusNoShow', value: 'NO_SHOW' },
];

export function CustomerHistory() {
  const { user, setView } = useAppStore();
  const { t, lang } = useLanguage();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [rejoining, setRejoining] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/history?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.reservations ?? []).map((r: Record<string, unknown>) => {
          const agency = r.agency as Record<string, string> | undefined;
          const service = r.service as Record<string, string> | undefined;
          return {
            id: r.id,
            queueNumber: r.displayNumber || `${r.queueNumber}`,
            status: r.status,
            agencyId: (r as Record<string, unknown>).agencyId || agency?.id || '',
            serviceId: (r as Record<string, unknown>).serviceId || service?.id || '',
            agencyName: agency?.name || 'Agency',
            agencyNameAr: agency?.nameAr,
            agencyNameFr: agency?.nameFr,
            serviceName: service?.name || 'Service',
            serviceNameAr: service?.nameAr,
            serviceNameFr: service?.nameFr,
            joinedAt: r.joinedAt,
            completedAt: r.completedAt,
          };
        });
        setHistory(list);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleRejoin = async (item: HistoryItem) => {
    if (!user?.id) return;
    setRejoining(item.id);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          agencyId: item.agencyId,
          serviceId: item.serviceId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('joinSuccess'));
        setView('customer-queue');
      } else {
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setRejoining(null);
    }
  };

  const filtered = filter === 'ALL' ? history : history.filter((h) => h.status === filter);

  const getAgencyName = (item: HistoryItem) => {
    if (lang === 'ar' && item.agencyNameAr) return item.agencyNameAr;
    if (lang === 'fr' && item.agencyNameFr) return item.agencyNameFr;
    return item.agencyName;
  };

  const getServiceName = (item: HistoryItem) => {
    if (lang === 'ar' && item.serviceNameAr) return item.serviceNameAr;
    if (lang === 'fr' && item.serviceNameFr) return item.serviceNameFr;
    return item.serviceName;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const canRejoin = (status: string) => {
    return ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status);
  };

  return (
    <div className="px-4 py-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-1">{t('history')}</h1>
      <p className="text-sm text-muted-foreground mb-5">{t('reservations')}</p>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-9 ${
              filter === f.value
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t(f.key)}
          </button>
        ))}
      </div>

      {/* History List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                          {item.queueNumber}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {getAgencyName(item)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getServiceName(item)}
                        </p>
                      </div>
                    </div>
                    <QueueStatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.joinedAt)}</span>
                    </div>
                    {canRejoin(item.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => handleRejoin(item)}
                        disabled={!!rejoining}
                      >
                        {rejoining === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin me-1" />
                        ) : (
                          <RotateCcw className="h-3 w-3 me-1" />
                        )}
                        {t('bookAgain')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
