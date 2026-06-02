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
import { XCircle, Loader2 } from 'lucide-react';

interface QueueLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLeaving: boolean;
  onConfirm: () => void;
}

export function QueueLeaveDialog({
  open,
  onOpenChange,
  isLeaving,
  onConfirm,
}: QueueLeaveDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-500" />
            {t('leaveQueueConfirm') || 'Leave Queue?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('leaveQueueDesc') || 'Are you sure you want to leave the queue? This action cannot be undone and you will lose your position.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={onConfirm}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('leaving') || 'Leaving...'}
              </span>
            ) : (
              t('leaveQueue') || 'Leave Queue'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
