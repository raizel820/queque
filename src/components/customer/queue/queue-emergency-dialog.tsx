'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/hooks/use-language';
import { ShieldAlert } from 'lucide-react';

interface QueueEmergencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string | null;
  onConfirm: (id: string) => void;
}

export function QueueEmergencyDialog({
  open,
  onOpenChange,
  reservationId,
  onConfirm,
}: QueueEmergencyDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
            {t('emergencyCancel')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('emergencyCancelDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => {
              if (reservationId) {
                onConfirm(reservationId);
              }
              onOpenChange(false);
            }}
          >
            {t('emergencyCancelConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
