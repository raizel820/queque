'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  ChevronRight,
  Loader2,
  TicketCheck,
  Clock,
  Heart,
  MapPin,
  UserRound,
  Zap,
  Briefcase,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AgencyRatingDisplay } from '@/components/shared/agency-rating-display';
import type { AgencyListItem } from './types';
import { getAgencyName, getCategoryLabel } from './types';

interface AgencyCardProps {
  agency: AgencyListItem;
  idx: number;
  onSelectAgency: (agency: AgencyListItem) => void;
  onQuickJoin: (agencyId: string, serviceId?: string) => void;
  onToggleFavorite: (e: React.MouseEvent, agencyId: string) => void;
  isFavorite: boolean;
  isTogglingFav: boolean;
  t: (key: import("@/i18n").TranslationKeys) => string;
  lang: string;
}

export function AgencyCard({
  agency,
  idx,
  onSelectAgency,
  onQuickJoin,
  onToggleFavorite,
  isFavorite,
  isTogglingFav,
  t,
  lang,
}: AgencyCardProps) {
  const estWait = agency.waitingCount * (agency.avgServiceTime || 10);
  const queueStatus = agency.isQueueOpen && !agency.isPaused ? 'open' : agency.isPaused ? 'paused' : 'closed';
  const distKm = ((idx + 1) * 0.5 + (idx * 0.3)).toFixed(1);

  return (
    <motion.div
      key={agency.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.07 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group card-hover-scale"
    >
      <Card
        className={`h-full cursor-pointer border-0 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 hover:-translate-y-0.5 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 relative overflow-hidden ${agency.isSponsored ? 'ring-1 ring-amber-200 dark:ring-amber-800/50' : ''}`}
        onClick={() => onSelectAgency(agency)}
      >
        {/* Gradient top border for sponsored agencies */}
        {agency.isSponsored && (
          <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 shimmer-gradient" />
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors duration-300">
              <TicketCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {agency.isSponsored && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 text-[10px] px-1.5 shimmer-badge">
                  <Star className="h-2.5 w-2.5 me-0.5 fill-amber-500 text-amber-500" />
                  {t('sponsored')}
                </Badge>
              )}
              {/* Inactive subscription badge */}
              {agency.subscriptionStatus !== 'ACTIVE' && (
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">
                  {t('inactiveAgency')}
                </Badge>
              )}
              {/* Queue status indicator with dot */}
              <span className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${queueStatus === 'open' ? 'bg-emerald-500' : queueStatus === 'paused' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <Badge
                  variant="outline"
                  className={
                    queueStatus === 'open'
                      ? 'text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                      : queueStatus === 'paused'
                        ? 'text-[10px] bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200'
                        : 'text-[10px] bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                  }
                >
                  {agency.isPaused ? t('paused') : agency.isQueueOpen ? t('openNow') : t('closed')}
                </Badge>
              </span>
            </div>
          </div>

          <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {getAgencyName(agency, lang)}
          </h3>

          <p className="text-xs text-muted-foreground mb-2 line-clamp-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {agency.address}
            <span className="ms-auto text-emerald-600 dark:text-emerald-400 font-medium">{distKm} km</span>
          </p>

          {/* Estimated wait time badge */}
          {agency.isQueueOpen && !agency.isPaused && (
            <div className="flex items-center gap-1.5 mb-2">
              <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border-teal-200">
                <Clock className="h-2.5 w-2.5 me-1" />
                ~{estWait} {t('estWaitBadge')}
              </Badge>
              {agency.serviceCount > 1 && (
                <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200">
                  <Briefcase className="h-2.5 w-2.5 me-1" />
                  {agency.serviceCount} {t('services')}
                </Badge>
              )}
            </div>
          )}

          {/* Rating display */}
          {(agency.reviewCount ?? 0) > 0 && (agency.averageRating ?? 0) > 0 && (
            <div className="mb-2">
              <AgencyRatingDisplay
                averageRating={agency.averageRating ?? 0}
                totalCount={agency.reviewCount ?? 0}
                compact
                size="sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {getCategoryLabel(agency.category, t)}
              </Badge>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <UserRound className="h-3 w-3" />
                {agency.waitingCount} {t('waiting')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Heart favorite button */}
              <button
                onClick={(e) => onToggleFavorite(e, agency.id)}
                disabled={isTogglingFav}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                {isTogglingFav ? (
                  <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                ) : isFavorite ? (
                  <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                ) : (
                  <Heart className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                )}
              </button>
              {/* Quick Join button for single-service agencies */}
              {agency.isQueueOpen && !agency.isPaused && agency.serviceCount === 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (agency.subscriptionStatus === 'ACTIVE') onQuickJoin(agency.id); }}
                  disabled={agency.subscriptionStatus !== 'ACTIVE'}
                  className={`h-7 px-2.5 rounded-full flex items-center gap-1 text-[10px] font-medium transition-colors ${agency.subscriptionStatus !== 'ACTIVE' ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                  <Zap className="h-3 w-3" />
                  {agency.subscriptionStatus !== 'ACTIVE' ? t('inactiveAgency') : t('joinQueue')}
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
  );
}
