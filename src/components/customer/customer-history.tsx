'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { QueueStatusBadge } from '@/components/shared/queue-status-badge';
import {
  TicketCheck,
  CalendarDays,
  RotateCcw,
  Loader2,
  Calendar as CalendarIcon,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  History,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { TranslationKeys } from '@/i18n';
import { RatingDialog } from '@/components/shared/rating-dialog';

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
  calledAt?: string;
  estimatedWait?: number | null;
  rating?: number | null;
  feedback?: string | null;
  ratedAt?: string | null;
}

type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'earlier';

const statusFilters: { key: TranslationKeys; value: string }[] = [
  { key: 'all', value: 'ALL' },
  { key: 'completed', value: 'COMPLETED' },
  { key: 'cancelled', value: 'CANCELLED' },
  { key: 'statusNoShow', value: 'NO_SHOW' },
];

// Status dot colors for timeline
const statusDotConfig: Record<string, { bg: string; ring: string; icon: typeof CheckCircle2 }> = {
  WAITING: { bg: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-800', icon: Clock },
  CALLED: { bg: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800', icon: CheckCircle2 },
  COMPLETED: { bg: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800', icon: CheckCircle2 },
  SERVED: { bg: 'bg-teal-500', ring: 'ring-teal-200 dark:ring-teal-800', icon: CheckCircle2 },
  CANCELLED: { bg: 'bg-gray-400', ring: 'ring-gray-200 dark:ring-gray-700', icon: XCircle },
  NO_SHOW: { bg: 'bg-rose-500', ring: 'ring-rose-200 dark:ring-rose-800', icon: XCircle },
};

export function CustomerHistory() {
  const { user, setView } = useAppStore();
  const { t, lang } = useLanguage();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Rating dialog state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingItem, setRatingItem] = useState<HistoryItem | null>(null);

  // Date picker state for rejoin
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [pendingRejoinItem, setPendingRejoinItem] = useState<HistoryItem | null>(null);
  const [joining, setJoining] = useState(false);

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
            agencyName: agency?.name || t('defaultAgency'),
            agencyNameAr: agency?.nameAr,
            agencyNameFr: agency?.nameFr,
            serviceName: service?.name || t('defaultService'),
            serviceNameAr: service?.nameAr,
            serviceNameFr: service?.nameFr,
            joinedAt: r.joinedAt,
            completedAt: r.completedAt,
            calledAt: r.calledAt,
            estimatedWait: (r.estimatedWait as number | null | undefined) ?? null,
            rating: (r.rating as number | null | undefined) ?? null,
            feedback: (r.feedback as string | null | undefined) ?? null,
            ratedAt: (r.ratedAt as string | null | undefined) ?? null,
          };
        });
        setHistory(list);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRejoin = (item: HistoryItem) => {
    setPendingRejoinItem(item);
    setSelectedDate(undefined);
    setDateDialogOpen(true);
  };

  const confirmRejoin = async () => {
    if (!user?.id || !pendingRejoinItem) return;
    setJoining(true);
    try {
      const body: Record<string, string> = {
        userId: user.id,
        agencyId: pendingRejoinItem.agencyId,
        serviceId: pendingRejoinItem.serviceId,
      };
      if (selectedDate) {
        const today = new Date();
        const isToday = selectedDate.getFullYear() === today.getFullYear()
          && selectedDate.getMonth() === today.getMonth()
          && selectedDate.getDate() === today.getDate();
        if (!isToday) {
          body.reservedDate = selectedDate.toISOString().split('T')[0];
        }
      }
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('joinSuccess'));
        setDateDialogOpen(false);
        setPendingRejoinItem(null);
        setView('customer-queue');
      } else {
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setJoining(false);
    }
  };

  // Filter history based on selected tab
  const filtered = useMemo(
    () => filter === 'ALL' ? history : history.filter((h) => h.status === filter),
    [filter, history]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const totalVisits = history.length;
    const completedCount = history.filter((h) => h.status === 'COMPLETED' || h.status === 'SERVED').length;
    const cancelledCount = history.filter((h) => h.status === 'CANCELLED').length;
    const waitTimes = history
      .filter((h) => h.estimatedWait != null)
      .map((h) => h.estimatedWait as number);
    const avgWait = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;
    return { totalVisits, completedCount, cancelledCount, avgWait };
  }, [history]);

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

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const canRejoin = (status: string) => {
    return ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status);
  };

  const handleRateItem = (item: HistoryItem) => {
    setRatingItem(item);
    setRatingDialogOpen(true);
  };

  const handleRatingSubmitted = () => {
    fetchHistory();
  };

  // Date grouping logic
  const getDateGroup = (dateStr: string): DateGroup => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (itemDate.getTime() === today.getTime()) return 'today';
    if (itemDate.getTime() === yesterday.getTime()) return 'yesterday';
    if (itemDate >= weekStart) return 'thisWeek';
    return 'earlier';
  };

  const getDateGroupLabel = (group: DateGroup): string => {
    switch (group) {
      case 'today': return t('today');
      case 'yesterday': return t('historyYesterday');
      case 'thisWeek': return t('thisWeek');
      case 'earlier': return t('historyEarlier');
    }
  };

  const getDateGroupIcon = (group: DateGroup) => {
    switch (group) {
      case 'today': return '📅';
      case 'yesterday': return '📆';
      case 'thisWeek': return '📊';
      case 'earlier': return '🗂️';
    }
  };

  // Group filtered items by date
  const groupedItems = useMemo(() => {
    const groups: Record<DateGroup, HistoryItem[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    filtered.forEach((item) => {
      const group = getDateGroup(item.joinedAt);
      groups[group].push(item);
    });

    return groups;
  }, [filtered]);

  const dateGroupOrder: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'earlier'];

  // Star rating display
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header */}
      <div className="mb-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-1"
        >
          <div className="h-1.5 w-8 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 bg-clip-text text-transparent">{t('history')}</h1>
        </motion.div>
        <p className="text-sm text-muted-foreground ms-[44px] mb-5">{t('reservations')}</p>
      </div>

      {/* Summary Stats Bar */}
      {!loading && history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-4 gap-2 mb-5"
        >
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <CardContent className="p-2.5 sm:p-3 text-center">
              <History className="h-4 w-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
              <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.totalVisits}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium leading-tight">{t('historyTotalVisits')}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
            <CardContent className="p-2.5 sm:p-3 text-center">
              <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-green-600 dark:text-green-400" />
              <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-300">{stats.completedCount}</p>
              <p className="text-[10px] sm:text-xs text-green-600/70 dark:text-green-400/70 font-medium leading-tight">{t('historyCompletedCount')}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30">
            <CardContent className="p-2.5 sm:p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-teal-600 dark:text-teal-400" />
              <p className="text-lg sm:text-xl font-bold text-teal-700 dark:text-teal-300">{stats.avgWait > 0 ? `${stats.avgWait}` : '—'}</p>
              <p className="text-[10px] sm:text-xs text-teal-600/70 dark:text-teal-400/70 font-medium leading-tight">{t('historyAvgWait')}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30">
            <CardContent className="p-2.5 sm:p-3 text-center">
              <XCircle className="h-4 w-4 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
              <p className="text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-300">{stats.cancelledCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-500/70 dark:text-gray-400/70 font-medium leading-tight">{t('historyCancelledCount')}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mb-5"
      >
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-full h-auto bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl">
            {statusFilters.map((f) => (
              <TabsTrigger
                key={f.value}
                value={f.value}
                className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-emerald-700 data-[state=active]:dark:text-emerald-400 data-[state=active]:shadow-sm py-2 px-2 transition-all"
              >
                {t(f.key)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* History Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <Skeleton className="w-0.5 flex-1 min-h-[60px]" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/5 rounded-lg" />
                <Skeleton className="h-4 w-4/5 rounded-lg" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-16 rounded-lg" />
                  <Skeleton className="h-4 w-16 rounded-lg" />
                </div>
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200/60 dark:ring-emerald-800/60">
              <History className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('emptyNoHistoryTitle')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">{t('emptyNoHistoryDesc')}</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <div key={filter} className="space-y-6">
            {dateGroupOrder.map((group) => {
              const items = groupedItems[group];
              if (items.length === 0) return null;

              return (
                <div key={group}>
                  {/* Date Group Header */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 mb-3"
                  >
                    <span className="text-sm">{getDateGroupIcon(group)}</span>
                    <h3 className="text-sm font-semibold text-foreground/80">{getDateGroupLabel(group)}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                  </motion.div>

                  {/* Timeline for this group */}
                  <div className="relative ps-7">
                    {/* Vertical timeline line */}
                    <div className="absolute start-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-300/60 via-teal-300/40 to-transparent dark:from-emerald-700/40 dark:via-teal-700/30" />

                    {items.map((item, idx) => {
                      const dotConfig = statusDotConfig[item.status] ?? statusDotConfig.CANCELLED;
                      const StatusIcon = dotConfig.icon;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="relative pb-4"
                        >
                          {/* Timeline dot with icon */}
                          <div className={`absolute start-[-22px] top-5 h-5 w-5 rounded-full ${dotConfig.bg} ring-[3px] ${dotConfig.ring} ring-background shadow-sm flex items-center justify-center`}>
                            <StatusIcon className="h-2.5 w-2.5 text-white" />
                          </div>

                          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 overflow-hidden">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <div className="min-h-10 min-w-10 px-2.5 py-1 sm:min-h-11 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                      {item.queueNumber}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                      {getAgencyName(item)}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {getServiceName(item)}
                                    </p>
                                  </div>
                                </div>
                                <QueueStatusBadge status={item.status} compact />
                              </div>

                              {/* Rating display for completed items */}
                              {item.status === 'COMPLETED' && item.rating && (
                                <div className="mt-2 flex items-center gap-2">
                                  <StarRating rating={item.rating} />
                                  <span className="text-xs text-muted-foreground">
                                    {item.rating}/5
                                  </span>
                                </div>
                              )}
                              {/* Rate button for completed items without rating */}
                              {item.status === 'COMPLETED' && !item.rating && (
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 rounded-lg text-[11px] border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2.5"
                                    onClick={() => handleRateItem(item)}
                                  >
                                    <MessageSquare className="h-3 w-3 me-1" />
                                    {t('rateNow')}
                                  </Button>
                                </div>
                              )}

                              {/* Time info and action row */}
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <CalendarIcon className="h-3 w-3" />
                                    <span>{formatTime(item.joinedAt)}</span>
                                  </div>
                                  {item.estimatedWait != null && item.estimatedWait > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>~{item.estimatedWait}{t('min')}</span>
                                    </div>
                                  )}
                                </div>
                                {canRejoin(item.status) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 rounded-lg text-[11px] border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2.5"
                                    onClick={() => handleRejoin(item)}
                                    disabled={!!joining}
                                  >
                                    {joining && pendingRejoinItem?.id === item.id ? (
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
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Rating Dialog */}
      {ratingItem && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          agencyName={getAgencyName(ratingItem)}
          serviceName={getServiceName(ratingItem)}
          agencyId={ratingItem.agencyId}
          userId={user?.id || ''}
          reservationId={ratingItem.id}
          onSubmitted={handleRatingSubmitted}
        />
      )}

      {/* Date Picker Dialog for Rejoin */}
      <Dialog open={dateDialogOpen} onOpenChange={(open) => { setDateDialogOpen(open); if (!open) { setPendingRejoinItem(null); setSelectedDate(undefined); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              {t('reserveForDate')}
            </DialogTitle>
            <DialogDescription className="sr-only">{t('selectDate')}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">{t('selectDate')}</p>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-xl border"
              />
            </div>
            <div className="flex gap-2 mt-4 justify-center">
              <Button variant="outline" size="sm" className="rounded-lg h-9" onClick={() => setSelectedDate(undefined)}>
                {t('today')}
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg h-9" onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow);
              }}>
                {t('tomorrow')}
              </Button>
            </div>
            {selectedDate && (
              <div className="mt-3 text-center">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  📅 {t('reservedFor')} {selectedDate.toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => { setDateDialogOpen(false); setPendingRejoinItem(null); setSelectedDate(undefined); }} className="rounded-xl h-10">
              {t('cancel')}
            </Button>
            <Button onClick={confirmRejoin} disabled={joining} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10">
              {joining ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <TicketCheck className="h-4 w-4 me-2" />}
              {t('joinQueue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
