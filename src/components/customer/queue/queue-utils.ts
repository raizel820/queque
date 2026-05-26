import type { Language } from '@/i18n';
import type { Reservation } from './queue-types';

export function getAgencyName(r: Reservation, lang: Language): string {
  if (lang === 'ar' && r.agencyNameAr) return r.agencyNameAr;
  if (lang === 'fr' && r.agencyNameFr) return r.agencyNameFr;
  return r.agencyName;
}

export function getServiceName(r: Reservation, lang: Language): string {
  if (lang === 'ar' && r.serviceNameAr) return r.serviceNameAr;
  if (lang === 'fr' && r.serviceNameFr) return r.serviceNameFr;
  return r.serviceName;
}

export function padZero(n: number): string {
  return String(n).padStart(2, '0');
}

// Dynamic font sizing for queue numbers based on string length
export function getQueueRingClass(qNum: string): string {
  const len = qNum.length;
  if (len > 7) return 'text-xs sm:text-sm font-black';
  if (len > 4) return 'text-base sm:text-lg font-black';
  return 'text-2xl sm:text-3xl font-black';
}

export function getQueueHeaderClass(qNum: string): string {
  const len = qNum.length;
  if (len > 8) return 'text-base font-black tracking-tight';
  if (len > 5) return 'text-lg font-black tracking-tight';
  return 'text-2xl font-black tracking-tight';
}

export function getQueueAlertClass(qNum: string): string {
  const len = qNum.length;
  if (len > 8) return 'text-base sm:text-xl font-black tracking-tight drop-shadow-lg';
  if (len > 5) return 'text-lg sm:text-2xl font-black tracking-tight drop-shadow-lg';
  return 'text-xl sm:text-4xl font-black tracking-tight drop-shadow-lg';
}

export function formatDateLocalized(dateStr: string, lang: Language): string {
  const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}
