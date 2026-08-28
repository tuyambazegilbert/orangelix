import { TMDBMovie } from '@/lib/tmdb/endpoints';
import {
  TasteProfile,
  RecommendationContext,
  RecommendationScore,
  RecommendationReason,
} from './types';

export const SIGNAL_WEIGHTS = {
  completion: 1.0,
  rating: 0.95,
  favorite: 0.85,
  rewatch: 0.9,
  watchLater: 0.65,
  watchStart: 0.45,
  searchIntent: 0.5,
  weatherFit: 0.4,
  qualityAffinity: 0.35,
};

export function computeRecommendationScore(
  candidate: TMDBMovie,
  taste: TasteProfile,
  context?: RecommendationContext
): RecommendationScore {
  const reasons: RecommendationReason[] = [];

  // 1. Genre Affinity (0 to 1)
  let genreScore = 0;
  if (candidate.genre_ids && candidate.genre_ids.length > 0) {
    let matchedWeights = 0;
    candidate.genre_ids.forEach((gid) => {
      const gWeight = taste.genres[gid.toString()] || 0;
      if (gWeight > 0) {
        matchedWeights += gWeight;
      }
    });
    genreScore = Math.min(1.0, matchedWeights / Math.max(1, candidate.genre_ids.length * 2));
    if (genreScore > 0.4 && taste.favoriteGenreNames.length > 0) {
      reasons.push({
        type: 'genre_affinity',
        label: `Because you love ${taste.favoriteGenreNames[0]}`,
        weight: Number((genreScore * 0.4).toFixed(2)),
      });
    }
  }

  // 2. High Rating & Quality (0 to 1)
  const voteScore = (candidate.vote_average || 5) / 10;
  if (candidate.vote_average >= 7.8) {
    reasons.push({
      type: 'high_rating',
      label: `Critically acclaimed (${candidate.vote_average.toFixed(1)} ★)`,
      weight: 0.25,
    });
  }

  // 3. Context & Weather Fit
  let contextScore = 0.5;
  if (context?.weatherCondition) {
    const isRain = /rain|drizzle|thunder/i.test(context.weatherCondition);
    const isSciFiOrThriller = candidate.genre_ids?.some((id) => [878, 53, 9648, 18].includes(id));
    if (isRain && isSciFiOrThriller) {
      contextScore = 0.9;
      reasons.push({
        type: 'weather_fit',
        label: 'Rainy evening pick',
        weight: 0.3,
      });
    } else if (context.timeOfDay === 'night' && isSciFiOrThriller) {
      contextScore = 0.8;
      reasons.push({
        type: 'weather_fit',
        label: 'Late night atmosphere',
        weight: 0.2,
      });
    }
  }

  // 4. Trending & Freshness
  const popularityScore = Math.min(1.0, (candidate.popularity || 10) / 100);
  if (popularityScore > 0.6 && reasons.length === 0) {
    reasons.push({
      type: 'trending',
      label: 'Trending now on OrangeFlix',
      weight: 0.2,
    });
  }

  // Calculate Weighted Total Score
  const totalScore = Number(
    (
      genreScore * 0.45 +
      voteScore * 0.25 +
      contextScore * 0.15 +
      popularityScore * 0.15
    ).toFixed(3)
  );

  const confidence = Object.keys(taste.genres).length > 2 ? 0.85 : 0.45;

  return {
    tasteMatch: Number(genreScore.toFixed(2)),
    contentGraphMatch: Number(voteScore.toFixed(2)),
    contextFit: Number(contextScore.toFixed(2)),
    behaviorScore: Number(popularityScore.toFixed(2)),
    explorationScore: 0.15,
    totalScore,
    confidence,
    reasons,
  };
}
