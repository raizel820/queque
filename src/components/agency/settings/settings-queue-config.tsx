'use client';

import { useLanguage } from '@/hooks/use-language';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Clock, Users } from 'lucide-react';
import { CustomToggle } from './custom-toggle';
import type { AgencySettingsData, UpdateSettingFn } from './types';

interface SettingsQueueConfigProps {
  settings: AgencySettingsData | null;
  updateSetting: UpdateSettingFn;
}

export function SettingsQueueConfig({ settings, updateSetting }: SettingsQueueConfigProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground -mt-1 mb-2">
        {t('capacityDesc') || 'Configure queue limits and service timing'}
      </p>
      {/* Max Active Reservations */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          {t('maxActiveReservations')}
        </Label>
        <p className="text-[11px] text-muted-foreground">{t('maxReservations')}</p>
        <Input
          type="number"
          min={1}
          max={500}
          value={settings?.maxReservations ?? 50}
          onChange={(e) =>
            updateSetting('maxReservations', parseInt(e.target.value) || 50)
          }
          className="h-11 w-40"
        />
      </div>

      <Separator />

      {/* Auto-Pause Toggle */}
      <CustomToggle
        checked={settings?.autoPauseWhenFull ?? false}
        onCheckedChange={(v) => updateSetting('autoPauseWhenFull', v)}
        label={t('autoPause')}
        description={t('autoPauseDesc')}
      />

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
          onValueChange={([v]) => updateSetting('avgServiceTime', v)}
          min={1}
          max={60}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
}
