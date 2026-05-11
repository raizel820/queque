'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MapPin,
  QrCode,
  Star,
  ChevronRight,
  Users,
  Briefcase,
  Scale,
  FlaskConical,
  Landmark,
  MoreHorizontal,
  Loader2,
  TicketCheck,
  Clock,
  Heart,
  Building2,
  Zap,
  CalendarDays,
  ArrowLeft,
  Navigation,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { TranslationKeys } from '@/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';

interface AgencyListItem {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  category: string;
  address: string;
  isSponsored: boolean;
  customCode: string;
  isQueueOpen: boolean;
  isPaused: boolean;
  serviceCount: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  avgServiceTime?: number;
}

interface AgencyDetail {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  category: string;
  address: string;
  isSponsored: boolean;
  customCode: string;
  isQueueOpen: boolean;
  isPaused: boolean;
  currentServingNumber: number;
  lastIssuedNumber: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  avgServiceTime?: number;
  services: { id: string; name: string; nameAr?: string; nameFr?: string; waitingCount: number }[];
}

const categoryKeys: { key: TranslationKeys; value: string; icon: React.ElementType }[] = [
  { key: 'catAll', value: 'ALL', icon: MoreHorizontal },
  { key: 'catClinic', value: 'CLINIC', icon: Briefcase },
  { key: 'catAgency', value: 'AGENCY', icon: Briefcase },
  { key: 'catLawFirm', value: 'LAW_FIRM', icon: Scale },
  { key: 'catLaboratory', value: 'LABORATORY', icon: FlaskConical },
  { key: 'catGovernment', value: 'GOVERNMENT', icon: Landmark },
  { key: 'catOther', value: 'OTHER', icon: MoreHorizontal },
];

export function CustomerHome() {
  const { setView, user } = useAppStore();
  const { t, lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [agencies, setAgencies] = useState<AgencyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyCode, setAgencyCode] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<AgencyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [togglingFav, setTogglingFav] = useState<string | null>(null);

  // Date picker state
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [pendingJoin, setPendingJoin] = useState<{ agencyId: string; serviceId?: string } | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchFavorites = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/favorites?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds(new Set((data.favorites ?? []).map((f: { agencyId: string }) => f.agencyId)));
      }
    } catch {
      toast.error(t('error'));
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agencies');
      if (res.ok) {
        const data = await res.json();
        setAgencies(data.agencies ?? []);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredAgencies = useMemo(() => {
    return agencies.filter((a) => {
      const matchCategory = selectedCategory === 'ALL' || a.category.toUpperCase() === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        a.name.toLowerCase().includes(query) ||
        a.nameAr?.includes(query) ||
        a.nameFr?.toLowerCase().includes(query) ||
        a.address.toLowerCase().includes(query) ||
        a.customCode.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [agencies, selectedCategory, searchQuery]);

  const fetchAgencyDetail = async (code: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/agencies/code/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.agency) {
          setSelectedAgency(data.agency as AgencyDetail);
        } else {
          toast.error(data.error || t('noData'));
        }
      } else {
        toast.error(t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!agencyCode.trim()) return;
    const code = agencyCode.trim();
    setAgencyCode('');
    // Directly fetch agency detail from API (works even if agency not in loaded list)
    await fetchAgencyDetail(code);
  };

  const handleSelectAgency = async (agency: AgencyListItem) => {
    await fetchAgencyDetail(agency.customCode);
  };

  // Quick join: go straight to date picker without showing agency detail
  const handleQuickJoin = (agencyId: string, serviceId?: string) => {
    if (!user?.id) {
      toast.error(t('error'));
      return;
    }
    setPendingJoin({ agencyId, serviceId });
    setSelectedDate(undefined);
    setDateDialogOpen(true);
  };

  const getTotalWaiting = () => {
    if (!selectedAgency) return 0;
    return selectedAgency.services.reduce((sum, s) => sum + (s.waitingCount || 0), 0);
  };

  const handleJoinQueue = (agencyId: string, serviceId?: string) => {
    // Auth guard — must be logged in as a customer
    if (!user?.id) {
      toast.error(t('error'));
      return;
    }
    // Open date picker dialog instead of joining directly
    setPendingJoin({ agencyId, serviceId });
    setSelectedDate(undefined); // Reset to default (today)
    setDateDialogOpen(true);
  };

  const confirmJoinQueue = async () => {
    if (!user?.id) {
      toast.error(t('error'));
      setDateDialogOpen(false);
      setPendingJoin(null);
      return;
    }
    if (!pendingJoin) return;
    setJoining(true);
    try {
      const body: Record<string, string> = { userId: user.id, agencyId: pendingJoin.agencyId };
      if (pendingJoin.serviceId) body.serviceId = pendingJoin.serviceId;
      // Add reserved date if selected (not today)
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
        setSelectedAgency(null);
        setDateDialogOpen(false);
        setPendingJoin(null);
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

  const getAgencyName = (a: AgencyListItem | AgencyDetail) => {
    if (lang === 'ar' && a.nameAr) return a.nameAr;
    if (lang === 'fr' && a.nameFr) return a.nameFr;
    return a.name;
  };

  const getCategoryLabel = (cat: string) => {
    const found = categoryKeys.find((c) => c.value === cat.toUpperCase());
    return found ? t(found.key) : cat;
  };

  const getCategoryValue = (cat: string) => cat.toUpperCase();

  const toggleFavorite = async (e: React.MouseEvent, agencyId: string) => {
    e.stopPropagation();
    if (!user?.id) return;
    setTogglingFav(agencyId);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, agencyId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (data.favorited) next.add(agencyId);
          else next.delete(agencyId);
          return next;
        });
        toast.success(data.favorited ? t('favoriteAgency') : t('unfavoriteAgency'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setTogglingFav(null);
    }
  };

  const isOpenNow = (start: string, end: string) => {
    if (!start || !end) return null;
    const now = new Date();
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= sh * 60 + sm && cur < eh * 60 + em;
  };

  const dateDialogContent = (
    <Dialog open={dateDialogOpen} onOpenChange={(open) => { setDateDialogOpen(open); if (!open) { setPendingJoin(null); setSelectedDate(undefined); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            {t('reserveForDate')}
          </DialogTitle>
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
          {/* Quick date buttons */}
          <div className="flex gap-2 mt-4 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9"
              onClick={() => setSelectedDate(undefined)}
            >
              {t('today')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow);
              }}
            >
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
          <Button variant="outline" onClick={() => { setDateDialogOpen(false); setPendingJoin(null); setSelectedDate(undefined); }} className="rounded-xl h-10">
            {t('cancel')}
          </Button>
          <Button
            onClick={confirmJoinQueue}
            disabled={joining}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10"
          >
            {joining ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <TicketCheck className="h-4 w-4 me-2" />}
            {t('joinQueue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Agency Detail View
  if (loadingDetail) {
    return (
      <>
        <div className="px-4 py-4 pb-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
        {dateDialogContent}
      </>
    );
  }

  if (selectedAgency) {
    const totalWaiting = getTotalWaiting();
    const estWait = totalWaiting * (selectedAgency.avgServiceTime || 10);
    return (
      <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-4 py-4 pb-24"
      >
        <button
          onClick={() => setSelectedAgency(null)}
          className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-4 flex items-center gap-1 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('back')}
        </button>

        <Card className="shadow-lg border-0 mb-4 overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <CardContent className="p-4 -mt-10">
            <div className="h-16 w-16 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center mb-3 border-4 border-white dark:border-gray-800">
              <TicketCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              {getAgencyName(selectedAgency)}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4" />
              <span>{selectedAgency.address}</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(selectedAgency.category)}
              </Badge>
              <Badge
                variant="outline"
                className={
                  selectedAgency.isQueueOpen && !selectedAgency.isPaused
                    ? 'text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                    : 'text-xs bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                }
              >
                {selectedAgency.isPaused ? t('paused') : selectedAgency.isQueueOpen ? t('openNow') : t('closed')}
              </Badge>
              {selectedAgency.workingHoursStart && selectedAgency.workingHoursEnd && (() => {
                const open = isOpenNow(selectedAgency.workingHoursStart, selectedAgency.workingHoursEnd);
                return (
                  <Badge
                    variant="outline"
                    className={
                      open
                        ? 'text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                        : 'text-[10px] bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                    }
                  >
                    <Clock className="h-2.5 w-2.5 me-1" />
                    {open
                      ? `${t('openUntil')} ${selectedAgency.workingHoursEnd}`
                      : selectedAgency.isPaused
                        ? t('paused')
                        : `${t('closedNow')} · ${t('openFrom')} ${selectedAgency.workingHoursStart}`
                    }
                  </Badge>
                );
              })()}
            </div>

            {/* Queue Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">{t('currentlyWaiting')}</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {totalWaiting}
                </p>
              </div>
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-teal-600" />
                  <span className="text-xs text-muted-foreground">{t('avgWaitTime')}</span>
                </div>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                  ~{estWait} {t('min')}
                </p>
              </div>
            </div>

            {/* Services */}
            {selectedAgency.services.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-foreground mb-3">{t('selectService')}</h3>
                <div className="space-y-2">
                  {selectedAgency.services.map((svc) => (
                    <motion.button
                      key={svc.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleJoinQueue(selectedAgency.id, svc.id)}
                      disabled={selectedAgency.isPaused || !selectedAgency.isQueueOpen}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {lang === 'ar' && svc.nameAr ? svc.nameAr : lang === 'fr' && svc.nameFr ? svc.nameFr : svc.name}
                        </span>
                        {svc.waitingCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {svc.waitingCount} {t('waiting')}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Join Queue (no services) */}
            {selectedAgency.services.length === 0 && (
              <Button
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl"
                onClick={() => handleJoinQueue(selectedAgency.id)}
                disabled={selectedAgency.isPaused || !selectedAgency.isQueueOpen}
              >
                {selectedAgency.isQueueOpen ? t('joinQueue') : t('closed')}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {dateDialogContent}
      </>
    );
  }

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('home')}</h1>
        <p className="text-sm text-muted-foreground">{t('welcomeSubtitle')}</p>
      </div>

      {/* Quick Stats Banner — Glass-morphism */}
      {!loading && agencies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {(() => {
              const openAgencies = agencies.filter((a) => a.isQueueOpen);
              const totalServices = agencies.reduce((sum, a) => sum + a.serviceCount, 0);
              const avgWait = openAgencies.length > 0
                ? Math.round(openAgencies.reduce((sum, a) => sum + a.serviceCount, 0) / openAgencies.length * 8)
                : 0;
              return (
                <>
                  <div className="flex-shrink-0 min-w-[130px] rounded-2xl px-4 py-3 border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-xl font-bold text-foreground">{agencies.length}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{t('totalAgencies')}</p>
                  </div>
                  <div className="flex-shrink-0 min-w-[130px] rounded-2xl px-4 py-3 border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-xl font-bold text-foreground">{openAgencies.length}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{t('activeQueues')}</p>
                  </div>
                  <div className="flex-shrink-0 min-w-[130px] rounded-2xl px-4 py-3 border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-xl font-bold text-foreground">~{avgWait}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{t('avgWaitTime')}</p>
                  </div>
                  <div className="flex-shrink-0 min-w-[130px] rounded-2xl px-4 py-3 border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                        <TicketCheck className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="text-xl font-bold text-foreground">{totalServices}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{t('services')}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t('searchAgency')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-11 h-12 text-base rounded-xl bg-white dark:bg-gray-900/80 shadow-sm border-gray-200 dark:border-gray-800 dark:backdrop-blur-sm"
        />
      </div>

      {/* Agency Code Input */}
      <div className="flex gap-2 mb-5">
        <Input
          placeholder={t('enterAgencyCode')}
          value={agencyCode}
          onChange={(e) => setAgencyCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
          className="h-11 text-sm rounded-xl"
          dir="ltr"
        />
        <Button
          variant="outline"
          className="h-11 px-4 rounded-xl border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          onClick={handleJoinByCode}
        >
          <QrCode className="h-4 w-4 me-1.5" />
          {t('joinQueue')}
        </Button>
      </div>

      {/* Nearby Agencies Section */}
      {!loading && agencies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {t('nearbyAgencies')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {(() => {
              // Sort by address (simulate proximity)
              const sorted = [...agencies]
                .filter((a) => a.isQueueOpen && !a.isPaused)
                .sort((a, b) => (a.address || '').localeCompare(b.address || ''))
                .slice(0, 3);
              return sorted.map((agency, idx) => (
                <motion.button
                  key={agency.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-shrink-0 min-w-[180px] rounded-2xl border border-border bg-white dark:bg-gray-900/80 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 p-3 text-start"
                  onClick={() => handleSelectAgency(agency)}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                      <Navigation className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{getAgencyName(agency)}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{agency.address}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <MapPin className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          {(idx + 1) * 0.5 + (idx * 0.3)} km
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ));
            })()}
          </div>
        </motion.div>
      )}

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
        {categoryKeys.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all min-h-9 active:scale-95 ${
                selectedCategory === cat.value
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25'
                  : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(cat.key)}
            </button>
          );
        })}
      </div>

      {/* Agency Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl">
              <Skeleton className="h-40 rounded-2xl skeleton-shimmer" />
              <div className="absolute inset-0 shimmer rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filteredAgencies.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgencies.map((agency, idx) => (
            <motion.div
              key={agency.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card
                className="h-full cursor-pointer border-0 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 hover:-translate-y-0.5 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50"
                onClick={() => handleSelectAgency(agency)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors duration-300">
                      <TicketCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {agency.isSponsored && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 text-[10px] px-1.5">
                          <Star className="h-2.5 w-2.5 me-0.5" />
                          {t('sponsored')}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          !agency.isQueueOpen || agency.isPaused
                            ? 'text-[10px] bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                            : 'text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                        }
                      >
                        {agency.isPaused ? t('paused') : agency.isQueueOpen ? t('openNow') : t('closed')}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {getAgencyName(agency)}
                  </h3>

                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {agency.address}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <Badge variant="secondary" className="text-[10px]">
                      {getCategoryLabel(agency.category)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {/* Heart favorite button */}
                      <button
                        onClick={(e) => toggleFavorite(e, agency.id)}
                        disabled={togglingFav === agency.id}
                        className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        {togglingFav === agency.id ? (
                          <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                        ) : favoriteIds.has(agency.id) ? (
                          <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                        ) : (
                          <Heart className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                        )}
                      </button>
                      {/* Quick Join button for single-service agencies */}
                      {agency.isQueueOpen && !agency.isPaused && agency.serviceCount === 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuickJoin(agency.id); }}
                          className="h-7 px-2.5 rounded-full flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-medium hover:bg-emerald-600 transition-colors"
                        >
                          <Zap className="h-3 w-3" />
                          {t('joinQueue')}
                        </button>
                      )}
                      {/* Mini waiting count badge */}
                      {agency.isQueueOpen && agency.serviceCount > 1 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.05 + 0.3 }}
                          className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                          />
                          {agency.serviceCount} {t('services')}
                        </motion.div>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Date Picker Dialog */}
      {dateDialogContent}
    </div>
  );
}
