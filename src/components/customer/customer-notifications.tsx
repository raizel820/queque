'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  Trash2,
  Volume2,
  TicketCheck,
  AlertTriangle,
  Clock,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

function getNotificationConfig(type: string) {
  switch (type) {
    case 'QUEUE_CALLED':
      return { icon: Volume2, color: 'border-l-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' };
    case 'QUEUE_JOINED':
      return { icon: TicketCheck, color: 'border-l-teal-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30', iconColor: 'text-teal-600 dark:text-teal-400' };
    case 'QUEUE_COMPLETED':
      return { icon: Check, color: 'border-l-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' };
    case 'QUEUE_CANCELLED':
      return { icon: AlertTriangle, color: 'border-l-red-500', iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' };
    case 'TURN_APPROACHING':
      return { icon: Clock, color: 'border-l-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' };
    default:
      return { icon: Info, color: 'border-l-gray-400', iconBg: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-600 dark:text-gray-400' };
  }
}

export function CustomerNotifications() {
  const { user } = useAppStore();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading('all');
    try {
      const res = await fetch(`/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) {
        toast.success(t('markAllRead'));
        fetchNotifications();
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success(t('success'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="px-4 py-4 pb-24">
        <Skeleton className="h-8 w-32 mb-6" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{t('notifications')}</h1>
          {/* Unread count badge with red dot */}
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 min-w-5 flex items-center justify-center relative">
              {unreadCount}
              <motion.div
                className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-red-300"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleMarkAllRead}
            disabled={!!actionLoading}
          >
            <Check className="h-3 w-3 me-1" />
            {t('markAllRead')}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative mb-6"
          >
            <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <BellOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 -end-2 h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            >
              <Bell className="h-4 w-4 text-emerald-500" />
            </motion.div>
          </motion.div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('noNotifications')}</h2>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {t('notifTurnApproaching')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((notif, idx) => {
              const config = getNotificationConfig(notif.type);
              const IconComponent = config.icon;

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: notif.isRead ? 0.6 : 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                >
                  <Card className={`border-0 shadow-sm overflow-hidden border-s-4 ${config.color} ${!notif.isRead ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''} ${idx === 0 && !notif.isRead ? 'bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/20' : ''} bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`flex-shrink-0 h-9 w-9 rounded-lg ${config.iconBg} flex items-center justify-center mt-0.5`}>
                        <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-semibold ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <motion.div
                              className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                          {(() => {
                            const diff = Date.now() - new Date(notif.createdAt).getTime();
                            const mins = Math.floor(diff / 60000);
                            if (mins < 1) return t('justNow');
                            if (mins < 60) return `${mins} ${t('minutesLabel')} ${t('timeAgo')}`;
                            const hours = Math.floor(mins / 60);
                            if (hours < 24) return `${hours} ${t('hours')} ${t('timeAgo')}`;
                            return new Date(notif.createdAt).toLocaleString();
                          })()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                        disabled={actionLoading === notif.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
