import React, { useState, useMemo, FormEvent } from 'react';
import { useMediaReviews } from '@/hooks/use-tmdb';
import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import { Analytics } from '@/services/analytics';
import { Review } from '@/types';
import { TMDBReview } from '@/types/tmdb';
import { Star, MessageSquare, ExternalLink, User, Send, CheckCircle2, Sparkles, ThumbsUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface MediaReviewsSectionProps {
  mediaType: 'movie' | 'tv';
  tmdbId?: number | null;
  mediaTitle: string;
  voteAverage?: number;
  voteCount?: number;
  rawId?: string;
}

function getAvatarUrl(avatarPath?: string | null): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  if (avatarPath.startsWith('/http://') || avatarPath.startsWith('/https://')) {
    return avatarPath.substring(1);
  }
  return `https://image.tmdb.org/t/p/w185${avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`}`;
}

export default function MediaReviewsSection({
  mediaType,
  tmdbId,
  mediaTitle,
  voteAverage = 0,
  voteCount = 0,
  rawId = '',
}: MediaReviewsSectionProps) {
  const { currentUser } = useAuth();
  const effectiveRawId = rawId || (tmdbId ? `${mediaType}-${tmdbId}` : '');

  // Fetch TMDB verified reviews
  const { data: tmdbReviews = [], isLoading: isLoadingTmdb } = useMediaReviews(mediaType, tmdbId);

  // Local/Community reviews
  const [localReviews, setLocalReviews] = useState<Review[]>(() =>
    effectiveRawId ? MovieService.getReviews(effectiveRawId) : []
  );

  // Review Form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const toggleExpand = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const handlePostReview = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please sign in to write a review');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please enter your review comments');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name || 'OrangeFlix Member',
        movieId: effectiveRawId,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      MovieService.addReview(newReview);
      setLocalReviews((prev) => [newReview, ...prev]);
      setComment('');
      Analytics.logEvent('rating_submit', {
        userId: currentUser.id,
        entityId: effectiveRawId,
        entityTitle: mediaTitle,
      });
      toast.success('Your review has been published!');
    } catch {
      toast.error('Failed to post review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination state (10 reviews per batch)
  const [visibleCount, setVisibleCount] = useState(10);

  type ReviewItem =
    | { kind: 'local'; data: Review }
    | { kind: 'tmdb'; data: TMDBReview };

  const combinedReviews: ReviewItem[] = useMemo(() => {
    const locals: ReviewItem[] = localReviews.map((r) => ({ kind: 'local', data: r }));
    const tmdbs: ReviewItem[] = tmdbReviews.map((r) => ({ kind: 'tmdb', data: r }));
    return [...locals, ...tmdbs];
  }, [localReviews, tmdbReviews]);

  const visibleReviews = useMemo(() => {
    return combinedReviews.slice(0, visibleCount);
  }, [combinedReviews, visibleCount]);

  const hasMore = visibleCount < combinedReviews.length;
  const nextBatchCount = Math.min(10, combinedReviews.length - visibleCount);
  const totalReviewsCount = combinedReviews.length;

  return (
    <section className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
            Critical Reception & Audience Voice
          </p>
          <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
            Reviews & Reactions
            <Badge variant="outline" className="text-xs bg-black/40 border-white/10 text-slate-300 font-mono">
              {totalReviewsCount} {totalReviewsCount === 1 ? 'Review' : 'Reviews'}
            </Badge>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3.5 py-1.5 rounded-xl">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-base font-bold text-white">
              {voteAverage > 0 ? voteAverage.toFixed(1) : '8.4'}
            </span>
            <span className="text-xs text-slate-400">
              / 10 {voteCount > 0 ? `(${voteCount.toLocaleString()} votes)` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Review Submission Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-white/[.08] bg-black/35 p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-orange-400" /> Share Your Reaction
              </h3>
              {currentUser && (
                <span className="text-[11px] text-slate-400">
                  Posting as <strong className="text-white">{currentUser.name}</strong>
                </span>
              )}
            </div>

            {currentUser ? (
              <form onSubmit={handlePostReview} className="space-y-3.5">
                {/* 5-Star Interactive Selector */}
                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/[0.05]">
                  <span className="text-xs text-slate-300 font-medium">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-slate-600 hover:text-amber-400 transition"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            (hoverRating || rating) >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-1.5 font-mono">
                      {hoverRating || rating}/5
                    </span>
                  </div>
                </div>

                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={`What did you think of "${mediaTitle}"? Share your critique or reaction...`}
                  className="bg-black/50 border-white/10 text-xs text-white placeholder-slate-500 rounded-xl focus:border-orange-500 min-h-[95px] resize-none"
                />

                <Button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-9 rounded-xl shadow-lg shadow-orange-500/20"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Publish Review
                </Button>
              </form>
            ) : (
              <div className="text-center py-6 px-4 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2.5">
                <User className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">
                  Sign in to rate <span className="text-white font-bold">"{mediaTitle}"</span> and share your perspective.
                </p>
                <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg mt-1">
                  <Link to="/login">Sign In to Review</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reviews Display List */}
        <div className="lg:col-span-7 space-y-4">
          {isLoadingTmdb ? (
            <div className="py-8 text-center space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mx-auto" />
              <p className="text-xs text-slate-400">Loading critical reviews...</p>
            </div>
          ) : totalReviewsCount === 0 ? (
            <div className="py-12 text-center bg-black/20 rounded-2xl border border-white/[0.05] p-6 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No reviews yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Be the first to share your thoughts and score for {mediaTitle}!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {visibleReviews.map((item) => {
                if (item.kind === 'tmdb') {
                  const rev = item.data;
                  const avatar = getAvatarUrl(rev.author_details?.avatar_path);
                  const ratingValue = rev.author_details?.rating;
                  const isExpanded = Boolean(expandedReviews[rev.id]);
                  const isLong = rev.content.length > 280;
                  const displayContent = isExpanded || !isLong ? rev.content : `${rev.content.substring(0, 275)}...`;

                  return (
                    <article
                      key={`tmdb-${rev.id}`}
                      className="p-4 rounded-xl border border-white/[.07] bg-black/25 space-y-2.5 transition hover:border-white/[.12]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={rev.author}
                              className="w-8 h-8 rounded-full object-cover bg-slate-800 border border-white/10 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-500/30">
                              {rev.author?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">{rev.author}</span>
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0">
                                Verified Review
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {new Date(rev.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        {ratingValue !== undefined && ratingValue !== null && (
                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-amber-400 text-xs font-bold shrink-0">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{ratingValue} / 10</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {displayContent}
                      </p>

                      {isLong && (
                        <div className="pt-1 text-xs">
                          <button
                            type="button"
                            onClick={() => toggleExpand(rev.id)}
                            className="text-orange-400 hover:text-orange-300 font-semibold text-[11px]"
                          >
                            {isExpanded ? 'Show less' : 'Read full review'}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                }

                // Local community reviews
                const rev = item.data;
                return (
                  <article
                    key={`local-${rev.id}`}
                    className="p-4 rounded-xl border border-white/[.07] bg-black/25 space-y-2.5 transition hover:border-white/[.12]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {rev.userName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{rev.userName}</span>
                            <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[9px] px-1.5 py-0">
                              OrangeFlix Member
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {new Date(rev.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              (rev.rating || 5) >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {rev.comment}
                    </p>
                  </article>
                );
              })}

              {/* Load More Button (10 per batch) */}
              {hasMore && (
                <div className="pt-3 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/15 hover:border-orange-500/60 text-xs px-5 py-2.5 rounded-xl transition shadow-md font-semibold inline-flex items-center gap-2"
                  >
                    <ChevronDown className="w-4 h-4 text-orange-400" />
                    <span>
                      Load Next {nextBatchCount} Reviews ({visibleReviews.length} of {combinedReviews.length} shown)
                    </span>
                  </Button>
                </div>
              )}

              {!hasMore && combinedReviews.length > 10 && (
                <div className="text-center pt-2">
                  <p className="text-[11px] text-slate-500 font-medium">
                    All {combinedReviews.length} reviews loaded
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
