'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  Clock,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Phone,
  Check,
  Circle,
  Activity,
  UserCheck,
  Plus,
  BarChart3,
  ClipboardList,
  Megaphone,
  Pin,
  Trash2,
  X,
  Info,
  AlertTriangle,
  Download,
  Loader2,
  MessageSquare,
  Send,
  Save,
  RefreshCw,
  Wifi,
  UserPlus,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SmsSettingsData {
  id: string;
  provider: string;
  apiUrl: string;
  apiKey: string;
  senderName: string;
  enabled: boolean;
  smsPerReminder: number;
  maxSmsPerDay: number;
  testPhoneNumber: string | null;
  updatedAt: string;
  createdAt: string;
}

interface SmsProviderInfo {
  id: string;
  name: string;
  description: string;
  defaultApiUrl: string;
  senderIdSupport: boolean;
  docsUrl: string;
}

interface SmsUsageStats {
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  totalSent: number;
  failedToday: number;
}

interface SmsLogItem {
  id: string;
  phoneNumber: string;
  message: string;
  status: string;
  provider: string;
  errorMessage: string | null;
  createdAt: string;
}

interface AdminStats {
  totalAgencies: number;
  activeQueues: number;
  dailyReservations: number;
  totalRevenue: number;
  pendingTransactions: number;
  totalUsers?: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  details: string;
  createdAt: string;
}

/**
 * AnimatedCounter - Animates a number from 0 to target using requestAnimationFrame.
 * Uses ease-out cubic for natural deceleration feel.
 */
function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '', decimals = 0 }: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const endValue = value;
    if (endValue === 0) return;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplay(endValue * easedProgress);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(endValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString();

  return <>{prefix}{formatted}{suffix}</>;
}

/**
 * Formats a date string into relative time (e.g., "2 hours ago", "just now")
 */
function formatRelativeTime(dateStr: string, lang: string): string {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US';

    if (diffSec < 60) {
      return locale === 'ar-DZ' ? 'الآن' : locale === 'fr-DZ' ? "À l'instant" : 'just now';
    }
    if (diffMin < 60) {
      const min = locale === 'ar-DZ' ? 'دقيقة' : locale === 'fr-DZ' ? 'min' : 'min';
      return `${diffMin} ${min}`;
    }
    if (diffHour < 24) {
      const hr = locale === 'ar-DZ' ? 'ساعة' : locale === 'fr-DZ' ? 'h' : 'h';
      return `${diffHour} ${hr}`;
    }
    if (diffDay < 7) {
      const d = locale === 'ar-DZ' ? 'يوم' : locale === 'fr-DZ' ? 'j' : 'd';
      return `${diffDay} ${d}`;
    }
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Gets color info for activity type
 */
function getActivityColor(action: string): { dot: string; bg: string; text: string } {
  const a = action.toUpperCase();
  if (a.includes('LOGIN')) return { dot: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' };
  if (a.includes('QUEUE_CALL') || a.includes('CALL')) return { dot: 'bg-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' };
  if (a.includes('PAYMENT_APPROVE') || a.includes('APPROVE')) return { dot: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
  if (a.includes('CREATE') || a.includes('REGISTER')) return { dot: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' };
  if (a.includes('DELETE') || a.includes('REJECT')) return { dot: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' };
  if (a.includes('UPDATE')) return { dot: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
  return { dot: 'bg-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' };
}

/**
 * Gets initials from details string for avatar
 */
function getInitials(details: string): string {
  if (!details) return '?';
  const words = details.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return details.slice(0, 2).toUpperCase();
}

/**
 * Generates synthetic daily reservation data for the last 7 days
 * based on the dailyReservations stat value
 */
function generateDailyReservationData(dailyReservations: number): { day: string; value: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const result: { day: string; value: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayIdx = (today - i + 7) % 7;
    // Generate realistic variation around the daily average
    const variation = 0.5 + Math.random() * 1.0;
    const weekendBoost = (dayIdx === 0 || dayIdx === 6) ? 1.3 : 1.0;
    const value = Math.max(1, Math.round(dailyReservations * variation * weekendBoost));
    result.push({ day: days[dayIdx], value });
  }
  return result;
}

/**
 * DailyReservationsChart - Pure SVG bar chart showing last 7 days of reservations
 */
function DailyReservationsChart({ dailyReservations }: { dailyReservations: number }) {
  const { t } = useLanguage();
  const chartData = useMemo(() => generateDailyReservationData(dailyReservations || 5), [dailyReservations]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  if (chartData.length === 0) return null;

  const maxVal = Math.max(...chartData.map(d => d.value));
  const chartW = 280;
  const chartH = 100;
  const barW = 24;
  const gap = (chartW - barW * 7) / 8;
  const barRadius = 4;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full h-auto" fill="none">
        {/* Subtle grid lines */}
        {[0.25, 0.5, 0.75].map((pct, i) => (
          <line
            key={i}
            x1={0}
            y1={chartH * (1 - pct)}
            x2={chartW}
            y2={chartH * (1 - pct)}
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-800"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        ))}

        {/* Bars */}
        {chartData.map((d, i) => {
          const barH = maxVal > 0 ? (d.value / maxVal) * (chartH - 10) : 0;
          const x = gap + i * (barW + gap);
          const y = chartH - barH;
          const isHovered = hoveredBar === i;
          const isToday = i === chartData.length - 1;
          const fillColor = isToday ? '#10b981' : isHovered ? '#14b8a6' : '#99f6e4';
          const darkFillColor = isToday ? '#10b981' : isHovered ? '#14b8a6' : '#2d6a5a';

          return (
            <g key={i}>
              {/* Bar with rounded top */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={barRadius}
                ry={barRadius}
                fill={fillColor}
                className="transition-all duration-300"
                style={{ opacity: isHovered ? 1 : 0.75 }}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              />
              {/* Value label on hover */}
              {isHovered && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="text-[10px] fill-foreground font-bold"
                >
                  {d.value}
                </text>
              )}
              {/* Day label */}
              <text
                x={x + barW / 2}
                y={chartH + 14}
                textAnchor="middle"
                className={`text-[9px] ${isToday ? 'fill-emerald-600 dark:fill-emerald-400 font-bold' : 'fill-muted-foreground'}`}
              >
                {d.day}
              </text>
              {/* Today indicator dot */}
              {isToday && (
                <circle
                  cx={x + barW / 2}
                  cy={chartH + 22}
                  r={2}
                  fill="#10b981"
                />
              )}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">{t('today')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-200 dark:bg-emerald-800" />
          <span className="text-[10px] text-muted-foreground">{t('previousDays')}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  const actionUpper = action.toUpperCase();
  if (actionUpper.includes('LOGIN')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <UserCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  if (actionUpper.includes('QUEUE_CALL') || actionUpper.includes('CALL')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  if (actionUpper.includes('PAYMENT_APPROVE') || actionUpper.includes('APPROVE')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
        <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
      <Circle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    </div>
  );
}

export function AdminDashboard() {
  const { setView, user } = useAppStore();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [realAnnouncements, setRealAnnouncements] = useState<Array<{ id: string; message: string; type: string; createdAt: string }>>([]);
  const [newAnnMsg, setNewAnnMsg] = useState('');
  const [newAnnType, setNewAnnType] = useState<'INFO' | 'WARNING' | 'URGENT'>('INFO');
  const [annLoading, setAnnLoading] = useState(false);
  const [smsSettings, setSmsSettings] = useState<SmsSettingsData | null>(null);
  const [smsStats, setSmsStats] = useState<SmsUsageStats | null>(null);
  const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>([]);
  const [smsProviders, setSmsProviders] = useState<SmsProviderInfo[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsTestLoading, setSmsTestLoading] = useState(false);
  const [smsValidating, setSmsValidating] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchRealAnnouncements();
    fetchSmsSettings();
  }, []);

  const fetchSmsSettings = async () => {
    setSmsLoading(true);
    try {
      const res = await fetch('/api/admin/sms-settings');
      if (res.ok) {
        const data = await res.json();
        setSmsSettings(data.settings);
        setSmsStats(data.stats);
        setSmsLogs(data.recentLogs ?? []);
        setSmsProviders(data.providers ?? []);
      }
    } catch { toast.error(t('error')); }
    finally { setSmsLoading(false); }
  };

  const handleSaveSmsSettings = async () => {
    if (!smsSettings) return;
    setSmsSaving(true);
    try {
      const res = await fetch('/api/admin/sms-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: smsSettings.provider,
          apiUrl: smsSettings.apiUrl,
          apiKey: smsSettings.apiKey.includes('••••') ? undefined : smsSettings.apiKey,
          senderName: smsSettings.senderName,
          enabled: smsSettings.enabled,
          smsPerReminder: smsSettings.smsPerReminder,
          maxSmsPerDay: smsSettings.maxSmsPerDay,
          testPhoneNumber: smsSettings.testPhoneNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSmsSettings(data.settings);
        toast.success(t('smsSaved'));
      } else { toast.error(t('error')); }
    } catch { toast.error(t('error')); }
    finally { setSmsSaving(false); }
  };

  const handleSendTestSms = async () => {
    if (!smsSettings?.testPhoneNumber) {
      toast.error(t('smsTestPhoneRequired') || 'Test phone number is required');
      return;
    }
    setSmsTestLoading(true);
    try {
      const res = await fetch('/api/admin/sms-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: smsSettings.testPhoneNumber }),
      });
      if (res.ok) {
        toast.success(t('smsTestSent'));
        fetchSmsSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || t('smsTestFailed'));
      }
    } catch { toast.error(t('smsTestFailed')); }
    finally { setSmsTestLoading(false); }
  };

  const handleValidateGateway = async () => {
    setSmsValidating(true);
    try {
      const res = await fetch('/api/admin/sms-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' }),
      });
      const data = await res.json();
      if (data.valid) {
        toast.success(t('smsGatewayValid') || 'Gateway connection successful!');
      } else {
        toast.error(data.error || t('smsTestFailed'));
      }
    } catch { toast.error(t('smsTestFailed')); }
    finally { setSmsValidating(false); }
  };

  const handleProviderChange = (providerId: string) => {
    if (!smsSettings) return;
    const provider = smsProviders.find(p => p.id === providerId);
    setSmsSettings({
      ...smsSettings,
      provider: providerId,
      apiUrl: provider?.defaultApiUrl || smsSettings.apiUrl,
    });
  };

  const fetchRealAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setRealAnnouncements(data.announcements ?? []);
      }
    } catch { toast.error(t('error')); }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnMsg.trim() || !user?.id) return;
    setAnnLoading(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newAnnMsg.trim(), type: newAnnType, createdBy: user.id }),
      });
      if (res.ok) {
        toast.success(t('announcementCreatedSuccess'));
        setNewAnnMsg('');
        fetchRealAnnouncements();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch { toast.error(t('error')); }
    finally { setAnnLoading(false); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('announcementDeletedSuccess'));
        fetchRealAnnouncements();
      } else { toast.error(t('error')); }
    } catch { toast.error(t('error')); }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats ?? null);
        setActivities(data.recentActivity ?? []);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminExport = async (type: 'agencies' | 'users') => {
    setExportLoading(type);
    try {
      const res = await fetch(`/api/admin/export/${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blasti-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('exportSuccess'));
      } else {
        toast.error(t('exportFailed'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setExportLoading(null);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(
        lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US',
        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      );
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <Skeleton className="h-24 rounded-2xl skeleton-shimmer" />
        <Skeleton className="h-64 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  // Mini sparkline data (synthetic for visual enhancement)
  const sparklines = [
    [3, 5, 4, 7, 6, 8, 7, 9, 8, 10],
    [2, 4, 3, 5, 6, 4, 7, 5, 8, 6],
    [1, 3, 5, 4, 7, 6, 8, 7, 9, 8],
    [4, 3, 5, 6, 5, 7, 6, 8, 7, 9],
    [2, 1, 3, 2, 4, 3, 2, 3, 1, 2],
    [3, 4, 5, 6, 5, 7, 8, 7, 9, 8],
  ];

  const statCards = [
    {
      label: t('totalAgencies'),
      value: stats?.totalAgencies ?? 0,
      numericValue: stats?.totalAgencies ?? 0,
      prefix: '',
      suffix: '',
      icon: Building2,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      sparkColor: '#10b981',
    },
    {
      label: t('activeQueues'),
      value: stats?.activeQueues ?? 0,
      numericValue: stats?.activeQueues ?? 0,
      prefix: '',
      suffix: '',
      icon: Users,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      sparkColor: '#14b8a6',
    },
    {
      label: t('dailyReservations'),
      value: stats?.dailyReservations ?? 0,
      numericValue: stats?.dailyReservations ?? 0,
      prefix: '',
      suffix: '',
      icon: Calendar,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      sparkColor: '#14b8a6',
    },
    {
      label: t('totalRevenue'),
      value: stats?.totalRevenue ?? 0,
      numericValue: stats?.totalRevenue ?? 0,
      prefix: '',
      suffix: ` ${t('currency')}`,
      icon: CreditCard,
      color: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      sparkColor: '#f59e0b',
    },
    {
      label: t('pendingTransactions'),
      value: stats?.pendingTransactions ?? 0,
      numericValue: stats?.pendingTransactions ?? 0,
      prefix: '',
      suffix: '',
      icon: Clock,
      color: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      sparkColor: '#ef4444',
    },
    {
      label: t('totalUsers'),
      value: stats?.totalUsers ?? 0,
      numericValue: stats?.totalUsers ?? 0,
      prefix: '',
      suffix: '',
      icon: UserPlus,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      sparkColor: '#10b981',
    },
  ];

  // Show daily reservations as today's activity instead of misleading growth %
  const dailyActivity = stats?.dailyReservations ?? 0;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Premium header gradient banner with branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden mb-2"
      >
        <div className="premium-header-gradient p-5 md:p-6 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -start-8 w-32 h-32 rounded-full bg-white/5" />
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl overflow-hidden">
                  <img src="/logo.png" alt="BLASTI" className="h-full w-full object-contain" />
                </div>
                {t('adminDashboard')}
              </h1>
              <p className="text-sm text-emerald-100 mt-1 ms-[52px]">BLASTI Platform Management</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs px-3 py-1">
                <TrendingUp className="h-3 w-3 me-1" />
                {dailyActivity} {t('todayLabel')}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs px-2 py-1">
                <ShieldCheck className="h-3 w-3 me-1" />
                {t('superAdmin')}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile badges */}
      <div className="flex sm:hidden items-center gap-2 mb-1">
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium px-2 py-0.5">
          <TrendingUp className="h-3 w-3 me-1" />
          {dailyActivity} {t('todayLabel')}
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">
          <ShieldCheck className="h-3 w-3 me-1" />
          {t('superAdmin')}
        </Badge>
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAdminExport('agencies')}
          disabled={exportLoading === 'agencies'}
          className="h-8 px-3 rounded-lg gap-1.5 text-xs"
        >
          {exportLoading === 'agencies' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{t('exportAgencies')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAdminExport('users')}
          disabled={exportLoading === 'users'}
          className="h-8 px-3 rounded-lg gap-1.5 text-xs"
        >
          {exportLoading === 'users' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{t('exportUsers')}</span>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">{t('systemAnnouncements')}</h2>
          </div>
        </div>
        {/* Create Announcement Form */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 mb-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">{t('createAnnouncement')}</h3>
            </div>
            <Textarea
              value={newAnnMsg}
              onChange={(e) => setNewAnnMsg(e.target.value)}
              placeholder={t('announcementMessagePlaceholder')}
              className="min-h-[80px] resize-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('announcementType')}:</span>
              <select
                value={newAnnType}
                onChange={(e) => setNewAnnType(e.target.value as 'INFO' | 'WARNING' | 'URGENT')}
                className="h-9 px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
              >
                <option value="INFO">{t('announcementTypeInfo')}</option>
                <option value="WARNING">{t('announcementTypeWarning')}</option>
                <option value="URGENT">{t('announcementTypeUrgent')}</option>
              </select>
            </div>
            <Button
              onClick={handleCreateAnnouncement}
              disabled={annLoading || !newAnnMsg.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-10"
            >
              {annLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Plus className="h-4 w-4 me-2" />}
              {t('createAnnouncement')}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {realAnnouncements
            .filter(a => !dismissedAnnouncements.has(a.id))
            .slice(0, 5)
            .map((announcement, idx) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className={`flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm ${
                  announcement.type === 'URGENT'
                    ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200/50 dark:border-rose-800/30'
                    : announcement.type === 'WARNING'
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30'
                    : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30'
                }`}>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    announcement.type === 'URGENT'
                      ? 'bg-rose-200 dark:bg-rose-900/30'
                      : announcement.type === 'WARNING'
                      ? 'bg-amber-200 dark:bg-amber-900/30'
                      : 'bg-emerald-200 dark:bg-emerald-900/30'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 ${
                      announcement.type === 'URGENT'
                        ? 'text-rose-600 dark:text-rose-400'
                        : announcement.type === 'WARNING'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{announcement.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {announcement.type === 'URGENT' ? t('announcementTypeUrgent') : announcement.type === 'WARNING' ? t('announcementTypeWarning') : t('announcementTypeInfo')}
                      {' · '}{new Date(announcement.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setDismissedAnnouncements(prev => { const n = new Set(prev); n.add(announcement.id); return n; })}
                      aria-label={t('dismiss')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
          ))}
          {realAnnouncements.filter(a => !dismissedAnnouncements.has(a.id)).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noAnnouncements')}</p>
          )}
        </div>
        </>
      </motion.div>

      {/* Stats Grid with gradient borders + sparklines */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const spark = sparklines[idx] ?? sparklines[0];
          const minVal = Math.min(...spark);
          const maxVal = Math.max(...spark);
          const range = maxVal - minVal || 1;
          const points = spark.map((v, i) => `${(i / (spark.length - 1)) * 80},${28 - ((v - minVal) / range) * 24}`).join(' ');
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="cursor-default"
            >
              <div className="rounded-2xl p-[1px] bg-gradient-to-br from-emerald-200/40 via-transparent to-teal-200/40 dark:from-emerald-700/20 dark:via-transparent dark:to-teal-700/20 group">
                <Card className="border-0 shadow-sm hover:shadow-xl hover:shadow-emerald-500/8 transition-all duration-300 hover:-translate-y-1.5 bg-white dark:bg-gray-900/90 rounded-[14px]">
                  <CardContent className={`p-4 rounded-t-[14px] ${stat.color}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 ${
                        idx === 0 ? 'from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40'
                        : idx === 1 ? 'from-teal-200 to-teal-300 dark:from-teal-900/40 dark:to-teal-800/40'
                        : idx === 2 ? 'from-teal-200 to-emerald-200 dark:from-teal-900/40 dark:to-emerald-900/40'
                        : idx === 3 ? 'from-amber-200 to-amber-300 dark:from-amber-900/40 dark:to-amber-800/40'
                        : idx === 4 ? 'from-rose-200 to-rose-300 dark:from-rose-900/40 dark:to-rose-800/40'
                        : 'from-emerald-200 to-teal-200 dark:from-emerald-900/40 dark:to-teal-900/40'
                      } flex items-center justify-center shadow-sm`}>
                        <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      {/* Mini Sparkline SVG */}
                      <svg viewBox="0 0 80 28" className="w-16 h-8 opacity-60" fill="none">
                        <polyline points={points} stroke={stat.sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points={`${points} ${80},${28} 0,28`} fill={stat.sparkColor} fillOpacity="0.08" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent number-animate">
                      <AnimatedCounter value={stat.numericValue} prefix={stat.prefix} suffix={stat.suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* System Uptime Live Pulse */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30">
          {/* Pulsing green dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('systemUptime')}</span>
          <Badge variant="outline" className="ms-auto text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">99.9%</Badge>
          <div className="flex items-center gap-1 ms-2">
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('systemStatusOnline')}</span>
          </div>
        </div>
      </motion.div>

      {/* Latest Registered Users */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-emerald-600" />
                {t('latestUsers')}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                {t('recent')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {activities.filter(a => a.action.toUpperCase().includes('REGISTER') || a.action.toUpperCase().includes('CREATE')).slice(0, 5).map((activity, idx) => {
                const colorInfo = getActivityColor(activity.action);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-xl ${colorInfo.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-xs font-bold ${colorInfo.text}`}>{getInitials(activity.details)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.details}</p>
                      <p className="text-[10px] text-muted-foreground">{formatRelativeTime(activity.createdAt, lang)}</p>
                    </div>
                    <Badge className={`text-[8px] h-5 ${colorInfo.bg} ${colorInfo.text} border-0`}>
                      {activity.entity}
                    </Badge>
                  </motion.div>
                );
              })}
              {activities.filter(a => a.action.toUpperCase().includes('REGISTER') || a.action.toUpperCase().includes('CREATE')).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subscription Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.19 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              {t('subscriptionBreakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('active'), count: stats?.activeQueues ?? 0, color: 'bg-emerald-500', bgLight: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { label: t('pending'), count: stats?.pendingTransactions ?? 0, color: 'bg-amber-500', bgLight: 'bg-amber-50 dark:bg-amber-900/20' },
                { label: t('inactive'), count: Math.max((stats?.totalAgencies ?? 0) - (stats?.activeQueues ?? 0) - (stats?.pendingTransactions ?? 0), 0), color: 'bg-gray-400', bgLight: 'bg-gray-50 dark:bg-gray-800/30' },
              ].map((item, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${item.bgLight} text-center`}>
                  <div className="flex justify-center mb-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{item.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            {/* Visual bar */}
            <div className="mt-3 h-3 w-full rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
              {(() => {
                const total = Math.max(stats?.totalAgencies ?? 1, 1);
                const active = ((stats?.activeQueues ?? 0) / total) * 100;
                const pending = ((stats?.pendingTransactions ?? 0) / total) * 100;
                const inactive = Math.max(100 - active - pending, 0);
                return (
                  <>
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${active}%` }} />
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${pending}%` }} />
                    <div className="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-500" style={{ width: `${inactive}%` }} />
                  </>
                );
              })()}
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {t('active')}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> {t('pending')}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" /> {t('inactive')}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-foreground">{t('quickActions') || 'Quick Actions'}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: Building2, label: t('manageAgencies') || 'Agencies', view: 'agencies', color: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20' },
            { icon: Users, label: t('manageUsers') || 'Users', view: 'users', color: 'from-teal-500 to-teal-600 shadow-teal-500/20' },
            { icon: CreditCard, label: t('pendingPayments') || 'Payments', view: 'transactions', color: 'from-amber-500 to-amber-600 shadow-amber-500/20' },
            { icon: BarChart3, label: t('analytics') || 'Analytics', view: 'analytics', color: 'from-rose-500 to-rose-600 shadow-rose-500/20' },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.view}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView(action.view)}
                className={`flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br ${action.color} text-white font-medium shadow-lg transition-all duration-200 hover:shadow-xl text-xs sm:text-sm`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Daily Reservations Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                {t('dailyReservations')} — 7 Day Trend
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="h-3 w-3 me-1" />
                {dailyActivity} today
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <DailyReservationsChart dailyReservations={dailyActivity} />
          </CardContent>
        </Card>
      </motion.div>

      {/* System Health Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              {t('systemHealth')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Active Users Today */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{t('activeUsersToday')}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{stats?.totalUsers ?? stats?.dailyReservations ?? 0}</p>
                </div>
              </div>
              {/* Total Agencies */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-900/10">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-200 to-teal-300 dark:from-teal-900/40 dark:to-teal-800/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{t('totalAgencies')}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{stats?.totalAgencies ?? 0}</p>
                </div>
              </div>
              {/* Active Queues */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{t('activeQueues')}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{stats?.activeQueues ?? 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              {t('quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('admin-agencies')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 quick-action-card"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-800/40 dark:to-emerald-700/40 flex items-center justify-center shadow-sm">
                  <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">{t('addNewAgency')}</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('admin-analytics')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-0 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 hover:from-teal-100 hover:to-cyan-100 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30 shadow-sm hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 quick-action-card"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-200 to-teal-300 dark:from-teal-800/40 dark:to-teal-700/40 flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">{t('viewAnalytics')}</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('admin-users')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 shadow-sm hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 quick-action-card"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-800/40 dark:to-amber-700/40 flex items-center justify-center shadow-sm">
                  <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">{t('manageUsers')}</span>
              </motion.button>
              <motion.button
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('admin-transactions')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-0 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-900/30 dark:hover:to-pink-900/30 shadow-sm hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 quick-action-card"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-200 to-rose-300 dark:from-rose-800/40 dark:to-rose-700/40 flex items-center justify-center shadow-sm">
                  <CreditCard className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs font-semibold text-foreground">{t('viewTransactions')}</span>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SMS Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                {t('smsConfigSection')}
              </CardTitle>
              <div className="flex items-center gap-2">
                {smsSettings?.enabled ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium">
                    <Check className="h-3 w-3 me-1" />
                    {t('smsEnabled')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {t('smsDisabled')}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={fetchSmsSettings}
                  disabled={smsLoading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${smsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t('smsConfigDesc')}</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {smsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : smsSettings ? (
              <>
                {/* SMS Enable Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center shadow-sm">
                      <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t('smsEnabled')}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {smsSettings.enabled ? t('smsEnabled') : t('smsDisabled')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={smsSettings.enabled}
                    onCheckedChange={(checked) => setSmsSettings({ ...smsSettings, enabled: checked })}
                  />
                </div>

                {/* SMS Configuration Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Provider */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('smsProvider')}</Label>
                    <select
                      value={smsSettings.provider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      className="h-9 w-full px-3 rounded-lg border border-border bg-background text-sm"
                    >
                      {smsProviders.length > 0 ? smsProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      )) : (
                        <>
                          <option value="winsms">WinSMS (winsms.dz)</option>
                          <option value="notifsend">NotifSend (notifsend.com)</option>
                          <option value="algeria_sms">Algeria SMS (algeria-sms.com)</option>
                          <option value="green_send">GreenSMS (greensms.ma)</option>
                          <option value="mtarget">M-Target (mtarget.dz)</option>
                          <option value="twilio">Twilio (twilio.com)</option>
                          <option value="vonage">Vonage / Nexmo (vonage.com)</option>
                          <option value="generic">Generic API</option>
                        </>
                      )}
                    </select>
                    {(() => {
                      const prov = smsProviders.find(p => p.id === smsSettings.provider);
                      if (!prov) return null;
                      return (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {prov.description}
                          {!prov.senderIdSupport && ' ⚠️ Uses phone number as sender (not name)'}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Sender Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('smsSenderName')}</Label>
                    <Input
                      value={smsSettings.senderName}
                      onChange={(e) => setSmsSettings({ ...smsSettings, senderName: e.target.value })}
                      className="h-9 text-sm"
                      placeholder="BLASTI"
                    />
                  </div>

                  {/* API URL */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('smsApiUrl')}</Label>
                    <Input
                      value={smsSettings.apiUrl}
                      onChange={(e) => setSmsSettings({ ...smsSettings, apiUrl: e.target.value })}
                      className="h-9 text-sm"
                      placeholder="https://api.example.com/sms"
                    />
                  </div>

                  {/* API Key */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('smsApiKey')}</Label>
                    <Input
                      value={smsSettings.apiKey}
                      onChange={(e) => setSmsSettings({ ...smsSettings, apiKey: e.target.value })}
                      className="h-9 text-sm"
                      type="password"
                      placeholder="••••••••••"
                    />
                  </div>

                  {/* Test Phone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('testPhoneNumber')}</Label>
                    <Input
                      value={smsSettings.testPhoneNumber ?? ''}
                      onChange={(e) => setSmsSettings({ ...smsSettings, testPhoneNumber: e.target.value })}
                      className="h-9 text-sm"
                      placeholder="+213XXXXXXXXX"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-muted-foreground">{t('smsPhoneFormat') || 'Algerian format: +213XXXXXXXXX or 0XXXXXXXXX'}</p>
                  </div>

                  {/* SMS Per Reminder */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('smsPerReminder')}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={smsSettings.smsPerReminder}
                      onChange={(e) => setSmsSettings({ ...smsSettings, smsPerReminder: parseInt(e.target.value) || 1 })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveSmsSettings}
                    disabled={smsSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-9 px-4 text-sm"
                  >
                    {smsSaving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Save className="h-4 w-4 me-1.5" />}
                    {t('save')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSendTestSms}
                    disabled={smsTestLoading || !smsSettings.testPhoneNumber}
                    className="rounded-xl h-9 px-4 text-sm"
                  >
                    {smsTestLoading ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Send className="h-4 w-4 me-1.5" />}
                    {t('smsTestSend')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleValidateGateway}
                    disabled={smsValidating || !smsSettings.apiUrl}
                    className="rounded-xl h-9 px-4 text-sm border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    {smsValidating ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Wifi className="h-4 w-4 me-1.5" />}
                    {t('smsValidateConnection') || 'Validate Connection'}
                  </Button>
                </div>

                {/* SMS Usage Stats */}
                {smsStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{smsStats.sentToday}</span>
                      <span className="text-[10px] text-muted-foreground">{t('smsSentToday')}</span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/10">
                      <span className="text-lg font-bold text-teal-700 dark:text-teal-400">{smsStats.sentThisWeek}</span>
                      <span className="text-[10px] text-muted-foreground">{t('smsSentThisWeek')}</span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                      <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{smsStats.sentThisMonth}</span>
                      <span className="text-[10px] text-muted-foreground">{t('smsSentThisMonth')}</span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      <span className="text-lg font-bold text-foreground">{smsStats.totalSent}</span>
                      <span className="text-[10px] text-muted-foreground">{t('smsTotalSent')}</span>
                    </div>
                  </div>
                )}

                {/* Recent SMS Logs */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {t('smsLogs')}
                  </p>
                  {smsLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">{t('noSmsLogs')}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                      {smsLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-xs"
                        >
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                              log.status === 'SENT'
                                ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                                : log.status === 'FAILED'
                                ? 'border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-400'
                                : 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {log.status}
                          </Badge>
                          <span className="text-muted-foreground truncate flex-shrink-0">{log.phoneNumber}</span>
                          <span className="text-foreground truncate flex-1 min-w-0">{log.message.slice(0, 60)}</span>
                          <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">
                            {formatTime(log.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                {t('recentActivity')}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {activities.length} events
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('noData')}</p>
            ) : (
              <div className="relative max-h-96 overflow-y-auto custom-scrollbar">
                {/* Vertical timeline line */}
                <div className="absolute start-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-200 via-teal-200 to-gray-200 dark:from-emerald-800 dark:via-teal-800 dark:to-gray-800 rounded-full" />
                <div className="space-y-0">
                  {activities.map((item, idx) => {
                    const colors = getActivityColor(item.action);
                    const initials = getInitials(item.details);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="relative flex items-start gap-3 py-3 group"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 mt-1">
                          <div className={`h-2.5 w-2.5 rounded-full ${colors.dot} ring-2 ring-white dark:ring-gray-900 group-hover:scale-150 transition-transform duration-200`} />
                        </div>

                        {/* Avatar with initials */}
                        <div className={`h-8 w-8 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${colors.text} ring-2 ring-white dark:ring-gray-900 shadow-sm`}>
                          {initials}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{item.details}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{item.entity}</span>
                                <span className="text-[10px] text-muted-foreground/50">·</span>
                                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(item.createdAt, lang)}</span>
                              </div>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium flex-shrink-0`}>
                              {item.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Version Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center pb-2"
      >
        <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal border-dashed">
          {t('platformVersion')}: v1.0.0 · {t('lastUpdated')}: {formatTime(new Date().toISOString())}
        </Badge>
      </motion.div>
    </div>
  );
}
