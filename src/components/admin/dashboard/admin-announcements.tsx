'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  Plus,
  Trash2,
  X,
  Info,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { AnnouncementItem } from './types';

interface AdminAnnouncementsProps {
  announcements: AnnouncementItem[];
  newAnnMsg: string;
  newAnnType: 'INFO' | 'WARNING' | 'URGENT';
  annLoading: boolean;
  dismissedAnnouncements: Set<string>;
  userId: string | undefined;
  t: (key: string) => string;
  lang: string;
  onNewAnnMsgChange: (msg: string) => void;
  onNewAnnTypeChange: (type: 'INFO' | 'WARNING' | 'URGENT') => void;
  onCreateAnnouncement: () => void;
  onDeleteAnnouncement: (id: string) => void;
  onDismissAnnouncement: (id: string) => void;
}

export function AdminAnnouncements({
  announcements,
  newAnnMsg,
  newAnnType,
  annLoading,
  dismissedAnnouncements,
  t,
  lang,
  onNewAnnMsgChange,
  onNewAnnTypeChange,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  onDismissAnnouncement,
}: AdminAnnouncementsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">{t('systemAnnouncements')}</h2>
          </div>
        </div>
        {/* Create Announcement Form */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 mb-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">{t('createAnnouncement')}</h3>
            </div>
            <Textarea
              value={newAnnMsg}
              onChange={(e) => onNewAnnMsgChange(e.target.value)}
              placeholder={t('announcementMessagePlaceholder')}
              className="min-h-[80px] resize-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('announcementType')}:</span>
              <select
                value={newAnnType}
                onChange={(e) => onNewAnnTypeChange(e.target.value as 'INFO' | 'WARNING' | 'URGENT')}
                className="h-9 px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
              >
                <option value="INFO">{t('announcementTypeInfo')}</option>
                <option value="WARNING">{t('announcementTypeWarning')}</option>
                <option value="URGENT">{t('announcementTypeUrgent')}</option>
              </select>
            </div>
            <Button
              onClick={onCreateAnnouncement}
              disabled={annLoading || !newAnnMsg.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-10"
            >
              {annLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Plus className="h-4 w-4 me-2" />}
              {t('createAnnouncement')}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {announcements
            .filter(a => !dismissedAnnouncements.has(a.id))
            .slice(0, 5)
            .map((announcement, idx) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className={`flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm ${
                  announcement.type === 'URGENT'
                    ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200/50 dark:border-rose-800/30'
                    : announcement.type === 'WARNING'
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30'
                    : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30'
                }`}>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    announcement.type === 'URGENT'
                      ? 'bg-rose-200 dark:bg-rose-900/30'
                      : announcement.type === 'WARNING'
                      ? 'bg-amber-200 dark:bg-amber-900/30'
                      : 'bg-emerald-200 dark:bg-emerald-900/30'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 ${
                      announcement.type === 'URGENT'
                        ? 'text-rose-600 dark:text-rose-400'
                        : announcement.type === 'WARNING'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{announcement.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {announcement.type === 'URGENT' ? t('announcementTypeUrgent') : announcement.type === 'WARNING' ? t('announcementTypeWarning') : t('announcementTypeInfo')}
                      {' · '}{new Date(announcement.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-red-500"
                      onClick={() => onDeleteAnnouncement(announcement.id)}
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onDismissAnnouncement(announcement.id)}
                      aria-label={t('dismiss')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
          ))}
          {announcements.filter(a => !dismissedAnnouncements.has(a.id)).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noAnnouncements')}</p>
          )}
        </div>
      </>
    </motion.div>
  );
}
