'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/use-language';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { getAgencyName } from './queue-utils';
import type { Reservation } from './queue-types';

interface QueueQrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
}

export function QueueQrCodeDialog({
  open,
  onOpenChange,
  reservation,
}: QueueQrCodeDialogProps) {
  const { t, lang } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-600" />
            {t('qrCodeTitle')}
          </DialogTitle>
          <DialogDescription>{t('qrCodeDesc')}</DialogDescription>
        </DialogHeader>
        {reservation && (
          <div className="flex flex-col items-center gap-4 py-4">
            {/* QR Code placeholder with ticket info */}
            <div className="relative p-4 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700">
              <svg className="h-48 w-48" viewBox="0 0 200 200" fill="none">
                {/* QR code corner squares */}
                <rect x="10" y="10" width="60" height="60" rx="4" className="fill-emerald-600" />
                <rect x="130" y="10" width="60" height="60" rx="4" className="fill-emerald-600" />
                <rect x="10" y="130" width="60" height="60" rx="4" className="fill-emerald-600" />
                {/* Inner white squares for QR corners */}
                <rect x="18" y="18" width="44" height="44" rx="2" className="fill-white" />
                <rect x="138" y="18" width="44" height="44" rx="2" className="fill-white" />
                <rect x="18" y="138" width="44" height="44" rx="2" className="fill-white" />
                <rect x="26" y="26" width="28" height="28" rx="1" className="fill-emerald-600" />
                <rect x="146" y="26" width="28" height="28" rx="1" className="fill-emerald-600" />
                <rect x="26" y="146" width="28" height="28" rx="1" className="fill-emerald-600" />
                {/* Data pattern dots */}
                <rect x="80" y="10" width="8" height="8" className="fill-emerald-500" />
                <rect x="96" y="10" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="10" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="26" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="26" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="42" width="8" height="8" className="fill-emerald-500" />
                <rect x="96" y="42" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="42" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="58" width="8" height="8" className="fill-emerald-500" />
                <rect x="96" y="58" width="8" height="8" className="fill-emerald-500" />
                <rect x="10" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="26" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="42" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="58" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="96" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="130" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="146" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="162" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="178" y="80" width="8" height="8" className="fill-emerald-500" />
                <rect x="10" y="96" width="8" height="8" className="fill-emerald-500" />
                <rect x="42" y="96" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="96" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="96" width="8" height="8" className="fill-emerald-500" />
                <rect x="130" y="96" width="8" height="8" className="fill-emerald-500" />
                <rect x="162" y="96" width="8" height="8" className="fill-emerald-500" />
                <rect x="10" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="26" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="42" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="58" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="96" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="130" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="146" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="178" y="112" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="130" width="8" height="8" className="fill-emerald-500" />
                <rect x="96" y="130" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="130" width="8" height="8" className="fill-emerald-500" />
                <rect x="130" y="130" width="8" height="8" className="fill-emerald-500" />
                <rect x="146" y="130" width="8" height="8" className="fill-emerald-500" />
                <rect x="162" y="130" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="146" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="146" width="8" height="8" className="fill-emerald-500" />
                <rect x="130" y="146" width="8" height="8" className="fill-emerald-500" />
                <rect x="162" y="146" width="8" height="8" className="fill-emerald-500" />
                <rect x="178" y="146" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="162" width="8" height="8" className="fill-emerald-500" />
                <rect x="96" y="162" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="162" width="8" height="8" className="fill-emerald-500" />
                <rect x="130" y="162" width="8" height="8" className="fill-emerald-500" />
                <rect x="146" y="162" width="8" height="8" className="fill-emerald-500" />
                <rect x="80" y="178" width="8" height="8" className="fill-emerald-500" />
                <rect x="96" y="178" width="8" height="8" className="fill-emerald-500" />
                <rect x="112" y="178" width="8" height="8" className="fill-emerald-500" />
                <rect x="146" y="178" width="8" height="8" className="fill-emerald-500" />
                <rect x="162" y="178" width="8" height="8" className="fill-emerald-500" />
                <rect x="178" y="178" width="8" height="8" className="fill-emerald-500" />
                {/* Center label */}
                <rect x="82" y="132" width="36" height="36" rx="4" className="fill-white" />
                <text x="100" y="156" textAnchor="middle" className="fill-emerald-600" fontSize="10" fontWeight="bold">QW</text>
              </svg>
            </div>
            {/* Ticket Info Display */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-xs text-muted-foreground">{t('myQueue')}</span>
                <span className="text-sm font-bold text-foreground">{reservation.queueNumber}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-xs text-muted-foreground">{getAgencyName(reservation, lang)}</span>
                <span className="text-sm font-medium text-foreground">#{reservation.position}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2"
              onClick={() => {
                toast.info(t('comingSoon'));
              }}
            >
              <QrCode className="h-4 w-4" />
              {t('downloadQR')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
