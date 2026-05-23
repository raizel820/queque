'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  PhoneCall,
  UserCheck,
  UserX,
  XCircle,
  RefreshCw,
  Loader2,
  Radio,
  Layers,
  Activity,
  UserPlus,
  Volume2,
  CircleCheckBig,
  Ban,
  Rss,
  CheckSquare,
  Square,
  X,
  Megaphone,
  Download,
  Plus,
  Trash2,
  Star,
  AlertTriangle,
  ChevronDown,
  BarChart3,
  QrCode,
  Lock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRef } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WaitTimeChart } from '@/components/agency/wait-time-chart';
import { RatingDistribution } from '@/components/agency/rating-distribution';
import QRCode from 'qrcode';

// ─── Interfaces ──────────────────────────────────
interface QueueEntry {
  id: string;
  queueNumber: string;
  customerName: string;
  serviceName: string;
  serviceNameAr?: string;
  serviceNameFr?: string;
  joinedAt: string;
  status: string;
  position: number;
  isWalkIn?: boolean;
  walkInCustomerName?: string;
  preferredTime?: string;
  fixedTimeEnabled?: boolean;
  postponeCount?: number;
}

interface DashboardStats {
  todayReservations: number;
  currentlyWaiting: number;
  servedToday: number;
  avgWaitTime: number;
  currentQueueNumber: string;
  isPaused: boolean;
  noShowCount?: number;
  cancelledCount?: number;
  peakHour?: string;
  avgRating?: number;
  totalRatings?: number;
  noShowRate?: number;
  hourlyWaitTime?: number[];
  ratingDistribution?: number[];
  subscriptionStatus?: string;
}

interface ServiceStat {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  waitingCount: number;
  completedCount: number;
  _count?: { waiting: number; completed: number };
}

interface ActivityEvent {
  id: string;
  eventType: string;
  eventKey: string;
  customerName: string;
  queueNumber: string;
  timestamp: string;
  serviceName?: string;
}

// ─── Helpers ─────────────────────────────────────
function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();
    let rafId: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafId = requestAnimationFrame(animate);
      else prevValue.current = end;
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);
  return <>{display}</>;
}

function MiniSparkline({ data, color = 'bg-emerald-400' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-7">
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(val / max) * 100}%` }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className={`flex-1 rounded-sm ${color} min-h-[2px]`}
        />
      ))}
    </div>
  );
}

function getEventConfig(eventType: string) {
  switch (eventType) {
    case 'joined':
      return { icon: UserPlus, color: 'bg-emerald-500', dotColor: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Joined' };
    case 'called':
      return { icon: Volume2, color: 'bg-sky-500', dotColor: 'bg-sky-500', badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', label: 'Called' };
    case 'completed':
      return { icon: CircleCheckBig, color: 'bg-gray-400', dotColor: 'bg-gray-400', badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Done' };
    case 'cancelled':
      return { icon: Ban, color: 'bg-red-500', dotColor: 'bg-red-500', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Cancelled' };
    default:
      return { icon: Activity, color: 'bg-gray-400', dotColor: 'bg-gray-400', badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Action' };
  }
}

function UserAvatar({ name, colorClass }: { name: string; colorClass: string }) {
  const initials = name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`h-7 w-7 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
      <span className="text-[10px] font-bold text-white">{initials || '?'}</span>
    </div>
  );
}

// ─── Main Dashboard Component ───────────────────
export function AgencyDashboard() {
  const { user, setView } = useAppStore();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [waitingList, setWaitingList] = useState<QueueEntry[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; message: string; createdAt: string; type?: string }>>([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [serviceAnalytics, setServiceAnalytics] = useState<Array<{
    serviceId: string; serviceName: string; serviceNameAr?: string; serviceNameFr?: string;
    avgWaitTime: number; totalServed: number; avgRating: number;
  }>>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [agencyCode, setAgencyCode] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState('');
  const [walkInLoading, setWalkInLoading] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  const agencyId = user?.agencyId || '';

  // ─── Fetch Agency Code ────────────────────────
  const fetchAgencyCode = useCallback(async () => {
    if (!agencyId) return;
    try {
      const res = await fetch(`/api/agency/profile?agencyId=${encodeURIComponent(agencyId)}`);
      if (res.ok) { const data = await res.json(); setAgencyCode(data.code || ''); }
    } catch { /* silent */ }
  }, [agencyId]);

  // ─── Generate QR Code ─────────────────────────
  useEffect(() => {
    if (!agencyCode) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://queuewise.dz';
    QRCode.toDataURL(`${baseUrl}/?code=${agencyCode}`, {
      width: 256, margin: 2, color: { dark: '#047857', light: '#ffffff' }, errorCorrectionLevel: 'M',
    }).then((url) => setQrCodeDataUrl(url)).catch(() => {});
  }, [agencyCode]);

  // ─── Fetch Data ───────────────────────────────
  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    try {
      const [statsRes, listRes, servicesRes, activityRes] = await Promise.all([
        fetch(`/api/agency/stats?agencyId=${encodeURIComponent(agencyId)}`),
        fetch(`/api/agency/queue?agencyId=${encodeURIComponent(agencyId)}&status=WAITING,CALLED`),
        fetch(`/api/agency/services?agencyId=${encodeURIComponent(agencyId)}`),
        fetch(`/api/agency/activity?agencyId=${encodeURIComponent(agencyId)}`),
      ]);
      if (statsRes.ok) { const data = await statsRes.json(); setStats(data); }
      if (listRes.ok) { const data = await listRes.json(); setWaitingList(data.entries ?? []); }
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        if (data.services) setServiceStats(data.services.map((s: ServiceStat) => ({ ...s, waitingCount: s._count?.waiting ?? 0, completedCount: s._count?.completed ?? 0 })));
      }
      if (activityRes.ok) { const data = await activityRes.json(); setActivityEvents(data.events ?? []); }
      setLastUpdated(new Date());
    } catch { toast.error(t('error')); }
    finally { setLoading(false); }
  }, [agencyId, t]);

  // ─── Handlers ─────────────────────────────────
  const handleCallNext = async () => {
    setActionLoading('call');
    try {
      const res = await fetch('/api/agency/queue/call-next', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agencyId }) });
      if (res.ok) { toast.success(t('statusCalled')); fetchData(); }
      else { const data = await res.json(); toast.error(data.details || data.error || t('noQueue')); }
    } catch { toast.error(t('error')); }
    finally { setActionLoading(null); }
  };

  const handleTogglePause = async () => {
    setActionLoading('pause');
    try {
      const res = await fetch('/api/agency/queue/toggle-pause', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agencyId }) });
      if (res.ok) { toast.success(stats?.isPaused ? t('queueResumed') : t('queuePaused')); fetchData(); }
    } catch { toast.error(t('error')); }
    finally { setActionLoading(null); }
  };

  const handleAction = async (entryId: string, action: 'complete' | 'no_show' | 'cancel') => {
    setActionLoading(`${entryId}-${action}`);
    try {
      const res = await fetch(`/api/agency/queue/${entryId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (res.ok) { toast.success(t('success')); fetchData(); }
      else { const data = await res.json(); toast.error(data.error || t('error')); }
    } catch { toast.error(t('error')); }
    finally { setActionLoading(null); }
  };

  const toggleBatchSelection = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleBatchComplete = async () => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id => fetch(`/api/agency/queue/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete' }) }));
      const results = await Promise.allSettled(promises);
      let failedCount = 0;
      for (const r of results) { if (r.status === 'rejected') failedCount++; else if (r.status === 'fulfilled' && !r.value.ok) failedCount++; }
      if (failedCount === 0) toast.success(t('success'));
      else if (failedCount < results.length) toast.warning(t('batchPartialFail') || `${failedCount}/${results.length} actions failed`);
      else toast.error(t('error'));
      setSelectedIds(new Set()); setBatchMode(false); fetchData();
    } catch { toast.error(t('error')); }
    finally { setBatchLoading(false); }
  };

  const exitBatchMode = () => { setBatchMode(false); setSelectedIds(new Set()); };

  const fetchAnnouncements = useCallback(async () => {
    if (!agencyId) return;
    try { const res = await fetch(`/api/agency/announcements?agencyId=${encodeURIComponent(agencyId)}`); if (res.ok) { const data = await res.json(); setAnnouncements(data.announcements ?? []); } } catch {}
  }, [agencyId]);

  useEffect(() => { fetchData(); fetchAnnouncements(); fetchAgencyCode(); const interval = setInterval(fetchData, 10000); return () => clearInterval(interval); }, [fetchData, fetchAnnouncements, fetchAgencyCode, agencyId]);

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim() || !agencyId) return;
    setAnnouncementLoading(true);
    try {
      const res = await fetch(`/api/agency/announcements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agencyId, message: newAnnouncement.trim() }) });
      if (res.ok) { setNewAnnouncement(''); toast.success(t('announcementCreated') || 'Announcement created'); fetchAnnouncements(); }
      else { const data = await res.json(); toast.error(data.error || t('error')); }
    } catch { toast.error(t('error')); }
    finally { setAnnouncementLoading(false); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!agencyId) return;
    try { const res = await fetch(`/api/agency/announcements?id=${id}`, { method: 'DELETE' }); if (res.ok) { toast.success(t('announcementDeleted') || 'Announcement deleted'); fetchAnnouncements(); } } catch { toast.error(t('error')); }
  };

  const fetchServiceAnalytics = useCallback(async () => {
    if (!agencyId) return;
    setAnalyticsLoading(true);
    try { const res = await fetch(`/api/agency/analytics?agencyId=${encodeURIComponent(agencyId)}`); if (res.ok) { const data = await res.json(); setServiceAnalytics(data.services ?? []); } } catch {}
    finally { setAnalyticsLoading(false); }
  }, [agencyId]);

  const handleExportCsv = async () => {
    if (!agencyId) return;
    setExportLoading(true);
    try {
      const res = await fetch(`/api/agency/export-csv?agencyId=${encodeURIComponent(agencyId)}`);
      if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `queuewise-reservations-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url); toast.success(t('exportSuccess')); }
      else toast.error(t('exportFailed'));
    } catch { toast.error(t('error')); }
    finally { setExportLoading(false); }
  };

  const handleAddWalkIn = async () => {
    if (!walkInName.trim() || !agencyId) return;
    setWalkInLoading(true);
    try {
      const body: Record<string, string> = { agencyId, customerName: walkInName.trim() };
      if (walkInServiceId) body.serviceId = walkInServiceId;
      const res = await fetch('/api/agency/queue/walk-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { toast.success(t('walkInCustomerAdded')); setWalkInOpen(false); setWalkInName(''); setWalkInServiceId(''); fetchData(); }
      else { const data = await res.json(); toast.error(data.error || t('error')); }
    } catch { toast.error(t('error')); }
    finally { setWalkInLoading(false); }
  };

  // ─── Helpers ──────────────────────────────────
  const getServiceName = (entry: QueueEntry) => {
    if (lang === 'ar' && entry.serviceNameAr) return entry.serviceNameAr;
    if (lang === 'fr' && entry.serviceNameFr) return entry.serviceNameFr;
    return entry.serviceName;
  };
  const getServiceDisplayName = (s: ServiceStat) => {
    if (lang === 'ar' && s.nameAr) return s.nameAr;
    if (lang === 'fr' && s.nameFr) return s.nameFr;
    return s.name;
  };
  const getAnalyticsServiceName = (s: { serviceName: string; serviceNameAr?: string; serviceNameFr?: string }) => {
    if (lang === 'ar' && s.serviceNameAr) return s.serviceNameAr;
    if (lang === 'fr' && s.serviceNameFr) return s.serviceNameFr;
    return s.serviceName;
  };
  const formatTime = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };
  const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US';

  // ─── Derived State ────────────────────────────
  const served = stats?.servedToday ?? 0;
  const noShows = stats?.noShowCount ?? 0;
  const cancelled = stats?.cancelledCount ?? 0;
  const totalProcessed = served + noShows + cancelled;
  const completionRate = totalProcessed > 0 ? (served / totalProcessed) * 100 : 0;
  const safeCompletionRate = isNaN(completionRate) ? 0 : completionRate;
  const maxWaiting = serviceStats.length > 0 ? Math.max(...serviceStats.map(s => s.waitingCount), 1) : 1;
  const totalToday = stats?.todayReservations ?? 0;
  const queueProgress = totalToday > 0 ? Math.min(((served + noShows + cancelled) / totalToday) * 100, 100) : 0;
  const currentlyServed = useMemo(() => waitingList.find(e => e.status === 'CALLED'), [waitingList]);
  const waitingOnly = useMemo(() => waitingList.filter(e => e.status === 'WAITING'), [waitingList]);
  const avgWait = stats?.avgWaitTime ?? 0;
  const waitLevel = avgWait <= 10 ? 'low' : avgWait <= 25 ? 'medium' : 'high';
  const waitLevelConfig = { low: { label: t('lowWait'), dotColor: 'bg-emerald-300' }, medium: { label: t('mediumWait'), dotColor: 'bg-amber-300' }, high: { label: t('highWait'), dotColor: 'bg-rose-300' } };
  const lastUpdatedStr = useMemo(() => { try { return lastUpdated.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch { return ''; } }, [lastUpdated, locale]);
  const sparkData1 = stats?.todayReservations ? [Math.round(stats.todayReservations * 0.4), Math.round(stats.todayReservations * 0.6), Math.round(stats.todayReservations * 0.5), stats.todayReservations, Math.round(stats.todayReservations * 0.8), stats.todayReservations, Math.round(stats.todayReservations * 0.7)] : [0, 1, 0, 2, 1, 3, 1];
  const sparkData2 = stats?.currentlyWaiting ? [Math.round(stats.currentlyWaiting * 0.5), Math.round(stats.currentlyWaiting * 0.3), stats.currentlyWaiting, Math.round(stats.currentlyWaiting * 0.8), Math.round(stats.currentlyWaiting * 0.6), stats.currentlyWaiting, Math.round(stats.currentlyWaiting * 0.4)] : [0, 1, 2, 1, 0, 1, 0];
  const sparkData3 = stats?.servedToday ? [Math.round(stats.servedToday * 0.3), Math.round(stats.servedToday * 0.5), stats.servedToday, Math.round(stats.servedToday * 0.7), Math.round(stats.servedToday * 0.9), stats.servedToday, Math.round(stats.servedToday * 0.8)] : [0, 0, 1, 0, 2, 1, 0];

  // ─── Loading State ────────────────────────────
  if (loading) {
    return (
      <div className="p-4 lg:p-5 space-y-3">
        <div className="flex items-center justify-between"><Skeleton className="h-7 w-36 rounded-lg" /><div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div></div>
        <Skeleton className="h-32 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl skeleton-shimmer" />))}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"><Skeleton className="h-44 rounded-2xl skeleton-shimmer" /><Skeleton className="h-44 rounded-2xl skeleton-shimmer" /></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-5 space-y-4 relative" ref={sectionRef}>
      <div className="absolute top-0 start-0 end-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full" />

      {/* ─── 1. Subscription Banner ─── */}
      {stats?.subscriptionStatus && stats.subscriptionStatus !== 'ACTIVE' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 p-[2px]">
          <div className="rounded-[14px] bg-gradient-to-r from-amber-50 to-red-50 dark:from-amber-950/50 dark:to-red-950/50 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center flex-shrink-0"><AlertCircle className="h-5 w-5 text-white" /></div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">{t('subscriptionInactive')}</p><p className="text-xs text-amber-700/70 dark:text-amber-300/70 mt-0.5">{t('subscriptionRequired')}</p></div>
            <Button onClick={() => setView('agency-subscription')} className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white rounded-xl h-9 px-4 text-sm font-semibold flex-shrink-0">{t('activatePlan')}</Button>
          </div>
        </motion.div>
      )}

      {/* ─── 2. Welcome Header ─── */}
      <div className="space-y-1">
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="text-sm text-muted-foreground">
          {t('welcomeBack')}, <span className="font-semibold text-foreground">{user?.fullName?.split(' ')[0] || ''}</span> 👋
        </motion.p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            {t('agencyDashboard')}
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block live-pulse" />{t('live')}
            </motion.span>
          </h1>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exportLoading} className="h-8 px-2.5 rounded-lg gap-1 text-xs">
              {exportLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{t('exportCsv') || 'Export'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchData} className="h-8 w-8"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* ─── 3. CURRENTLY SERVING CARD ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-5 sm:py-6">
            {/* Decorative */}
            <div className="absolute top-0 end-0 h-24 w-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 start-0 h-16 w-16 rounded-full bg-white/5 translate-y-6 -translate-x-6" />

            {/* Pulse ring */}
            {!stats?.isPaused && (
              <motion.div className="absolute start-4 top-4 h-3 w-3 rounded-full bg-emerald-300"
                animate={{ boxShadow: ['0 0 0 0 rgba(110, 231, 183, 0.6)', '0 0 0 12px rgba(110, 231, 183, 0)', '0 0 0 0 rgba(110, 231, 183, 0)'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
            )}

            <div className="relative">
              {/* Header row */}
              <div className="flex items-center gap-2 mb-3">
                <Radio className="h-4 w-4 text-emerald-200" />
                <p className="text-emerald-100 text-sm font-semibold">{t('currentlyServing')}</p>
                <Badge className={`text-[9px] px-1.5 py-0 h-4 ${stats?.isPaused ? 'bg-amber-400/30 text-amber-100 border-amber-400/30' : 'bg-emerald-400/30 text-emerald-100 border-emerald-400/30'}`}>
                  {stats?.isPaused ? t('queuePausedLabel') : t('queueActive')}
                </Badge>
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center gap-1 ms-auto">
                  <span className={`h-1.5 w-1.5 rounded-full ${waitLevelConfig[waitLevel].dotColor}`} />
                  <span className="text-[10px] text-emerald-200">{waitLevelConfig[waitLevel].label}</span>
                </motion.div>
              </div>

              {currentlyServed ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Customer info */}
                  <div className="flex items-center gap-4">
                    <motion.div key={currentlyServed.queueNumber} initial={{ y: -10, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="min-h-16 min-w-16 px-3 py-2 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <span className="text-2xl sm:text-3xl font-black text-white ticket-glow">{currentlyServed.queueNumber}</span>
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">{currentlyServed.customerName}</h2>
                        {currentlyServed.isWalkIn && <Badge className="bg-amber-400/30 text-amber-100 border-amber-400/30 text-[10px] px-1.5 py-0 h-5">{t('walkInBadge')}</Badge>}
                      </div>
                      <p className="text-sm text-emerald-200 mt-0.5">{getServiceName(currentlyServed)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-emerald-300" />
                        <span className="text-xs text-emerald-200/80">{t('calledAt')} {formatTime(currentlyServed.joinedAt)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => handleAction(currentlyServed.id, 'complete')} disabled={!!actionLoading} className="h-11 px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-900 font-bold text-sm gap-2 shadow-lg shadow-emerald-500/30">
                        {actionLoading === `${currentlyServed.id}-complete` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {t('completeService')}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => handleAction(currentlyServed.id, 'no_show')} disabled={!!actionLoading} variant="outline" className="h-11 px-4 rounded-xl border-2 border-amber-300 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 font-semibold text-sm gap-2">
                        {actionLoading === `${currentlyServed.id}-no_show` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                        {t('markNoShow')}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => handleAction(currentlyServed.id, 'cancel')} disabled={!!actionLoading} variant="outline" className="h-11 px-3 rounded-xl border-2 border-red-400/50 bg-red-500/10 text-red-200 hover:bg-red-500/20 text-sm gap-1.5">
                        {actionLoading === `${currentlyServed.id}-cancel` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        <span className="hidden sm:inline">{t('cancelRes')}</span>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 border-dashed">
                      <span className="text-3xl font-black text-white/40">—</span>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-white/80">{t('noCustomerBeingServed')}</h2>
                      <p className="text-sm text-emerald-200/60 mt-0.5">
                        {waitingOnly.length > 0 ? `${waitingOnly.length} ${t('waitingLabel')} · ${t('nextUp')}: ${waitingOnly[0]?.queueNumber || ''}` : t('noQueue')}
                      </p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={handleCallNext} disabled={actionLoading === 'call' || stats?.isPaused || (stats?.subscriptionStatus !== undefined && stats.subscriptionStatus !== 'ACTIVE')} className="h-12 px-6 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-900 font-bold text-sm gap-2 shadow-lg shadow-emerald-500/30">
                      {actionLoading === 'call' ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneCall className="h-5 w-5" />}
                      {t('callNext')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-4 max-w-full">
                <div className="flex items-center justify-between text-[10px] text-emerald-200/70 mb-1">
                  <span>{t('queueProgress')}</span><span>{Math.round(queueProgress)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${queueProgress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300" />
                </div>
                <div className="flex items-center justify-between text-[9px] text-emerald-200/50 mt-1">
                  <span>{served} {t('servedLabel')}</span>
                  <div className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    {t('autoRefreshActive')}
                    <span className="ms-1">{t('lastRefreshed')}: {lastUpdatedStr}</span>
                  </div>
                  <span>{stats?.currentlyWaiting ?? 0} {t('waitingLabel')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── 4. Quick Actions Bar ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <div className="flex flex-wrap gap-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={handleCallNext} disabled={actionLoading === 'call' || stats?.isPaused || (stats?.subscriptionStatus !== undefined && stats.subscriptionStatus !== 'ACTIVE')} className="h-11 px-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-semibold shadow-lg shadow-emerald-500/20 gap-2 disabled:opacity-50">
              {actionLoading === 'call' ? <Loader2 className="h-4 w-4 animate-spin" /> : stats?.subscriptionStatus !== undefined && stats.subscriptionStatus !== 'ACTIVE' ? <Lock className="h-4 w-4" /> : <PhoneCall className="h-4 w-4" />}
              <span className="text-sm">{t('callNext')}</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={handleTogglePause} disabled={actionLoading === 'pause'} variant="outline" className={`h-11 px-4 rounded-xl font-semibold gap-2 border-2 ${stats?.isPaused ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100' : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-100'}`}>
              {actionLoading === 'pause' ? <Loader2 className="h-4 w-4 animate-spin" /> : stats?.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span className="text-sm">{stats?.isPaused ? t('resumeQueue') : t('pauseQueue')}</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={() => setWalkInOpen(true)} variant="outline" className="h-11 px-4 rounded-xl font-semibold gap-2 border-2 border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100">
              <UserPlus className="h-4 w-4" /><span className="text-sm">{t('addWalkInCustomer')}</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={() => setShowQrModal(true)} variant="outline" className="h-11 px-4 rounded-xl font-semibold gap-2 border-2 border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-900/20 dark:text-teal-400 hover:bg-teal-100">
              <QrCode className="h-4 w-4" /><span className="text-sm">{t('viewQrCode')}</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={() => { const event = new CustomEvent('navigate', { detail: 'services' }); window.dispatchEvent(event); }} variant="outline" className="h-11 px-3 rounded-xl font-semibold gap-1.5 border-2 border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-400 hover:bg-sky-100">
              <Plus className="h-4 w-4" /><span className="text-sm hidden sm:inline">{t('addService')}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ─── 5. Stats Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 text-white shadow-lg shadow-emerald-500/15">
            <div className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-emerald-400/30 blur-lg" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1"><div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center"><Users className="h-3 w-3 text-emerald-100" /></div><span className="text-[9px] text-emerald-200 font-medium">{t('totalToday')}</span></div>
                <p className="text-xl sm:text-2xl font-black leading-none"><AnimatedCounter value={stats?.todayReservations ?? 0} /></p>
              </div>
              <MiniSparkline data={sparkData1} color="bg-emerald-300" />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-3 text-white shadow-lg shadow-amber-500/15">
            <div className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-amber-400/30 blur-lg" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1"><div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center"><Clock className="h-3 w-3 text-amber-100" /></div><span className="text-[9px] text-amber-200 font-medium">{t('queueLengthShort')}</span></div>
                <p className="text-xl sm:text-2xl font-black leading-none"><AnimatedCounter value={stats?.currentlyWaiting ?? 0} /></p>
              </div>
              <MiniSparkline data={sparkData2} color="bg-amber-300" />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-3 text-white shadow-lg shadow-teal-500/15">
            <div className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-teal-400/30 blur-lg" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1"><div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-teal-100" /></div><span className="text-[9px] text-teal-200 font-medium">{t('customersServed')}</span></div>
                <p className="text-xl sm:text-2xl font-black leading-none"><AnimatedCounter value={stats?.servedToday ?? 0} /></p>
              </div>
              <MiniSparkline data={sparkData3} color="bg-teal-300" />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-3 text-white shadow-lg shadow-rose-500/15">
            <div className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-rose-400/30 blur-lg" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1"><div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center"><AlertTriangle className="h-3 w-3 text-rose-100" /></div><span className="text-[9px] text-rose-200 font-medium">{t('noShowShort')}</span></div>
                <p className="text-xl sm:text-2xl font-black leading-none"><AnimatedCounter value={stats?.noShowRate ?? 0} /><span className="text-sm font-semibold ms-0.5">%</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-rose-200/60">{t('completionRateStat')}</p>
                <p className="text-sm font-bold">{safeCompletionRate.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── 6. Main Content: Waiting Queue + Activity Feed ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* LEFT: Waiting Queue */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  {t('waitingQueue')}
                  <Badge variant="secondary" className="text-xs">{waitingOnly.length}</Badge>
                </CardTitle>
                <Button variant={batchMode ? 'default' : 'outline'} size="sm" className={batchMode ? 'h-7 px-2.5 rounded-lg gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs' : 'h-7 px-2.5 rounded-lg gap-1 text-xs'} onClick={() => batchMode ? exitBatchMode() : setBatchMode(true)}>
                  {batchMode ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}{batchMode ? t('exitBatchMode') : t('batchMode')}
                </Button>
              </div>
              {batchMode && selectedIds.size > 0 && <p className="text-xs text-muted-foreground mt-1">{t('selectTickets')} · {selectedIds.size} {t('selected')}</p>}
            </CardHeader>
            <CardContent className="pt-0">
              {waitingOnly.length === 0 ? (
                <div className="text-center py-8">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <div className="relative inline-block mb-3">
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.05, 0.1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-emerald-200 dark:bg-emerald-800" />
                      <Users className="h-10 w-10 text-muted-foreground mx-auto relative" />
                    </div>
                  </motion.div>
                  <p className="text-sm font-medium text-foreground mb-1">{t('noQueue')}</p>
                  <p className="text-xs text-muted-foreground">{t('noQueueHint') || 'All customers have been served. Great job!'}</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto custom-scrollbar">
                  {waitingOnly.map((entry, idx) => (
                    <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group ${idx % 2 === 0 ? 'bg-gray-50/80 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900/30'} hover:bg-emerald-50 dark:hover:bg-emerald-900/10`}
                    >
                      <div className="flex items-center gap-2.5">
                        {batchMode && entry.status === 'WAITING' && (
                          <Checkbox checked={selectedIds.has(entry.id)} onCheckedChange={() => toggleBatchSelection(entry.id)} className="h-7 w-7 rounded-lg border-emerald-300 dark:border-emerald-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" aria-label={t('selectTickets')} />
                        )}
                        <div className="min-h-9 min-w-9 px-2 py-1 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">{entry.queueNumber}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-foreground truncate">{entry.customerName}</p>
                            {entry.isWalkIn && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[8px] px-1 py-0 h-4">{t('walkInBadge')}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{getServiceName(entry)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground hidden md:block">{formatTime(entry.joinedAt)}</span>
                        <div className={`flex items-center gap-1 transition-opacity ${batchMode ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => handleAction(entry.id, 'complete')} title={t('markCompleted')} aria-label={t('markCompleted')} disabled={!!actionLoading}><UserCheck className="h-3 w-3" /></Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={() => handleAction(entry.id, 'no_show')} title={t('markNoShow')} aria-label={t('markNoShow')} disabled={!!actionLoading}><UserX className="h-3 w-3" /></Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleAction(entry.id, 'cancel')} title={t('cancelRes')} aria-label={t('markCancelled')} disabled={!!actionLoading}><XCircle className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT: Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Rss className="h-4 w-4 text-emerald-600" />{t('recentActivity')}
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 ms-auto">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />{t('live')}
                </motion.span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activityEvents.length === 0 ? (
                <div className="text-center py-8"><Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">{t('noRecentActivity')}</p></div>
              ) : (
                <div className="relative space-y-0 max-h-96 overflow-y-auto custom-scrollbar">
                  <div className="absolute start-[15px] top-2 bottom-2 w-px bg-border" />
                  {activityEvents.map((event, idx) => {
                    const config = getEventConfig(event.eventType);
                    const Icon = config.icon;
                    const timeAgoStr = (() => {
                      const diff = Math.floor((Date.now() - new Date(event.timestamp).getTime()) / 1000);
                      if (diff < 60) return t('justNow');
                      if (diff < 3600) return `${Math.floor(diff / 60)} ${t('min')}`;
                      if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('hours')}`;
                      return `${Math.floor(diff / 86400)} ${t('date')}`;
                    })();
                    const label = (t(event.eventKey as 'customerJoinedQueue') || event.eventKey).replace('{name}', event.customerName);
                    return (
                      <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className="relative flex items-start gap-3 pb-3.5 last:pb-0">
                        <div className={`h-[28px] w-[28px] rounded-full ${config.dotColor} flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-white dark:ring-gray-900`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap"><p className="text-xs text-foreground leading-snug">{label}</p><Badge className={`text-[8px] px-1.5 py-0 h-4 ${config.badgeClass}`}>{config.label}</Badge></div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            <span className="font-mono">#{event.queueNumber}</span>
                            {event.serviceName && <span>· {event.serviceName}</span>}
                            <span>· {timeAgoStr}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── 7. Service Breakdown ─── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />{t('serviceBreakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {serviceStats.length === 0 ? (
              <div className="text-center py-4"><Layers className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">{t('noServiceData')}</p></div>
            ) : (
              <div className="space-y-2.5">
                {serviceStats.map((service, idx) => {
                  const barWidth = maxWaiting > 0 ? (service.waitingCount / maxWaiting) * 100 : 0;
                  const completionPct = (service.waitingCount + service.completedCount) > 0 ? (service.completedCount / (service.waitingCount + service.completedCount)) * 100 : 0;
                  return (
                    <div key={service.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground truncate max-w-[60%]">{getServiceDisplayName(service)}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{service.waitingCount} {t('waiting')}</span>
                          <span className="text-xs opacity-60">{Math.round(completionPct)}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(barWidth, 2)}%` }} transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 8. Service Analytics (Collapsible) ─── */}
      <Collapsible open={analyticsOpen} onOpenChange={(open) => { setAnalyticsOpen(open); if (open) fetchServiceAnalytics(); }}>
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-t-xl transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />{t('serviceAnalytics')}
                  <Badge variant="secondary" className="text-[10px] px-1.5">{t('last7Days')}</Badge>
                </CardTitle>
                <motion.div animate={{ rotate: analyticsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="h-4 w-4 text-muted-foreground" /></motion.div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('serviceAnalyticsDesc')}</p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : serviceAnalytics.length === 0 ? (
                <div className="text-center py-6"><BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">{t('noAnalyticsForPeriod')}</p></div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-start py-2.5 px-3 text-xs font-semibold text-muted-foreground">{t('serviceName')}</th>
                      <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">{t('avgWaitTimePerService')}</th>
                      <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">{t('totalServed')}</th>
                      <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">{t('avgRatingPerService')}</th>
                    </tr></thead>
                    <tbody>
                      {serviceAnalytics.map((s, idx) => (
                        <tr key={s.serviceId} className={idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}>
                          <td className="py-2.5 px-3 font-medium text-foreground">{getAnalyticsServiceName(s)}</td>
                          <td className="py-2.5 px-3 text-center"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" /><span className="font-semibold text-amber-700 dark:text-amber-400">{s.avgWaitTime ?? 0} {t('min')}</span></span></td>
                          <td className="py-2.5 px-3 text-center"><span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-emerald-500" /><span className="font-semibold">{s.totalServed ?? 0}</span></span></td>
                          <td className="py-2.5 px-3 text-center"><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /><span className="font-semibold">{(s.avgRating ?? 0) > 0 ? (s.avgRating ?? 0).toFixed(1) : '—'}</span></span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── Wait Time Chart + Rating Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
          <WaitTimeChart data={stats?.hourlyWaitTime ?? []} currentHour={new Date().getHours()} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
          <RatingDistribution ratings={stats?.ratingDistribution ?? []} />
        </motion.div>
      </div>

      {/* ─── 9. Announcements ─── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-emerald-600" />{t('announcements')}
              <Badge variant="secondary" className="text-xs">{announcements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex gap-2">
              <Textarea value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)} placeholder={t('announcementPlaceholder') || 'Write an announcement...'} className="min-h-[50px] text-sm rounded-xl border-border resize-none" rows={2} />
              <Button size="sm" onClick={handleCreateAnnouncement} disabled={!newAnnouncement.trim() || announcementLoading} className="self-end h-9 px-3 rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                {announcementLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {announcements.length === 0 ? (
              <div className="text-center py-3"><Megaphone className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" /><p className="text-sm text-muted-foreground">{t('noAnnouncements')}</p></div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {announcements.map((a) => (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/20 group">
                      <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5"><Megaphone className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm text-foreground leading-relaxed">{a.message}</p><p className="text-[10px] text-muted-foreground mt-0.5">{new Date(a.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => handleDeleteAnnouncement(a.id)}><Trash2 className="h-3 w-3" /></Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── QR Code Modal ─── */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowQrModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><QrCode className="h-5 w-5 text-emerald-600" />{t('qrCodeAgency')}</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowQrModal(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-col items-center justify-center">
                {qrCodeDataUrl ? (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl bg-white shadow-inner border border-gray-100">
                    <img src={qrCodeDataUrl} alt={t('qrCodeAgency')} className="h-48 w-48 sm:h-56 sm:w-56" />
                  </motion.div>
                ) : (
                  <div className="h-48 w-48 sm:h-56 sm:w-56 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                )}
                {agencyCode && (
                  <div className="mt-4 text-center">
                    <Badge variant="secondary" className="text-sm font-mono px-4 py-1.5">{agencyCode}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">{t('qrCodeScanHint')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating Batch Action Bar ─── */}
      <AnimatePresence>
        {batchMode && selectedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="fixed bottom-20 inset-x-4 z-50 lg:inset-x-auto lg:bottom-6 lg:start-auto lg:end-6 lg:w-80">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl shadow-emerald-500/30">
              <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{t('completeSelected')} ({selectedIds.size})</p><p className="text-[10px] text-emerald-200">{t('selectTickets')}</p></div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl h-9 px-4 text-xs gap-1.5" onClick={handleBatchComplete} disabled={batchLoading}>{batchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}{t('markCompleted')}</Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl" onClick={exitBatchMode}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Walk-in Customer Dialog ─── */}
      <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-rose-600" />{t('addWalkInCustomer')}</DialogTitle>
            <DialogDescription>{lang === 'ar' ? 'إضافة زائر إلى الطابور بدون حساب' : lang === 'fr' ? 'Ajouter un client à la file sans compte' : 'Add a walk-in customer to the queue without an account'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">{t('walkInCustomerName')}</Label>
              <Input value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder={lang === 'ar' ? 'أدخل اسم الزائر' : lang === 'fr' ? 'Nom du client' : 'Customer name'} className="rounded-xl" onKeyDown={(e) => { if (e.key === 'Enter') handleAddWalkIn(); }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">{t('selectService')}</Label>
              <select value={walkInServiceId} onChange={(e) => setWalkInServiceId(e.target.value)} className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                <option value="">{t('all')}</option>
                {serviceStats.map((s) => (<option key={s.id} value={s.id}>{getServiceDisplayName(s)}</option>))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalkInOpen(false)} className="rounded-xl">{t('cancel')}</Button>
            <Button onClick={handleAddWalkIn} disabled={!walkInName.trim() || walkInLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
              {walkInLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {t('addWalkInCustomer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
