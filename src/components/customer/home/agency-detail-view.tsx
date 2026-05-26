'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  TicketCheck,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react';
import type { TranslationKeys } from '@/i18n';
import type { AgencyDetail } from './home-types';
import { getAgencyName, getCategoryLabel, isOpenNow } from './home-types';
import { AgencyReviewsPreview } from './agency-reviews-preview';

interface AgencyDetailViewProps {
  agency: AgencyDetail;
  onBack: () => void;
  onJoinQueue: (agencyId: string, serviceId?: string) => void;
  t: (key: TranslationKeys) => string;
  lang: string;
}

export function AgencyDetailView({
  agency,
  onBack,
  onJoinQueue,
  t,
  lang,
}: AgencyDetailViewProps) {
  const totalWaiting = agency.services.reduce((sum, s) => sum + (s.waitingCount || 0), 0);
  const estWait = totalWaiting * (agency.avgServiceTime || 10);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-4 py-4 pb-24"
    >
      <button
        onClick={onBack}
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
            {getAgencyName(agency, lang)}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span>{agency.address}</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              {getCategoryLabel(agency.category, t)}
            </Badge>
            {agency.subscriptionStatus !== 'ACTIVE' && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">
                {t('inactiveAgency')}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={
                agency.isQueueOpen && !agency.isPaused
                  ? 'text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                  : 'text-xs bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
              }
            >
              {agency.isPaused ? t('paused') : agency.isQueueOpen ? t('openNow') : t('closed')}
            </Badge>
            {agency.workingHoursStart && agency.workingHoursEnd && (() => {
              const open = isOpenNow(agency.workingHoursStart, agency.workingHoursEnd);
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
                    ? `${t('openUntil')} ${agency.workingHoursEnd}`
                    : agency.isPaused
                      ? t('paused')
                      : `${t('closedNow')} · ${t('openFrom')} ${agency.workingHoursStart}`
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

          {/* Queue Unavailable Message for Inactive Subscriptions */}
          {agency.subscriptionStatus !== 'ACTIVE' && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">{t('queueUnavailable')}</p>
            </div>
          )}

          {/* Services */}
          {agency.services.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-foreground mb-3">{t('selectService')}</h3>
              <div className="space-y-2">
                {agency.services.map((svc) => (
                  <motion.button
                    key={svc.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onJoinQueue(agency.id, svc.id)}
                    disabled={agency.isPaused || !agency.isQueueOpen || agency.subscriptionStatus !== 'ACTIVE'}
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
          {agency.services.length === 0 && (
            <Button
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl"
              onClick={() => onJoinQueue(agency.id)}
              disabled={agency.isPaused || !agency.isQueueOpen || agency.subscriptionStatus !== 'ACTIVE'}
            >
              {agency.subscriptionStatus !== 'ACTIVE' ? t('queueUnavailable') : agency.isQueueOpen ? t('joinQueue') : t('closed')}
            </Button>
          )}

          {/* Reviews Section */}
          <AgencyReviewsPreview agencyId={agency.id} averageRating={agency.averageRating} reviewCount={agency.reviewCount} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
