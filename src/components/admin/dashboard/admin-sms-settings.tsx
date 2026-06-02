'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Wifi,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { SmsSettingsData, SmsProviderInfo, SmsUsageStats, SmsLogItem } from './types';
import { formatTime } from './utils';

interface AdminSmsSettingsProps {
  smsSettings: SmsSettingsData | null;
  smsStats: SmsUsageStats | null;
  smsLogs: SmsLogItem[];
  smsProviders: SmsProviderInfo[];
  smsLoading: boolean;
  smsSaving: boolean;
  smsTestLoading: boolean;
  smsValidating: boolean;
  t: (key: string) => string;
  lang: string;
  onSmsSettingsChange: (settings: SmsSettingsData) => void;
  onSave: () => void;
  onSendTest: () => void;
  onValidateGateway: () => void;
  onRefresh: () => void;
}

export function AdminSmsSettings({
  smsSettings,
  smsStats,
  smsLogs,
  smsProviders,
  smsLoading,
  smsSaving,
  smsTestLoading,
  smsValidating,
  t,
  lang,
  onSmsSettingsChange,
  onSave,
  onSendTest,
  onValidateGateway,
  onRefresh,
}: AdminSmsSettingsProps) {
  const handleProviderChange = (providerId: string) => {
    if (!smsSettings) return;
    const provider = smsProviders.find(p => p.id === providerId);
    onSmsSettingsChange({
      ...smsSettings,
      provider: providerId,
      apiUrl: provider?.defaultApiUrl || smsSettings.apiUrl,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 }}
    >
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              {t('smsConfigSection')}
            </CardTitle>
            <div className="flex items-center gap-2">
              {smsSettings?.enabled ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium">
                  <Check className="h-3 w-3 me-1" />
                  {t('smsEnabled')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {t('smsDisabled')}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                disabled={smsLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${smsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t('smsConfigDesc')}</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {smsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : smsSettings ? (
            <>
              {/* SMS Enable Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center shadow-sm">
                    <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('smsEnabled')}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {smsSettings.enabled ? t('smsEnabled') : t('smsDisabled')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={smsSettings.enabled}
                  onCheckedChange={(checked) => onSmsSettingsChange({ ...smsSettings, enabled: checked })}
                />
              </div>

              {/* SMS Configuration Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Provider */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('smsProvider')}</Label>
                  <select
                    value={smsSettings.provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="h-9 w-full px-3 rounded-lg border border-border bg-background text-sm"
                  >
                    {smsProviders.length > 0 ? smsProviders.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    )) : (
                      <>
                        <option value="winsms">WinSMS (winsms.dz)</option>
                        <option value="notifsend">NotifSend (notifsend.com)</option>
                        <option value="algeria_sms">{t('smsProviderAlgeriaSmsOption')}</option>
                        <option value="green_send">GreenSMS (greensms.ma)</option>
                        <option value="mtarget">M-Target (mtarget.dz)</option>
                        <option value="twilio">Twilio (twilio.com)</option>
                        <option value="vonage">Vonage / Nexmo (vonage.com)</option>
                        <option value="generic">{t('smsProviderGenericOption')}</option>
                      </>
                    )}
                  </select>
                  {(() => {
                    const prov = smsProviders.find(p => p.id === smsSettings.provider);
                    if (!prov) return null;
                    return (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {prov.description}
                        {!prov.senderIdSupport && ' ⚠️ Uses phone number as sender (not name)'}
                      </p>
                    );
                  })()}
                </div>

                {/* Sender Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('smsSenderName')}</Label>
                  <Input
                    value={smsSettings.senderName}
                    onChange={(e) => onSmsSettingsChange({ ...smsSettings, senderName: e.target.value })}
                    className="h-9 text-sm"
                    placeholder="BLASTI"
                  />
                </div>

                {/* API URL */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('smsApiUrl')}</Label>
                  <Input
                    value={smsSettings.apiUrl}
                    onChange={(e) => onSmsSettingsChange({ ...smsSettings, apiUrl: e.target.value })}
                    className="h-9 text-sm"
                    placeholder="https://api.example.com/sms"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('smsApiKey')}</Label>
                  <Input
                    value={smsSettings.apiKey}
                    onChange={(e) => onSmsSettingsChange({ ...smsSettings, apiKey: e.target.value })}
                    className="h-9 text-sm"
                    type="password"
                    placeholder="••••••••••"
                  />
                </div>

                {/* Test Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('testPhoneNumber')}</Label>
                  <Input
                    value={smsSettings.testPhoneNumber ?? ''}
                    onChange={(e) => onSmsSettingsChange({ ...smsSettings, testPhoneNumber: e.target.value })}
                    className="h-9 text-sm"
                    placeholder="+213XXXXXXXXX"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-muted-foreground">{t('smsPhoneFormat') || 'Algerian format: +213XXXXXXXXX or 0XXXXXXXXX'}</p>
                </div>

                {/* SMS Per Reminder */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('smsPerReminder')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={smsSettings.smsPerReminder}
                    onChange={(e) => onSmsSettingsChange({ ...smsSettings, smsPerReminder: parseInt(e.target.value) || 1 })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={onSave}
                  disabled={smsSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-9 px-4 text-sm"
                >
                  {smsSaving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Save className="h-4 w-4 me-1.5" />}
                  {t('save')}
                </Button>
                <Button
                  variant="outline"
                  onClick={onSendTest}
                  disabled={smsTestLoading || !smsSettings.testPhoneNumber}
                  className="rounded-xl h-9 px-4 text-sm"
                >
                  {smsTestLoading ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Send className="h-4 w-4 me-1.5" />}
                  {t('smsTestSend')}
                </Button>
                <Button
                  variant="outline"
                  onClick={onValidateGateway}
                  disabled={smsValidating || !smsSettings.apiUrl}
                  className="rounded-xl h-9 px-4 text-sm border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  {smsValidating ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Wifi className="h-4 w-4 me-1.5" />}
                  {t('smsValidateConnection') || 'Validate Connection'}
                </Button>
              </div>

              {/* SMS Usage Stats */}
              {smsStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{smsStats.sentToday}</span>
                    <span className="text-[10px] text-muted-foreground">{t('smsSentToday')}</span>
                  </div>
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/10">
                    <span className="text-lg font-bold text-teal-700 dark:text-teal-400">{smsStats.sentThisWeek}</span>
                    <span className="text-[10px] text-muted-foreground">{t('smsSentThisWeek')}</span>
                  </div>
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{smsStats.sentThisMonth}</span>
                    <span className="text-[10px] text-muted-foreground">{t('smsSentThisMonth')}</span>
                  </div>
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    <span className="text-lg font-bold text-foreground">{smsStats.totalSent}</span>
                    <span className="text-[10px] text-muted-foreground">{t('smsTotalSent')}</span>
                  </div>
                </div>
              )}

              {/* Recent SMS Logs */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {t('smsLogs')}
                </p>
                {smsLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">{t('noSmsLogs')}</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {smsLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-xs"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                            log.status === 'SENT'
                              ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                              : log.status === 'FAILED'
                              ? 'border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-400'
                              : 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {log.status}
                        </Badge>
                        <span className="text-muted-foreground truncate flex-shrink-0">{log.phoneNumber}</span>
                        <span className="text-foreground truncate flex-1 min-w-0">{log.message.slice(0, 60)}</span>
                        <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap">
                          {formatTime(log.createdAt, lang)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
