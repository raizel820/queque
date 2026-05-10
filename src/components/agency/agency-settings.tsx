'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Save,
  Clock,
  Users,
  ToggleLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface AgencyService {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  prefix: string;
}

interface AgencySettingsData {
  avgServiceTime: number;
  maxReservations: number;
  isQueueOpen: boolean;
  services: AgencyService[];
}

export function AgencySettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AgencySettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AgencyService | null>(null);
  const [svcName, setSvcName] = useState('');
  const [svcNameAr, setSvcNameAr] = useState('');
  const [svcNameFr, setSvcNameFr] = useState('');
  const [svcPrefix, setSvcPrefix] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agency/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agency/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success(t('success'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

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
        fetchSettings();
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
        fetchSettings();
      }
    } catch {
      toast.error(t('error'));
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
          {t('save')}
        </Button>
      </div>

      {/* Queue Settings */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ToggleLeft className="h-4 w-4 text-emerald-600" />
              {t('queueManagement')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Queue Open/Close */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {settings?.isQueueOpen ? t('queueOpen') : t('queueClosedStatus')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {settings?.isQueueOpen ? t('openNow') : t('closed')}
                </p>
              </div>
              <Switch
                checked={settings?.isQueueOpen ?? false}
                onCheckedChange={(checked) =>
                  setSettings((prev) => (prev ? { ...prev, isQueueOpen: checked } : prev))
                }
              />
            </div>

            <Separator />

            {/* Average Service Time */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {t('avgServiceTime')}
                </Label>
                <span className="text-sm font-semibold text-emerald-600">
                  {settings?.avgServiceTime ?? 10} {t('min')}
                </span>
              </div>
              <Slider
                value={[settings?.avgServiceTime ?? 10]}
                onValueChange={([v]) =>
                  setSettings((prev) => (prev ? { ...prev, avgServiceTime: v } : prev))
                }
                min={1}
                max={60}
                step={1}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Max Reservations */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {t('maxReservations')}
              </Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={settings?.maxReservations ?? 50}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, maxReservations: parseInt(e.target.value) || 50 } : prev
                  )
                }
                className="h-11 w-32"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Service Management */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-600" />
                {t('manageServices')}
              </CardTitle>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9"
                onClick={openAddServiceDialog}
              >
                <Plus className="h-4 w-4 me-1.5" />
                {t('addService')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {settings?.services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('noData')}</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {settings?.services.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50"
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? t('edit') : t('addService')}
            </DialogTitle>
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
