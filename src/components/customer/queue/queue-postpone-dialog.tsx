'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/use-language';
import { ArrowDown, Loader2 } from 'lucide-react';

interface QueuePostponeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postponePositions: number;
  onSetPostponePositions: (n: number) => void;
  onConfirm: () => void;
  loading: boolean;
}

export function QueuePostponeDialog({
  open,
  onOpenChange,
  postponePositions,
  onSetPostponePositions,
  onConfirm,
  loading,
}: QueuePostponeDialogProps) {
  const { t, lang } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5 text-amber-600" />
            {t('postponeTurn')}
          </DialogTitle>
          <DialogDescription>
            {t('postponeLimit')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('postponeBy')}</Label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => onSetPostponePositions(n)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    postponePositions === n
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-110'
                      : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-900/20 hover:text-amber-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('postponePositions')}: <span className="font-semibold text-amber-600">{postponePositions}</span>
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl">
            {lang === 'ar' ? 'إلغاء' : lang === 'fr' ? 'Annuler' : 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
            {t('postponeConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
