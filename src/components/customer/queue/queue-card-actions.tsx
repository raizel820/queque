'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import {
  XCircle,
  Loader2,
  AlertTriangle,
  Share2,
  QrCode,
  ShieldAlert,
  Star,
  ArrowDown,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAgencyName } from './queue-utils';
import type { Reservation } from './queue-types';

interface QueueCardActionsProps {
  reservation: Reservation;
  isCalled: boolean;
  cancelling: string | null;
  feedbackSubmittedIds: Set<string>;
  onCancel: (id: string) => void;
  onPostpone: (id: string) => void;
  onLeaveQueue: () => void;
  onEmergencyCancel: (id: string) => void;
  onReclaim: (id: string) => void;
  onSharePosition: (res: Reservation) => void;
  onOpenQrCode: (res: Reservation) => void;
  onOpenRating: (id: string) => void;
  onToggleFixedTime: (id: string, current: boolean) => void;
}

export function QueueCardActions({
  reservation: res,
  isCalled,
  cancelling,
  feedbackSubmittedIds,
  onCancel,
  onPostpone,
  onLeaveQueue,
  onEmergencyCancel,
  onReclaim,
  onSharePosition,
  onOpenQrCode,
  onOpenRating,
  onToggleFixedTime,
}: QueueCardActionsProps) {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* Share Position + QR Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 gap-2 shadow-sm hover:shadow-md transition-all duration-200"
            onClick={() => onSharePosition(res)}
          >
            <Share2 className="h-4 w-4" />
            {t('sharePosition') || 'Share'}
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 gap-2 shadow-sm hover:shadow-md transition-all duration-200"
            onClick={() => onOpenQrCode(res)}
          >
            <QrCode className="h-4 w-4" />
            {t('shareViaQR')}
          </Button>
        </motion.div>
      </div>

      {/* Cancel, Postpone & Leave Queue Buttons */}
      {res.status === 'WAITING' && (
        <div className="space-y-2">
          {/* Fixed Time Toggle */}
          {res.preferredTime && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate">
                    {res.fixedTimeEnabled ? t('fixedTimeOn') : t('fixedTimeOff')}
                  </p>
                  {res.fixedTimeEnabled && res.preferredTime && (
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70" dir="ltr">{res.preferredTime}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2 rounded-lg border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                onClick={() => onToggleFixedTime(res.id, res.fixedTimeEnabled || false)}
                disabled={cancelling === res.id}
              >
                {t('toggleFixedTime')}
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                onClick={() => onCancel(res.id)}
                disabled={cancelling === res.id}
              >
                {cancelling === res.id ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <XCircle className="h-4 w-4 me-2" />
                )}
                <span className="text-sm">{t('cancelReservation')}</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-300"
                onClick={() => onPostpone(res.id)}
              >
                <ArrowDown className="h-4 w-4 me-2" />
                <span className="text-sm">{t('postponeTurn')}</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 font-semibold transition-all duration-300 gap-2"
                onClick={onLeaveQueue}
              >
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{t('leaveQueue')}</span>
              </Button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Skipped - Reclaim Button */}
      {res.skippedForNoShow && res.status === 'CALLED' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-400">{t('skippedWarning')}</span>
          </div>
          <Button
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300"
            onClick={() => onReclaim(res.id)}
            disabled={cancelling === res.id}
          >
            {cancelling === res.id ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <ShieldAlert className="h-4 w-4 me-2" />
            )}
            {t('reclaimPosition')}
          </Button>
        </motion.div>
      )}

      {/* Feedback for COMPLETED reservations */}
      {res.status === 'COMPLETED' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3"
        >
          {feedbackSubmittedIds.has(res.id) || res.rating ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {t('ratingSubmitted')}
              </span>
              {res.rating && (
                <div className="flex items-center gap-0.5 ms-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${s <= res.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Button
              className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300 gap-2"
              onClick={() => onOpenRating(res.id)}
            >
              <Star className="h-4 w-4" />
              {t('rateExperience')}
            </Button>
          )}
        </motion.div>
      )}

      {/* Emergency Cancel Button - shown only for WAITING status */}
      {res.status === 'WAITING' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3"
        >
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl border-2 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 font-semibold transition-all duration-300 gap-2"
            onClick={() => onEmergencyCancel(res.id)}
          >
            <ShieldAlert className="h-4 w-4" />
            {t('emergencyCancel')}
          </Button>
        </motion.div>
      )}

      {/* CALLED — prominent info */}
      {isCalled && (
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('statusCalled')} — {getAgencyName(res, lang)}
          </div>
        </motion.div>
      )}
    </>
  );
}
