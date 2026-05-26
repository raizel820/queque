'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';

// ─── Interfaces ──────────────────────────────────────────────

export interface AdminStats {
  totalAgencies: number;
  activeQueues: number;
  dailyReservations: number;
  totalRevenue: number;
  pendingTransactions: number;
  totalUsers?: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  details: string;
  createdAt: string;
}

export interface SmsSettingsData {
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

export interface SmsProviderInfo {
  id: string;
  name: string;
  description: string;
  defaultApiUrl: string;
  senderIdSupport: boolean;
  docsUrl: string;
}

export interface SmsUsageStats {
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  totalSent: number;
  failedToday: number;
}

export interface SmsLogItem {
  id: string;
  phoneNumber: string;
  message: string;
  status: string;
  provider: string;
  errorMessage: string | null;
  createdAt: string;
}

// ─── Utility Functions ───────────────────────────────────────

/**
 * Formats a date string into relative time (e.g., "2 hours ago", "just now")
 */
export function formatRelativeTime(dateStr: string, lang: string): string {
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
export function getActivityColor(action: string): { dot: string; bg: string; text: string } {
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
export function getInitials(details: string): string {
  if (!details) return '?';
  const words = details.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return details.slice(0, 2).toUpperCase();
}

/**
 * Generates synthetic daily reservation data for the last 7 days
 * based on the dailyReservations stat value
 */
export function generateDailyReservationData(dailyReservations: number): { day: string; value: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const result: { day: string; value: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayIdx = (today - i + 7) % 7;
    const variation = 0.5 + Math.random() * 1.0;
    const weekendBoost = (dayIdx === 0 || dayIdx === 6) ? 1.3 : 1.0;
    const value = Math.max(1, Math.round(dailyReservations * variation * weekendBoost));
    result.push({ day: days[dayIdx], value });
  }
  return result;
}

// ─── Shared Components ───────────────────────────────────────

/**
 * AnimatedCounter - Animates a number from 0 to target using requestAnimationFrame.
 * Uses ease-out cubic for natural deceleration feel.
 */
export function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '', decimals = 0 }: {
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
 * DailyReservationsChart - Pure SVG bar chart showing last 7 days of reservations
 */
export function DailyReservationsChart({ dailyReservations }: { dailyReservations: number }) {
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

          return (
            <g key={i}>
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
              <text
                x={x + barW / 2}
                y={chartH + 14}
                textAnchor="middle"
                className={`text-[9px] ${isToday ? 'fill-emerald-600 dark:fill-emerald-400 font-bold' : 'fill-muted-foreground'}`}
              >
                {d.day}
              </text>
              {isToday && (
                <circle cx={x + barW / 2} cy={chartH + 22} r={2} fill="#10b981" />
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
