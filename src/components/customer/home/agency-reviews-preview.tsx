'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { AgencyRatingDisplay } from '@/components/shared/agency-rating-display';

interface AgencyReviewsPreviewProps {
  agencyId: string;
  averageRating?: number;
  reviewCount?: number;
}

export function AgencyReviewsPreview({ agencyId, averageRating, reviewCount }: AgencyReviewsPreviewProps) {
  const { t, lang } = useLanguage();
  const [reviews, setReviews] = useState<Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { fullName: string; avatarUrl?: string };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?agencyId=${encodeURIComponent(agencyId)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [agencyId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-sm text-foreground">{t('customerReviews')}</h3>
        </div>
        <div className="text-center py-6">
          <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-2">
            <Star className="h-6 w-6 text-amber-300 dark:text-amber-700" />
          </div>
          <p className="text-sm text-muted-foreground">{t('noReviewsYet')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('beFirstToReview')}</p>
        </div>
      </div>
    );
  }

  const displayReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-sm text-foreground">{t('customerReviews')}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <AgencyRatingDisplay
            averageRating={averageRating ?? 0}
            totalCount={reviewCount ?? reviews.length}
            compact
            size="sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {displayReviews.map((review, idx) => {
            const initials = review.user.fullName
              .split(' ')
              .map((n: string) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();
            const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
            const colorClass = colors[review.user.fullName.length % colors.length];

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-[10px] font-bold text-white">{initials || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">{review.user.fullName}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-2.5 w-2.5 ${
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{review.comment}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground/70">
                    {new Date(review.createdAt).toLocaleDateString(
                      lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US',
                      { month: 'short', day: 'numeric' }
                    )}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {reviews.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? t('showLess') || 'Show less' : `${t('seeAllReviews')} (${reviews.length})`}
        </Button>
      )}
    </div>
  );
}
