'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  HeartOff,
  Clock,
  MapPin,
  TicketCheck,
  ChevronRight,
  Loader2,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface FavoriteAgency {
  id: string;
  agencyId: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  category: string;
  address: string;
  customCode: string;
  isQueueOpen: boolean;
  isSponsored: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  services: { id: string; name: string }[];
  favoritedAt: string;
}

export function CustomerFavorites() {
  const { user, setView } = useAppStore();
  const { t, lang } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfavoriting, setUnfavoriting] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (agencyId: string) => {
    if (!user?.id) return;
    setUnfavoriting(agencyId);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, agencyId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.favorited) {
          setFavorites((prev) => prev.filter((f) => f.agencyId !== agencyId));
          toast.success(t('unfavoriteAgency'));
        }
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setUnfavoriting(null);
    }
  };

  const handleJoinQueue = async (agencyId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, agencyId }),
      });
      if (res.ok) {
        toast.success(t('joinSuccess'));
        setView('customer-queue');
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    }
  };

  const getAgencyName = (a: FavoriteAgency) => {
    if (lang === 'ar' && a.nameAr) return a.nameAr;
    if (lang === 'fr' && a.nameFr) return a.nameFr;
    return a.name;
  };

  const isOpenNow = (start: string, end: string) => {
    if (!start || !end) return null;
    const now = new Date();
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  if (loading) {
    return (
      <div className="px-4 py-4 pb-24 space-y-4">
        <Skeleton className="h-8 w-32" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-5">{t('favorites')}</h1>

      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="relative mx-auto mb-6 h-24 w-24">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="h-24 w-24 text-emerald-500/20 mx-auto" />
            </motion.div>
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">{t('noFavoritesYet')}</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('noFavoritesDesc')}</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {favorites.map((fav, idx) => {
              const open = isOpenNow(fav.workingHoursStart, fav.workingHoursEnd);
              return (
                <motion.div
                  key={fav.agencyId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                          <TicketCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-foreground truncate">
                              {getAgencyName(fav)}
                            </h3>
                            {fav.isSponsored && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 text-[9px] px-1.5">
                                <Star className="h-2 w-2 me-0.5" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {fav.address}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                open
                                  ? 'text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                                  : 'text-[10px] bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                              }
                            >
                              {fav.isQueueOpen && open ? t('openNow') : t('closed')}
                            </Badge>
                            {fav.workingHoursStart && fav.workingHoursEnd && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5" dir="ltr">
                                <Clock className="h-2.5 w-2.5" />
                                {fav.workingHoursStart} - {fav.workingHoursEnd}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => toggleFavorite(fav.agencyId)}
                            disabled={unfavoriting === fav.agencyId}
                            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                          >
                            {unfavoriting === fav.agencyId ? (
                              <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                            ) : (
                              <Heart className="h-4.5 w-4.5 text-red-500 fill-red-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                          onClick={() => handleJoinQueue(fav.agencyId)}
                          disabled={!fav.isQueueOpen}
                        >
                          {t('joinFromFavorites')}
                          <ChevronRight className="h-3.5 w-3.5 ms-1" />
                        </Button>
                      </div>
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
