import type { TranslationKeys } from '@/i18n';
import {
  Stethoscope,
  Globe,
  Scale,
  FlaskConical,
  Landmark,
  Building2,
  Navigation,
} from 'lucide-react';

export interface AgencyListItem {
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
  waitingCount: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  avgServiceTime?: number;
  averageRating?: number;
  reviewCount?: number;
  subscriptionStatus?: string;
}

export interface AgencyDetail {
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
  averageRating?: number;
  reviewCount?: number;
  subscriptionStatus?: string;
}

export const categoryKeys: { key: TranslationKeys; value: string; icon: React.ElementType }[] = [
  { key: 'catAll', value: 'ALL', icon: Navigation },
  { key: 'catClinic', value: 'CLINIC', icon: Stethoscope },
  { key: 'catAgency', value: 'AGENCY', icon: Globe },
  { key: 'catLawFirm', value: 'LAW_FIRM', icon: Scale },
  { key: 'catLaboratory', value: 'LABORATORY', icon: FlaskConical },
  { key: 'catGovernment', value: 'GOVERNMENT', icon: Landmark },
  { key: 'catOther', value: 'OTHER', icon: Building2 },
];

export function getAgencyName(a: AgencyListItem | AgencyDetail, lang: string) {
  if (lang === 'ar' && a.nameAr) return a.nameAr;
  if (lang === 'fr' && a.nameFr) return a.nameFr;
  return a.name;
}

export function getCategoryLabel(cat: string, t: (key: TranslationKeys) => string) {
  const found = categoryKeys.find((c) => c.value === cat.toUpperCase());
  return found ? t(found.key) : cat;
}

export function isOpenNow(start: string, end: string) {
  if (!start || !end) return null;
  const now = new Date();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (startMin > endMin) {
    return cur >= startMin || cur < endMin;
  }
  return cur >= startMin && cur < endMin;
}

export function getTimeGreeting(t: (key: TranslationKeys) => string) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t('goodMorning');
  if (hour >= 12 && hour < 17) return t('goodAfternoon');
  if (hour >= 17 && hour < 21) return t('goodEvening');
  return t('goodNight');
}

export function getGreetingMessage(lang: string) {
  const hour = new Date().getHours();
  const messages: Record<string, Record<string, string>> = {
    morning: { ar: 'ابحث عن أقرب وكالة وانضم إلى الطابور', fr: 'Trouvez votre agence la plus proche et rejoignez la file', en: 'Find your nearest agency and join the queue' },
    afternoon: { ar: 'انضم إلى الطابور دون الانتظار في الصف', fr: 'Rejoignez une file sans attendre en ligne', en: 'Join a queue without waiting in line' },
    evening: { ar: 'وصول سريع إلى الطابور بين يديك', fr: 'Accès rapide à la file à portée de main', en: 'Quick queue access at your fingertips' },
    night: { ar: 'خطط لزيارتك القادمة غداً', fr: 'Planifiez votre prochaine visite demain', en: 'Plan your next visit tomorrow' },
  };
  let timeOfDay: string;
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';
  return messages[timeOfDay][lang] || messages[timeOfDay].en;
}
