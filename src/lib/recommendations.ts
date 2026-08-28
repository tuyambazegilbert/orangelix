import { Movie, WatchHistoryItem, UserRating } from '@/types';
import { MediaItem } from '@/types/media';

export interface ScoredRecommendation {
  item: MediaItem | Movie;
  score: number;
  reason: string;
}

export const RecommendationEngine = {
  calculateGenreWeights(
    watchHistory: WatchHistoryItem[],
    favorites: (MediaItem | Movie)[],
    ratings: UserRating[]
  ): Record<string, number> {
    const weights: Record<string, number> = {};

    const addWeight = (genre: string, amount: number) => {
      const g = genre.trim();
      if (!g) return;
      weights[g] = (weights[g] || 0) + amount;
    };

    // 1. History (progress weight)
    watchHistory.forEach((h) => {
      const dur = h.durationSeconds || 7200;
      const completionRatio = Math.min(1, h.progressSeconds / dur);
      const score = 1.0 + completionRatio * 2.0;
      (h.genre || ['Action']).forEach((g) => addWeight(g, score));
    });

    // 2. Favorites (weight 3.5 each)
    favorites.forEach((fav) => {
      const genres = 'genres' in fav ? fav.genres : ('genre' in fav ? fav.genre : []);
      (genres || ['Action']).forEach((g) => addWeight(g, 3.5));
    });

    // 3. Ratings (weight proportional to stars)
    ratings.forEach((r) => {
      const score = (r.rating / 5) * 3.0;
      addWeight('Action', score);
    });

    return weights;
  },

  getPersonalizedRecommendations(
    catalog: (MediaItem | Movie)[],
    watchHistory: WatchHistoryItem[],
    favorites: (MediaItem | Movie)[],
    ratings: UserRating[],
    limitCount: number = 12
  ): ScoredRecommendation[] {
    const weights = this.calculateGenreWeights(watchHistory, favorites, ratings);
    const watchedIds = new Set(watchHistory.map((h) => h.contentId));
    const favoriteIds = new Set(favorites.map((f) => f.id));

    const scored: ScoredRecommendation[] = [];

    catalog.forEach((item) => {
      if (watchedIds.has(item.id) || favoriteIds.has(item.id)) {
        return; // Exclude already watched or favorited
      }

      const genres = 'genres' in item ? item.genres : ('genre' in item ? item.genre : []);
      let itemScore = 0;
      let matchingGenre = '';

      (genres || []).forEach((g) => {
        if (weights[g]) {
          itemScore += weights[g];
          if (!matchingGenre) matchingGenre = g;
        }
      });

      // Bonus for high community rating
      const rating = 'voteAverage' in item ? item.voteAverage : ('rating' in item ? item.rating : 5.0);
      itemScore += (rating || 5) * 0.5;

      const reason = matchingGenre
        ? `Matched your passion for ${matchingGenre}`
        : 'Trending with community members';

      scored.push({
        item,
        score: itemScore,
        reason,
      });
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limitCount);
  },

  getQuickPicksUnder90Min(catalog: (MediaItem | Movie)[]): (MediaItem | Movie)[] {
    return catalog.filter((item) => {
      const isMovie = !('mediaType' in item && item.mediaType === 'tv') && !('type' in item && item.type === 'Series');
      const duration = 'duration' in item ? item.duration : 90;
      return isMovie && duration && duration <= 105;
    });
  },

  getWeekendBingeSeries(catalog: (MediaItem | Movie)[]): (MediaItem | Movie)[] {
    return catalog.filter((item) => {
      return ('mediaType' in item && item.mediaType === 'tv') || ('type' in item && item.type === 'Series');
    });
  },
};

