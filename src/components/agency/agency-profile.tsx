'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  QrCode,
  Camera,
  Save,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { TranslationKeys } from '@/i18n';

interface AgencyInfo {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  address: string;
  addressAr?: string;
  category: string;
  phone: string;
  email?: string;
  code: string;
  logoUrl?: string;
}

const categoryOptions: { value: string; key: TranslationKeys }[] = [
  { value: 'CLINIC', key: 'catClinic' },
  { value: 'AGENCY', key: 'catAgency' },
  { value: 'LAW_FIRM', key: 'catLawFirm' },
  { value: 'LABORATORY', key: 'catLaboratory' },
  { value: 'GOVERNMENT', key: 'catGovernment' },
  { value: 'OTHER', key: 'catOther' },
];

export function AgencyProfile() {
  const { t, lang } = useLanguage();
  const [profile, setProfile] = useState<AgencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agency/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
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
      const res = await fetch('/api/agency/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast.success(t('success'));
        setEditMode(false);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof AgencyInfo, value: string) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const getCategoryLabel = (cat: string) => {
    const found = categoryOptions.find((c) => c.value === cat);
    return found ? t(found.key) : cat;
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('agencyProfile')}</h1>
        {editMode ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9"
              onClick={() => {
                setEditMode(false);
                fetchProfile();
              }}
            >
              <X className="h-4 w-4 me-1.5" />
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t('save')}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-9"
            onClick={() => setEditMode(true)}
          >
            <Pencil className="h-4 w-4 me-1.5" />
            {t('edit')}
          </Button>
        )}
      </div>

      {/* Agency Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          {/* Cover/Logo Area */}
          <div className="h-28 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
            <div className="absolute -bottom-10 start-5">
              <div className="h-20 w-20 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border-4 border-white dark:border-gray-800">
                {profile?.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo"
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-emerald-600" />
                )}
              </div>
            </div>
            {editMode && (
              <Button
                size="sm"
                className="absolute bottom-3 end-3 bg-white/20 text-white border-white/30 hover:bg-white/30 rounded-lg"
              >
                <Camera className="h-4 w-4 me-1.5" />
                {t('uploadLogo')}
              </Button>
            )}
          </div>

          <CardContent className="pt-14 p-5 space-y-4">
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('agencyName')} (EN)</Label>
                    <Input
                      value={profile?.name ?? ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('agencyName')} (AR)</Label>
                    <Input
                      value={profile?.nameAr ?? ''}
                      onChange={(e) => updateField('nameAr', e.target.value)}
                      className="h-11"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('agencyName')} (FR)</Label>
                    <Input
                      value={profile?.nameFr ?? ''}
                      onChange={(e) => updateField('nameFr', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('agencyCategory')}</Label>
                    <Select
                      value={profile?.category ?? 'OTHER'}
                      onValueChange={(v) => updateField('category', v)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {t(opt.key)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t('agencyAddress')}</Label>
                    <Input
                      value={profile?.address ?? ''}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('agencyPhone')}</Label>
                    <Input
                      value={profile?.phone ?? ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('agencyEmail')}</Label>
                    <Input
                      type="email"
                      value={profile?.email ?? ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground">{profile?.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    {getCategoryLabel(profile?.category ?? 'OTHER')}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{profile?.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{profile?.phone}</span>
                  </div>
                  {profile?.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{profile.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* QR Code / Agency Code */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-600" />
              {t('generateQR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                <QrCode className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">{t('agencyCode')}</p>
                <p className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400" dir="ltr">
                  {profile?.code || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this code with your customers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
