import { RecommendedItem } from './types';

export function applyDiversityFilter(
  items: RecommendedItem[],
  maxCount: number = 10,
  explorationRatio: number = 0.15
): RecommendedItem[] {
  if (items.length <= maxCount) return items;

  const selected: RecommendedItem[] = [];
  const seenGenres = new Set<string>();
  const explorationCount = Math.max(1, Math.round(maxCount * explorationRatio));
  const familiarCount = maxCount - explorationCount;

  // 1. Sort by total score
  const sorted = [...items].sort((a, b) => b.score.totalScore - a.score.totalScore);

  // 2. Select top familiar items with genre diversity
  for (const item of sorted) {
    if (selected.length >= familiarCount) break;
    const primaryGenre = item.genres[0] || 'General';
    // Limit adjacent repetition
    if (selected.length < 2 || !seenGenres.has(primaryGenre)) {
      selected.push(item);
      seenGenres.add(primaryGenre);
    }
  }

  // Backfill if diversity skipped too many
  for (const item of sorted) {
    if (selected.length >= familiarCount) break;
    if (!selected.some((s) => s.id === item.id)) {
      selected.push(item);
    }
  }

  // 3. Inject novel/exploration items from lower in the candidate pool
  const explorationCandidates = sorted
    .slice(familiarCount)
    .filter((item) => !selected.some((s) => s.id === item.id));

  for (let i = 0; i < explorationCount && i < explorationCandidates.length; i++) {
    const expItem = explorationCandidates[i];
    expItem.primaryReason = 'Something different you might like';
    selected.push(expItem);
  }

  return selected.slice(0, maxCount);
}
