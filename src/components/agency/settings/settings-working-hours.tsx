'use client';

import { useLanguage } from '@/hooks/use-language';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import type { AgencySettingsData, UpdateSettingFn } from './types';

interface SettingsWorkingHoursProps {
  settings: AgencySettingsData | null;
  updateSetting: UpdateSettingFn;
}

export function SettingsWorkingHours({ settings, updateSetting }: SettingsWorkingHoursProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground -mt-1 mb-2">
        {t('workingHoursDesc' as any) || 'Set your business operating hours'}
      </p>
      <Label className="text-sm flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        {t('workingHours')}
      </Label>
      <div className="flex items-center gap-3">
        <Input
          type="time"
          value={settings?.workingHoursStart ?? '08:00'}
          onChange={(e) => updateSetting('workingHoursStart', e.target.value)}
          className="h-11 w-32"
          dir="ltr"
        />
        <span className="text-sm text-muted-foreground">—</span>
        <Input
          type="time"
          value={settings?.workingHoursEnd ?? '17:00'}
          onChange={(e) => updateSetting('workingHoursEnd', e.target.value)}
          className="h-11 w-32"
          dir="ltr"
        />
      </div>
    </div>
  );
}
