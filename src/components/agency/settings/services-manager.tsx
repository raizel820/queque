'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit3, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export interface AgencyService {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  prefix: string;
}

interface ServicesManagerProps {
  services: AgencyService[];
  onRefresh: () => void;
}

export function ServicesManager({ services, onRefresh }: ServicesManagerProps) {
  const { t } = useLanguage();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AgencyService | null>(null);
  const [svcName, setSvcName] = useState('');
  const [svcNameAr, setSvcNameAr] = useState('');
  const [svcNameFr, setSvcNameFr] = useState('');
  const [svcPrefix, setSvcPrefix] = useState('');

  const openAddServiceDialog = () => {
    setEditingService(null);
    setSvcName('');
    setSvcNameAr('');
    setSvcNameFr('');
    setSvcPrefix('');
    setDialogOpen(true);
  };

  const openEditServiceDialog = (svc: AgencyService) => {
    setEditingService(svc);
    setSvcName(svc.name);
    setSvcNameAr(svc.nameAr || '');
    setSvcNameFr(svc.nameFr || '');
    setSvcPrefix(svc.prefix);
    setDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!svcName.trim() || !svcPrefix.trim()) {
      toast.error(t('requiredField'));
      return;
    }

    try {
      const url = editingService
        ? `/api/agency/services/${editingService.id}`
        : '/api/agency/services';
      const method = editingService ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: svcName.trim(),
          nameAr: svcNameAr.trim() || undefined,
          nameFr: svcNameFr.trim() || undefined,
          prefix: svcPrefix.trim().toUpperCase(),
        }),
      });

      if (res.ok) {
        toast.success(t('success'));
        setDialogOpen(false);
        onRefresh();
      }
    } catch {
      toast.error(t('error'));
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/agency/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('success'));
        onRefresh();
      }
    } catch {
      toast.error(t('error'));
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground -mt-1 mb-2">{t('servicesDesc') || 'Manage the services your agency offers'}</p>
      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          {t('services')}
        </Label>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 text-xs"
          onClick={openAddServiceDialog}
        >
          <Plus className="h-3.5 w-3.5 me-1" />
          {t('addService')}
        </Button>
      </div>
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {svc.prefix}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{svc.name}</p>
                  {svc.nameAr && (
                    <p className="text-xs text-muted-foreground">{svc.nameAr}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => openEditServiceDialog(svc)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  onClick={() => handleDeleteService(svc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? t('edit') : t('addService')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingService ? t('edit') : t('addService')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('serviceName')} (English)</Label>
              <Input
                value={svcName}
                onChange={(e) => setSvcName(e.target.value)}
                placeholder="General Consultation"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('serviceName')} (العربية)</Label>
              <Input
                value={svcNameAr}
                onChange={(e) => setSvcNameAr(e.target.value)}
                placeholder="استشارة عامة"
                className="h-11"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('serviceName')} (Français)</Label>
              <Input
                value={svcNameFr}
                onChange={(e) => setSvcNameFr(e.target.value)}
                placeholder="Consultation générale"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('servicePrefix')}</Label>
              <Input
                value={svcPrefix}
                onChange={(e) => setSvcPrefix(e.target.value.toUpperCase())}
                placeholder="A"
                className="h-11 w-24"
                maxLength={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveService}
            >
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
