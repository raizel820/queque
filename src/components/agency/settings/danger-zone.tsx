'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DangerZoneProps {
  userId: string | undefined;
  onDeleted: () => void;
}

export function DangerZone({ userId, onDeleted }: DangerZoneProps) {
  const { t, lang } = useLanguage();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteWord = lang === 'ar' ? 'حذف' : lang === 'fr' ? 'supprimer' : 'delete';

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success(t('accountDeleted'));
        setDeleteDialogOpen(false);
        onDeleted();
      } else {
        const data = await res.json();
        toast.error(data.error || t('deleteAccountError'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('deleteAccountDesc')}</p>
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmText(''); }}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl h-10"
          >
            <Trash2 className="h-4 w-4 me-2" />
            {t('deleteAccount')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t('deleteAccount')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t('deleteAccountDesc')}</p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  ⚠️ {t('deleteAccountWarning')}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('typeDeleteToConfirm')}</p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteWord}
                  className="h-10"
                  dir="ltr"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogCancel className="w-full rounded-xl h-10">
              {t('cancel')}
            </AlertDialogCancel>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteLoading || deleteConfirmText !== deleteWord}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-10"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Trash2 className="h-4 w-4 me-2" />}
              {t('deleteAccount')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
