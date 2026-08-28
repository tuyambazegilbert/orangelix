import { RecommendationScore } from './types';

export function getPrimaryExplanation(score: RecommendationScore, title: string): string {
  if (score.reasons.length > 0) {
    // Pick the highest weighted reason
    const sorted = [...score.reasons].sort((a, b) => b.weight - a.weight);
    return sorted[0].label;
  }

  if (score.tasteMatch > 0.6) {
    return 'Matches your viewing taste';
  }

  if (score.contextFit > 0.7) {
    return 'Great pick for tonight';
  }

  return `Popular on OrangeFlix`;
}
