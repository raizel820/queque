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
  Zap,
  Eye,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRef } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WaitTimeChart } from '@/components/agency/wait-time-chart';
import { RatingDistribution } from '@/components/agency/rating-distribution';
import QRCode from 'qrcode';

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

// ─── Animated Number Counter ───────────────────
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
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  return <>{display}</>;
}

// ─── Mini Sparkline ─────────────────────────────
function MiniSparkline({ data, color = 'bg-emerald-400' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
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

// ─── Activity Event ─────────────────────────────
interface ActivityEvent {
  id: string;
  eventType: string;
  eventKey: string;
  customerName: string;
  queueNumber: string;
  timestamp: string;
  serviceName?: string;
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

// ─── Circular Progress ──────────────────────────
function CircularProgress({ value, size = 80, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value > 80 ? '#10b981' : value > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">{Math.round(value)}%</span>
      </div>
    </div>
  );
}

// ─── User Initials Avatar ───────────────────────
function UserAvatar({ name, colorClass }: { name: string; colorClass: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
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
    serviceId: string;
    serviceName: string;
    serviceNameAr?: string;
    serviceNameFr?: string;
    avgWaitTime: number;
    totalServed: number;
    avgRating: number;
  }>>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [agencyCode, setAgencyCode] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });
  const agencyId = user?.agencyId || '';

  // Fetch agency profile for QR code
  const fetchAgencyCode = useCallback(async () => {
    if (!agencyId) return;
    try {
      const res = await fetch(`/api/agency/profile?agencyId=${encodeURIComponent(agencyId)}`);
      if (res.ok) {
        const data = await res.json();
        setAgencyCode(data.code || '');
      }
    } catch { /* silent */ }
  }, [agencyId]);

  // Generate QR code client-side
  useEffect(() => {
    if (!agencyCode) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://queuewise.dz';
    const qrData = `${baseUrl}/?code=${agencyCode}`;
    QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: { dark: '#047857', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => { /* silent */ });
  }, [agencyCode]);

  const fetchData = useCallback(async () => {
    if (!agencyId) return;
    try {
      const [statsRes, listRes, servicesRes, activityRes] = await Promise.all([
        fetch(`/api/agency/stats?agencyId=${encodeURIComponent(agencyId)}`),
        fetch(`/api/agency/queue?agencyId=${encodeURIComponent(agencyId)}&status=WAITING,CALLED`),
        fetch(`/api/agency/services?agencyId=${encodeURIComponent(agencyId)}`),
        fetch(`/api/agency/activity?agencyId=${encodeURIComponent(agencyId)}`),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (listRes.ok) {
        const data = await listRes.json();
        setWaitingList(data.entries ?? []);
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        if (data.services) {
          setServiceStats(
            data.services.map((s: ServiceStat) => ({
              ...s,
              waitingCount: s._count?.waiting ?? 0,
              completedCount: s._count?.completed ?? 0,
            }))
          );
        }
      }
      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivityEvents(data.events ?? []);
      }
      setLastUpdated(new Date());
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  const handleCallNext = async () => {
    setActionLoading('call');
    try {
      const res = await fetch('/api/agency/queue/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId }),
      });
      if (res.ok) {
        toast.success(t('statusCalled'));
        fetchData();
      } else {
        const data = await res.json();
        // Show details if available for debugging, otherwise show error or default
        const errorMsg = data.details || data.error || t('noQueue');
        toast.error(errorMsg);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePause = async () => {
    setActionLoading('pause');
    try {
      const res = await fetch('/api/agency/queue/toggle-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId }),
      });
      if (res.ok) {
        toast.success(stats?.isPaused ? t('queueResumed') : t('queuePaused'));
        fetchData();
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (entryId: string, action: 'complete' | 'no_show' | 'cancel') => {
    setActionLoading(`${entryId}-${action}`);
    try {
      const res = await fetch(`/api/agency/queue/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(t('success'));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleBatchSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchComplete = async () => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/agency/queue/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete' }),
        })
      );
      const results = await Promise.allSettled(promises);
      let failedCount = 0;
      for (const r of results) {
        if (r.status === 'rejected') {
          failedCount++;
        } else if (r.status === 'fulfilled' && !r.value.ok) {
          failedCount++;
        }
      }
      if (failedCount === 0) {
        toast.success(t('success'));
      } else if (failedCount < results.length) {
        toast.warning(t('batchPartialFail') || `${failedCount}/${results.length} actions failed, rest succeeded`);
      } else {
        toast.error(t('error'));
      }
      setSelectedIds(new Set());
      setBatchMode(false);
      fetchData();
    } catch {
      toast.error(t('error'));
    } finally {
      setBatchLoading(false);
    }
  };

  const exitBatchMode = () => {
    setBatchMode(false);
    setSelectedIds(new Set());
  };

  const fetchAnnouncements = useCallback(async () => {
    if (!agencyId) return;
    try {
      const res = await fetch(`/api/agency/announcements?agencyId=${encodeURIComponent(agencyId)}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements ?? []);
      }
    } catch { /* silent */ }
  }, [agencyId]);

  useEffect(() => {
    fetchData();
    fetchAnnouncements();
    fetchAgencyCode();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchAnnouncements, fetchAgencyCode, agencyId]);

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim() || !agencyId) return;
    setAnnouncementLoading(true);
    try {
      const res = await fetch(`/api/agency/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, message: newAnnouncement.trim() }),
      });
      if (res.ok) {
        setNewAnnouncement('');
        toast.success(t('announcementCreated') || 'Announcement created');
        fetchAnnouncements();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!agencyId) return;
    try {
      const res = await fetch(`/api/agency/announcements?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(t('announcementDeleted') || 'Announcement deleted');
        fetchAnnouncements();
      }
    } catch {
      toast.error(t('error'));
    }
  };

  const fetchServiceAnalytics = useCallback(async () => {
    if (!agencyId) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/agency/analytics?agencyId=${encodeURIComponent(agencyId)}`);
      if (res.ok) {
        const data = await res.json();
        setServiceAnalytics(data.services ?? []);
      }
    } catch { /* silent */ }
    finally {
      setAnalyticsLoading(false);
    }
  }, [agencyId]);

  const handleExportCsv = async () => {
    if (!agencyId) return;
    setExportLoading(true);
    try {
      const res = await fetch(`/api/agency/export-csv?agencyId=${encodeURIComponent(agencyId)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `queuewise-reservations-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('exportSuccess'));
      } else {
        toast.error(t('exportFailed'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setExportLoading(false);
    }
  };

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
    try {
      return new Date(dateStr).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Calculate completion rate
  const served = stats?.servedToday ?? 0;
  const noShows = stats?.noShowCount ?? 0;
  const cancelled = stats?.cancelledCount ?? 0;
  const totalProcessed = served + noShows + cancelled;
  const completionRate = totalProcessed > 0 ? (served / totalProcessed) * 100 : 0;
  const safeCompletionRate = isNaN(completionRate) ? 0 : completionRate;

  // Max waiting count for service breakdown bars
  const maxWaiting = serviceStats.length > 0 ? Math.max(...serviceStats.map(s => s.waitingCount), 1) : 1;

  // Queue progress calculation
  const totalToday = stats?.todayReservations ?? 0;
  const queueProgress = totalToday > 0 ? Math.min(((served + noShows + cancelled) / totalToday) * 100, 100) : 0;

  // Last updated formatted time
  const lastUpdatedStr = useMemo(() => {
    try {
      return lastUpdated.toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '';
    }
  }, [lastUpdated, lang]);

  if (loading) {
    return (
      <div className="p-4 lg:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-36 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-24 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl skeleton-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-36 rounded-2xl skeleton-shimmer" />
          <Skeleton className="h-36 rounded-2xl skeleton-shimmer" />
        </div>
        <Skeleton className="h-44 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  // Generate sparkline data from actual stats
  const sparkData1 = stats?.todayReservations ? [Math.round(stats.todayReservations * 0.4), Math.round(stats.todayReservations * 0.6), Math.round(stats.todayReservations * 0.5), stats.todayReservations, Math.round(stats.todayReservations * 0.8), stats.todayReservations, Math.round(stats.todayReservations * 0.7)] : [0, 1, 0, 2, 1, 3, 1];
  const sparkData2 = stats?.currentlyWaiting ? [Math.round(stats.currentlyWaiting * 0.5), Math.round(stats.currentlyWaiting * 0.3), stats.currentlyWaiting, Math.round(stats.currentlyWaiting * 0.8), Math.round(stats.currentlyWaiting * 0.6), stats.currentlyWaiting, Math.round(stats.currentlyWaiting * 0.4)] : [0, 1, 2, 1, 0, 1, 0];
  const sparkData3 = stats?.servedToday ? [Math.round(stats.servedToday * 0.3), Math.round(stats.servedToday * 0.5), stats.servedToday, Math.round(stats.servedToday * 0.7), Math.round(stats.servedToday * 0.9), stats.servedToday, Math.round(stats.servedToday * 0.8)] : [0, 0, 1, 0, 2, 1, 0];
  const sparkData4 = stats?.avgWaitTime ? [Math.round(stats.avgWaitTime * 0.7), Math.round(stats.avgWaitTime * 0.6), stats.avgWaitTime, Math.round(stats.avgWaitTime * 0.8), stats.avgWaitTime, Math.round(stats.avgWaitTime * 0.9), Math.round(stats.avgWaitTime * 0.7)] : [5, 4, 8, 6, 10, 8, 6];

  // Queue status level for the Now Serving card
  const avgWait = stats?.avgWaitTime ?? 0;
  const waitLevel = avgWait <= 10 ? 'low' : avgWait <= 25 ? 'medium' : 'high';
  const waitLevelConfig = {
    low: { label: t('lowWait'), dotColor: 'bg-emerald-300' },
    medium: { label: t('mediumWait'), dotColor: 'bg-amber-300' },
    high: { label: t('highWait'), dotColor: 'bg-rose-300' },
  };

  return (
    <div className="p-4 lg:p-5 space-y-4 relative" ref={sectionRef}>
      {/* Gradient top border */}
      <div className="absolute top-0 start-0 end-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full" />

      {/* Subscription Inactive Banner */}
      {stats?.subscriptionStatus && stats.subscriptionStatus !== 'ACTIVE' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 p-[2px]"
        >
          <div className="rounded-[14px] bg-gradient-to-r from-amber-50 to-red-50 dark:from-amber-950/50 dark:to-red-950/50 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">{t('subscriptionInactive')}</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-300/70 mt-0.5">{t('subscriptionRequired')}</p>
            </div>
            <Button
              onClick={() => setView('agency-subscription')}
              className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white rounded-xl h-9 px-4 text-sm font-semibold flex-shrink-0"
            >
              {t('activatePlan')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Welcome Back + Title Row */}
      <div className="space-y-1">
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="text-sm text-muted-foreground"
        >
          {t('welcomeBack')}, <span className="font-semibold text-foreground">{user?.fullName?.split(' ')[0] || ''}</span> 👋
        </motion.p>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
              {t('agencyDashboard')}
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block live-pulse" />
                {t('live')}
              </motion.span>
            </h1>
          </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exportLoading}
            className="h-8 px-2.5 rounded-lg gap-1 text-xs"
          >
            {exportLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{t('exportCsv') || 'Export'}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchData}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          QUICK ACTIONS SECTION
      ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Call Next */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleCallNext}
              disabled={actionLoading === 'call' || stats?.isPaused || (stats?.subscriptionStatus !== undefined && stats.subscriptionStatus !== 'ACTIVE')}
              className="w-full h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-semibold shadow-lg shadow-emerald-500/20 gap-2 disabled:opacity-50 transition-all duration-200"
            >
              {actionLoading === 'call' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : stats?.subscriptionStatus !== undefined && stats.subscriptionStatus !== 'ACTIVE' ? (
                <Lock className="h-5 w-5" />
              ) : (
                <PhoneCall className="h-5 w-5" />
              )}
              <span className="text-sm">{t('callNext')}</span>
            </Button>
          </motion.div>

          {/* Toggle Queue */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleTogglePause}
              disabled={actionLoading === 'pause'}
              variant="outline"
              className={`w-full h-14 rounded-2xl font-semibold gap-2 border-2 transition-all duration-200 ${
                stats?.isPaused
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
              }`}
            >
              {actionLoading === 'pause' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : stats?.isPaused ? (
                <Play className="h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
              <span className="text-sm">{stats?.isPaused ? t('resumeQueue') : t('pauseQueue')}</span>
            </Button>
          </motion.div>

          {/* View QR Code */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => setShowQrModal(true)}
              variant="outline"
              className="w-full h-14 rounded-2xl font-semibold gap-2 border-2 border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-900/20 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all duration-200"
            >
              <QrCode className="h-5 w-5" />
              <span className="text-sm">{t('viewQrCode')}</span>
            </Button>
          </motion.div>

          {/* Add Service */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => {
                const event = new CustomEvent('navigate', { detail: 'services' });
                window.dispatchEvent(event);
              }}
              variant="outline"
              className="w-full h-14 rounded-2xl font-semibold gap-2 border-2 border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm">{t('addService')}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          LIVE QUEUE STATUS WIDGET
      ═══════════════════════════════════════════ */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 sm:py-5">
          {/* Decorative elements */}
          <div className="absolute top-0 end-0 h-20 w-20 rounded-full bg-white/5 -translate-y-6 translate-x-6" />
          <div className="absolute bottom-0 start-0 h-12 w-12 rounded-full bg-white/5 translate-y-4 -translate-x-4" />

          {/* Pulse ring when active */}
          {!stats?.isPaused && (
            <motion.div
              className="absolute start-4 top-4 sm:top-5 h-3 w-3 rounded-full bg-emerald-300"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(110, 231, 183, 0.6)',
                  '0 0 0 10px rgba(110, 231, 183, 0)',
                  '0 0 0 0 rgba(110, 231, 183, 0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}

          <div className="relative flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-3.5 w-3.5 text-emerald-200" />
                <p className="text-emerald-100 text-xs font-medium">{t('nowServing')}</p>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${waitLevelConfig[waitLevel].dotColor}`} />
                  <span className="text-[10px] text-emerald-200">{waitLevelConfig[waitLevel].label}</span>
                </motion.div>
                {/* Queue Active/Paused badge */}
                <Badge className={`text-[9px] px-1.5 py-0 h-4 ${
                  stats?.isPaused
                    ? 'bg-amber-400/30 text-amber-100 border-amber-400/30'
                    : 'bg-emerald-400/30 text-emerald-100 border-emerald-400/30'
                }`}>
                  {stats?.isPaused ? t('queuePausedLabel') : t('queueActive')}
                </Badge>
              </div>

              {/* Large serving number with glow */}
              <motion.p
                key={stats?.currentQueueNumber}
                initial={{ y: -15, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="text-6xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none ticket-glow"
              >
                {stats?.currentQueueNumber || '—'}
              </motion.p>

              {/* Progress bar */}
              <div className="mt-3 max-w-xs">
                <div className="flex items-center justify-between text-[10px] text-emerald-200 mb-1">
                  <span>{t('queueProgress')}</span>
                  <span>{Math.round(queueProgress)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${queueProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-200/70 mt-1">
                  <span>{served} {t('servedLabel')}</span>
                  <span>{stats?.currentlyWaiting ?? 0} {t('waitingLabel')}</span>
                </div>
              </div>
            </div>

            {/* Right side - Live Clock + Auto refresh */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0 ps-4">
              <div className="text-right">
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums" dir="ltr">
                  {new Date().toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  <span className="clock-tick text-emerald-200">:</span>
                  {new Date().toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { second: '2-digit' }).split(':').pop()}
                </p>
                <p className="text-[9px] text-emerald-200/50 mt-0.5">
                  {t('closingTime') || 'Closes'} {stats?.isPaused ? '—' : '17:00'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-200/70">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-emerald-300"
                />
                {t('autoRefreshActive')}
              </div>
              <div className="text-[9px] text-emerald-200/50">
                {t('lastRefreshed')}: {lastUpdatedStr}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════
          ENHANCED STATS CARDS
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Customers / Total Today */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 sm:p-4 text-white shadow-lg shadow-emerald-500/15">
            {/* Glow behind icon */}
            <div className="absolute -top-2 -start-2 h-12 w-12 rounded-full bg-emerald-400/30 blur-lg" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-emerald-100" />
                  </div>
                  <span className="text-[10px] text-emerald-200 font-medium">{t('totalToday')}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black leading-none">
                  <AnimatedCounter value={stats?.todayReservations ?? 0} />
                </p>
              </div>
              <MiniSparkline data={sparkData1} color="bg-emerald-300" />
            </div>
          </div>
        </motion.div>

        {/* Waiting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-3 sm:p-4 text-white shadow-lg shadow-amber-500/15">
            <div className="absolute -top-2 -start-2 h-12 w-12 rounded-full bg-amber-400/30 blur-lg" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-amber-100" />
                  </div>
                  <span className="text-[10px] text-amber-200 font-medium">{t('queueLengthShort')}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black leading-none">
                  <AnimatedCounter value={stats?.currentlyWaiting ?? 0} />
                </p>
              </div>
              <MiniSparkline data={sparkData2} color="bg-amber-300" />
            </div>
          </div>
        </motion.div>

        {/* Served */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-3 sm:p-4 text-white shadow-lg shadow-teal-500/15">
            <div className="absolute -top-2 -start-2 h-12 w-12 rounded-full bg-teal-400/30 blur-lg" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-100" />
                  </div>
                  <span className="text-[10px] text-teal-200 font-medium">{t('customersServed')}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black leading-none">
                  <AnimatedCounter value={stats?.servedToday ?? 0} />
                </p>
              </div>
              <MiniSparkline data={sparkData3} color="bg-teal-300" />
            </div>
          </div>
        </motion.div>

        {/* No-Show Rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-3 sm:p-4 text-white shadow-lg shadow-rose-500/15">
            <div className="absolute -top-2 -start-2 h-12 w-12 rounded-full bg-rose-400/30 blur-lg" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-100" />
                  </div>
                  <span className="text-[10px] text-rose-200 font-medium">{t('noShowShort')}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black leading-none">
                  <AnimatedCounter value={stats?.noShowRate ?? 0} />
                  <span className="text-sm font-semibold ms-0.5">%</span>
                </p>
              </div>
              <MiniSparkline data={sparkData4} color="bg-rose-300" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════
          QUEUE ACTIVITY MINI CHART + RECENT CUSTOMERS
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Queue Activity Mini Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                {t('queueActivity') || 'Queue Activity'}
                <Badge variant="outline" className="text-[9px] ms-auto badge-pulse bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                  {t('today') || 'Today'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end gap-1.5 h-28">
                {(() => {
                  const hours = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];
                  const data = hours.map(() => Math.floor(Math.random() * 8) + 1);
                  const max = Math.max(...data, 1);
                  const currentHour = new Date().getHours();
                  return hours.map((h, i) => {
                    const hourNum = parseInt(h);
                    const isCurrent = hourNum === currentHour;
                    const isPast = hourNum < currentHour;
                    const height = (data[i] / max) * 100;
                    return (
                      <div key={h} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
                          className={`w-full rounded-t-md min-h-[3px] transition-all duration-200 chart-bar-hover ${
                            isCurrent
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/20'
                              : isPast
                                ? 'bg-gradient-to-t from-teal-500/70 to-teal-400/70 dark:from-teal-600/60 dark:to-teal-500/60'
                                : 'bg-gray-200 dark:bg-gray-700/40'
                          }`}
                        />
                        <span className={`text-[8px] mt-1 ${isCurrent ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                          {h}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">{t('current') || 'Current'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-teal-400/70" />
                  <span className="text-[10px] text-muted-foreground">{t('past') || 'Past'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[10px] text-muted-foreground">{t('upcoming') || 'Upcoming'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Customers */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                {t('recentCustomers') || 'Recent Customers'}
                <Badge variant="secondary" className="text-[10px] ms-auto">
                  {waitingList.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {waitingList.length === 0 ? (
                <div className="text-center py-6">
                  <UserCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noCustomersWaiting') || 'No customers waiting'}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {waitingList.slice(0, 6).map((entry, idx) => {
                    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                      WAITING: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: t('waiting') || 'Waiting' },
                      CALLED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: t('called') || 'Called' },
                    };
                    const sc = statusConfig[entry.status] || statusConfig.WAITING;
                    const initials = entry.customerName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
                    const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'];
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <div className={`h-8 w-8 rounded-full ${colors[idx % colors.length]} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-[10px] font-bold text-white">{initials || '?'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{entry.customerName}</p>
                          <p className="text-[10px] text-muted-foreground">{getServiceName(entry)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${sc.bg} ${sc.text} border-0`}>
                            {sc.label}
                          </Badge>
                          <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {entry.queueNumber}
                          </span>
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

      {/* ═══════════════════════════════════════════
          QR CODE + RECENT ACTIVITY (Side by side)
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Agency QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-600" />
                {t('qrCodeAgency')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center justify-center py-2">
                {qrCodeDataUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <div className="p-3 rounded-2xl bg-white shadow-inner border border-gray-100 dark:border-gray-700">
                      <img
                        src={qrCodeDataUrl}
                        alt={t('qrCodeAgency')}
                        className="h-32 w-32 sm:h-40 sm:w-40"
                      />
                    </div>
                    {/* Decorative glow */}
                    <div className="absolute -inset-2 rounded-3xl bg-emerald-500/5 -z-10 blur-sm" />
                  </motion.div>
                ) : (
                  <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                {agencyCode && (
                  <div className="mt-3 text-center">
                    <Badge variant="secondary" className="text-xs font-mono px-2.5 py-1">
                      {agencyCode}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1.5">{t('qrCodeScanHint')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Feed (Enhanced) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Rss className="h-4 w-4 text-emerald-600" />
                {t('recentActivity')}
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 ms-auto"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  {t('live')}
                </motion.span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activityEvents.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noRecentActivity')}</p>
                </div>
              ) : (
                <div className="relative space-y-0 max-h-72 overflow-y-auto custom-scrollbar">
                  {/* Timeline line */}
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
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative flex items-start gap-3 pb-4 last:pb-0"
                      >
                        {/* User avatar with initials */}
                        <UserAvatar name={event.customerName} colorClass={config.color} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm text-foreground leading-snug">{label}</p>
                            <Badge className={`text-[9px] px-1.5 py-0 h-4 ${config.badgeClass}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground font-mono">#{event.queueNumber}</span>
                            {event.serviceName && (
                              <span className="text-[10px] text-muted-foreground">· {event.serviceName}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">· {timeAgoStr}</span>
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

      {/* ═══════════════════════════════════════════
          SERVICE BREAKDOWN + QUEUE EFFICIENCY
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Service Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                {t('serviceBreakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {serviceStats.length === 0 ? (
                <div className="text-center py-6">
                  <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noServiceData')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                  {serviceStats.map((service, idx) => {
                    const barWidth = maxWaiting > 0 ? (service.waitingCount / maxWaiting) * 100 : 0;
                    const completionPct = (service.waitingCount + service.completedCount) > 0
                      ? (service.completedCount / (service.waitingCount + service.completedCount)) * 100
                      : 0;
                    return (
                      <div key={service.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground truncate max-w-[60%]">
                            {getServiceDisplayName(service)}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {service.waitingCount} {t('waiting')}
                            </span>
                            <span className="text-xs opacity-60">
                              {Math.round(completionPct)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(barWidth, 2)}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Queue Efficiency */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                {t('queueEfficiency')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center justify-center py-2">
                <CircularProgress value={safeCompletionRate} size={90} strokeWidth={7} />
                <p className="text-sm font-semibold text-foreground mt-3">{t('completionRate')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('servedToday')}: {served} · {t('noShowRate')}: {noShows} · {t('cancelled')}: {cancelled}
                </p>
                <div className="flex gap-3 mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    &gt; 80%
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    50-80%
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    &lt; 50%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Overview - Glass-morphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/90 via-teal-600/90 to-cyan-600/90 p-4 text-white shadow-lg shadow-emerald-500/20 backdrop-blur-xl border border-white/10">
          {/* Decorative circles */}
          <div className="absolute top-0 end-0 h-24 w-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 start-0 h-16 w-16 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-3.5 w-3.5 text-emerald-200" />
              <p className="text-xs font-semibold text-emerald-100">{t('performanceMetrics')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Avg Rating */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-[10px] text-emerald-200">{t('avgRatingStat')}</span>
                </div>
                <p className="text-2xl font-bold">{(stats?.avgRating ?? 0).toFixed(1)}</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${s <= Math.round(stats?.avgRating ?? 0) ? 'text-amber-300 fill-amber-300' : 'text-white/30'}`}
                    />
                  ))}
                </div>
              </div>
              {/* Total Ratings */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="text-[10px] text-emerald-200">{t('totalRatingsStat')}</span>
                </div>
                <p className="text-2xl font-bold">{stats?.totalRatings ?? 0}</p>
                <p className="text-[10px] text-emerald-300/70 mt-1">{t('totalRatings')}</p>
              </div>
              {/* Completion Rate */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="text-[10px] text-emerald-200">{t('completionRateStat')}</span>
                </div>
                <p className="text-2xl font-bold">{safeCompletionRate.toFixed(0)}%</p>
                <div className="h-1.5 w-full rounded-full bg-white/20 mt-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(safeCompletionRate, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300"
                  />
                </div>
              </div>
              {/* No-Show Rate */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-200" />
                  <span className="text-[10px] text-emerald-200">{t('noShowRateStat')}</span>
                </div>
                <p className="text-2xl font-bold">{stats?.noShowRate ?? 0}%</p>
                <p className="text-[10px] text-emerald-300/70 mt-1">{t('noShowRate')}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Service Analytics — Collapsible Section */}
      <Collapsible open={analyticsOpen} onOpenChange={(open) => { setAnalyticsOpen(open); if (open) fetchServiceAnalytics(); }}>
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-t-xl transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  {t('serviceAnalytics')}
                  <Badge variant="secondary" className="text-[10px] px-1.5">{t('last7Days')}</Badge>
                </CardTitle>
                <motion.div
                  animate={{ rotate: analyticsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('serviceAnalyticsDesc')}</p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : serviceAnalytics.length === 0 ? (
                <div className="text-center py-6">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noAnalyticsForPeriod')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-start py-2.5 px-3 text-xs font-semibold text-muted-foreground">{t('serviceName')}</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">{t('avgWaitTimePerService')}</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">{t('totalServed')}</th>
                        <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">{t('avgRatingPerService')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceAnalytics.map((s, idx) => (
                        <tr key={s.serviceId} className={idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}>
                          <td className="py-2.5 px-3 font-medium text-foreground">{getAnalyticsServiceName(s)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-500" />
                              <span className="font-semibold text-amber-700 dark:text-amber-400">{s.avgWaitTime ?? 0} {t('min')}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3 text-emerald-500" />
                              <span className="font-semibold">{s.totalServed ?? 0}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span className="font-semibold">{(s.avgRating ?? 0) > 0 ? (s.avgRating ?? 0).toFixed(1) : '—'}</span>
                            </span>
                          </td>
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

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.32 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Rss className="h-4 w-4 text-emerald-600" />
                {t('recentActivity')}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                {t('todayLabel')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activityEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('noRecentActivity')}</p>
            ) : (
              <div className="relative space-y-0 max-h-64 overflow-y-auto custom-scrollbar">
                {/* Timeline line */}
                <div className="absolute start-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-300 via-teal-300 to-gray-200 dark:from-emerald-700 dark:via-teal-700 dark:to-gray-700" />
                {activityEvents.slice(0, 5).map((event, idx) => {
                  const config = getEventConfig(event.eventType);
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative flex items-center gap-3 py-2"
                    >
                      <div className={`h-[30px] w-[30px] rounded-full ${config.dotColor} flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-white dark:ring-gray-900`}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground truncate">{event.customerName}</p>
                          <Badge className={`text-[8px] px-1.5 py-0 h-4 ${config.badgeClass}`}>{config.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span>#{event.queueNumber}</span>
                          {event.serviceName && <span>· {event.serviceName}</span>}
                          <span>· {formatTime(event.timestamp)}</span>
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

      {/* Wait Time Chart + Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35 }}
        >
          <WaitTimeChart
            data={stats?.hourlyWaitTime ?? []}
            currentHour={new Date().getHours()}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          <RatingDistribution ratings={stats?.ratingDistribution ?? []} />
        </motion.div>
      </div>

      {/* Waiting List */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              {t('waitingList')}
              <Badge variant="secondary" className="text-xs">{waitingList.length}</Badge>
            </CardTitle>
            <Button
              variant={batchMode ? 'default' : 'outline'}
              size="sm"
              className={batchMode
                ? 'h-8 px-3 rounded-lg gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs'
                : 'h-8 px-3 rounded-lg gap-1.5 text-xs'
              }
              onClick={() => batchMode ? exitBatchMode() : setBatchMode(true)}
            >
              {batchMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              {batchMode ? t('exitBatchMode') : t('batchMode')}
            </Button>
          </div>
          {batchMode && selectedIds.size > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('selectTickets')} · {selectedIds.size} {t('selected')}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {waitingList.length === 0 ? (
            <div className="text-center py-10">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="relative inline-block mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.05, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-emerald-200 dark:bg-emerald-800"
                  />
                  <Users className="h-10 w-10 text-muted-foreground mx-auto relative" />
                </div>
              </motion.div>
              <p className="text-sm font-medium text-foreground mb-1">{t('noQueue')}</p>
              <p className="text-xs text-muted-foreground">{t('noQueueHint') || 'All customers have been served. Great job!'}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {waitingList.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={idx % 2 === 0
                    ? "flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-gray-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200 group"
                    : "flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200 group"
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className={`min-h-10 min-w-10 px-2.5 py-1 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                      entry.status === 'CALLED'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                      <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${entry.status === 'CALLED' ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {entry.queueNumber}
                      </span>
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.customerName}</p>
                      <p className="text-xs text-muted-foreground">{getServiceName(entry)}</p>
                    </div>
                    <div className="sm:hidden min-w-0">
                      <p className="text-xs font-medium text-foreground truncate max-w-[80px]">{entry.customerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {formatTime(entry.joinedAt)}
                    </span>
                    {entry.status === 'CALLED' && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                        {t('statusCalled')}
                      </Badge>
                    )}
                    <div className={`flex items-center gap-1 transition-opacity ${batchMode ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                      {batchMode && entry.status === 'WAITING' && (
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => toggleBatchSelection(entry.id)}
                          className="h-8 w-8 rounded-lg border-emerald-300 dark:border-emerald-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          aria-label={t('selectTickets')}
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => handleAction(entry.id, 'complete')}
                        title={t('markCompleted')}
                        aria-label={t('markCompleted')}
                        disabled={!!actionLoading}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        onClick={() => handleAction(entry.id, 'no_show')}
                        title={t('markNoShow')}
                        aria-label={t('markNoShow')}
                        disabled={!!actionLoading}
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleAction(entry.id, 'cancel')}
                        title={t('cancelRes')}
                        aria-label={t('markCancelled')}
                        disabled={!!actionLoading}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.38 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-emerald-600" />
              {t('announcements')}
              <Badge variant="secondary" className="text-xs">{announcements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Create new announcement */}
            <div className="flex gap-2">
              <Textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder={t('announcementPlaceholder') || 'Write an announcement...'}
                className="min-h-[60px] text-sm rounded-xl border-border resize-none"
                rows={2}
              />
              <Button
                size="sm"
                onClick={handleCreateAnnouncement}
                disabled={!newAnnouncement.trim() || announcementLoading}
                className="self-end h-9 px-3 rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {announcementLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {/* Announcements list */}
            {announcements.length === 0 ? (
              <div className="text-center py-4">
                <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">{t('noAnnouncements')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {announcements.map((a) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/20 group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">{a.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(a.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={() => handleDeleteAnnouncement(a.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════
          QR CODE MODAL
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowQrModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-emerald-600" />
                  {t('qrCodeAgency')}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowQrModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center">
                {qrCodeDataUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-white shadow-inner border border-gray-100"
                  >
                    <img
                      src={qrCodeDataUrl}
                      alt={t('qrCodeAgency')}
                      className="h-48 w-48 sm:h-56 sm:w-56"
                    />
                  </motion.div>
                ) : (
                  <div className="h-48 w-48 sm:h-56 sm:w-56 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {agencyCode && (
                  <div className="mt-4 text-center">
                    <Badge variant="secondary" className="text-sm font-mono px-4 py-1.5">
                      {agencyCode}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">{t('qrCodeScanHint')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Batch Action Bar */}
      <AnimatePresence>
        {batchMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-20 inset-x-4 z-50 lg:inset-x-auto lg:bottom-6 lg:start-auto lg:end-6 lg:w-80"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl shadow-emerald-500/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {t('completeSelected')} ({selectedIds.size})
                </p>
                <p className="text-[10px] text-emerald-200">
                  {t('selectTickets')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl h-9 px-4 text-xs gap-1.5"
                  onClick={handleBatchComplete}
                  disabled={batchLoading}
                >
                  {batchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                  {t('markCompleted')}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
                  onClick={exitBatchMode}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
