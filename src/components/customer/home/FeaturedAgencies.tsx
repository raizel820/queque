'use client';

import { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AgencyRatingDisplay } from '@/components/shared/agency-rating-display';
import type { AgencyListItem } from './types';
import { getAgencyName, getCategoryLabel } from './types';

interface FeaturedAgenciesProps {
  agencies: AgencyListItem[];
  loading: boolean;
  onSelectAgency: (agency: AgencyListItem) => void;
  onQuickJoin: (agencyId: string, serviceId?: string) => void;
  t: (key: import("@/i18n").TranslationKeys) => string;
  lang: string;
}

export function FeaturedAgencies({
  agencies,
  loading,
  onSelectAgency,
  onQuickJoin,
  t,
  lang,
}: FeaturedAgenciesProps) {
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const sponsored = agencies.filter(a => a.isSponsored);

  if (loading || sponsored.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          {t('featuredAgencies')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => featuredScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
            className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
          <button
            onClick={() => featuredScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
            className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>
      <div
        ref={featuredScrollRef}
        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
      >
        {sponsored.map((agency, idx) => {
          const estWait = agency.waitingCount * (agency.avgServiceTime || 10);
          return (
            <motion.button
              key={agency.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectAgency(agency)}
              className="flex-shrink-0 min-w-[220px] rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900/80 shadow-sm hover:shadow-md transition-all duration-200 p-4 text-start relative overflow-hidden"
            >
              {/* Shimmer gradient top border */}
              <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-pulse" />
              {/* Sponsored badge */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-700 text-[10px] px-1.5 shimmer-badge">
                  <Star className="h-2.5 w-2.5 me-0.5 fill-amber-500 text-amber-500" />
                  {t('sponsored')}
                </Badge>
                <span className="flex items-center gap-1 text-[10px] font-medium">
                  <span className={`h-1.5 w-1.5 rounded-full ${agency.isQueueOpen && !agency.isPaused ? 'bg-emerald-500' : agency.isPaused ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className={agency.isQueueOpen && !agency.isPaused ? 'text-emerald-600 dark:text-emerald-400' : agency.isPaused ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>
                    {agency.isPaused ? t('paused') : agency.isQueueOpen ? t('openNow') : t('closed')}
                  </span>
                </span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1 truncate">{getAgencyName(agency, lang)}</h3>
              <Badge variant="secondary" className="text-[10px] mb-1.5">{getCategoryLabel(agency.category, t)}</Badge>
              {(agency.reviewCount ?? 0) > 0 && (agency.averageRating ?? 0) > 0 && (
                <div className="mb-1.5">
                  <AgencyRatingDisplay averageRating={agency.averageRating ?? 0} totalCount={agency.reviewCount ?? 0} compact size="sm" />
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  ~{estWait} {t('estWaitBadge')}
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); if (agency.subscriptionStatus === 'ACTIVE') onQuickJoin(agency.id); }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${agency.subscriptionStatus !== 'ACTIVE' ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                  {agency.subscriptionStatus !== 'ACTIVE' ? t('inactiveAgency') : t('joinQueue')}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
