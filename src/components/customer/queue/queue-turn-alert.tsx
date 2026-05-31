'use client';

import { useRef, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { SlideToConfirm } from '@/components/shared/slide-to-confirm';
import { BellRing, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiParticles } from './queue-confetti';
import { getQueueAlertClass, getAgencyName } from './queue-utils';
import type { Reservation } from './queue-types';

interface QueueTurnAlertProps {
  show: boolean;
  reservation: Reservation | undefined;
  soundMuted: boolean;
  confettiKey: number;
  onConfirm: () => void;
  onMute: () => void;
  onUnmute: () => void;
}

export function QueueTurnAlert({
  show,
  reservation,
  soundMuted,
  confettiKey,
  onConfirm,
  onMute,
  onUnmute,
}: QueueTurnAlertProps) {
  const { t, lang } = useLanguage();
  const turnAlertRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to turn alert banner when it appears
  useEffect(() => {
    if (show && turnAlertRef.current) {
      turnAlertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [show]);

  if (!reservation) return null;

  return (
    <AnimatePresence>
      {show && reservation.status === 'CALLED' && (
        <motion.div
          ref={turnAlertRef}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-4"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-4 sm:p-5 text-white shadow-2xl shadow-emerald-500/40">
            {/* Confetti on CALLED */}
            <ConfettiParticles key={confettiKey} active={true} />
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
                }}
              />
            </div>
            {/* Animated glow border with scale pulse */}
            <motion.div
              animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.01, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl ring-2 ring-white/40"
            />
            {/* Dramatic outer glow */}
            <motion.div
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 blur-lg"
            />

            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex-shrink-0 h-10 w-10 sm:h-16 sm:w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-emerald-900/20"
                >
                  <BellRing className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-emerald-100">{t('yourTurnAlert')}</p>
                  <motion.p
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    className={getQueueAlertClass(reservation.queueNumber)}
                  >
                    {reservation.queueNumber}
                  </motion.p>
                  <p className="text-xs text-emerald-100 truncate">
                    {getAgencyName(reservation, lang)}
                  </p>
                </div>
                {/* Sound toggle */}
                <button
                  onClick={soundMuted ? onUnmute : onMute}
                  className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  title={soundMuted ? t('notificationSoundOn') : t('notificationSoundOff')}
                >
                  {soundMuted ? (
                    <VolumeX className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white/70" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                  )}
                </button>
              </div>

              {/* Slide to Confirm */}
              <SlideToConfirm onConfirm={onConfirm} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
