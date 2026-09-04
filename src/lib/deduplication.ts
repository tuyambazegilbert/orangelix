/**
 * OrangeFlix Deduplication & Cross-Rail Partitioning Engine
 * Prevents video/movie repetition across rails, grids, and recommendation decks site-wide.
 */

/**
 * Extracts a normalized, canonical string identifier for any media entity
 * Handles GeoContentItem, MediaItem, MediaDetail, WatchHistoryItem, and TMDB objects.
 */
export function getCanonicalMediaId(item: unknown): string {
  if (!item || typeof item !== 'object') return '';

  const obj = item as Record<string, unknown>;

  // 1. YouTube Video ID (Strongest unique key for YouTube / Geo items)
  if (typeof obj.youtubeVideoId === 'string' && obj.youtubeVideoId.trim()) {
    return `yt-${obj.youtubeVideoId.trim()}`;
  }

  // 2. TMDB ID + Media Type
  if (typeof obj.tmdbId === 'number' && obj.tmdbId > 0) {
    const type = (obj.mediaType as string) || 'movie';
    return `tmdb-${type}-${obj.tmdbId}`;
  }

  // 3. Explicit ID
  if (typeof obj.id === 'string' && obj.id.trim()) {
    const id = obj.id.trim();
    // Normalize geo- prefix
    if (id.startsWith('geo-')) {
      return id.toLowerCase();
    }
    // Normalize movie-/tv- prefix
    if (/^(movie|tv)-\d+$/.test(id)) {
      return `tmdb-${id.toLowerCase()}`;
    }
    return id.toLowerCase();
  }

  if (typeof obj.id === 'number') {
    const type = (obj.mediaType as string) || 'movie';
    return `tmdb-${type}-${obj.id}`;
  }

  // 4. Content ID (Watch History)
  if (typeof obj.contentId === 'string' && obj.contentId.trim()) {
    return obj.contentId.trim().toLowerCase();
  }

  // 5. Slug
  if (typeof obj.slug === 'string' && obj.slug.trim()) {
    const country = typeof obj.countryCode === 'string' ? obj.countryCode.toLowerCase() : '';
    return `slug-${country}-${obj.slug.trim().toLowerCase()}`;
  }

  // 6. Normalized Title fallback
  if (typeof obj.title === 'string' && obj.title.trim()) {
    const cleanTitle = obj.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const year = typeof obj.releaseYear === 'number' ? obj.releaseYear : '';
    return `title-${cleanTitle}-${year}`;
  }

  return '';
}

/**
 * Deduplicates a list of items, removing internal duplicates and any items present in excludeIds
 */
export function deduplicateList<T>(
  items: T[] | null | undefined,
  excludeIds?: Set<string> | Iterable<string>
): T[] {
  if (!items || !Array.isArray(items) || items.length === 0) return [];

  const seen = new Set<string>();
  if (excludeIds) {
    for (const id of excludeIds) {
      if (id) seen.add(id);
    }
  }

  const result: T[] = [];

  for (const item of items) {
    if (!item) continue;
    const key = getCanonicalMediaId(item);
    if (!key) {
      result.push(item);
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

export interface RailConfig<T> {
  key: string;
  items: T[];
  maxCount?: number;
  fallbackItems?: T[];
}

/**
 * Cross-Rail Smart Partitioning
 * Given multiple named candidate lists, assigns unique non-overlapping items to each rail in priority order.
 * Guarantees zero duplicate movies between rails on the same page.
 */
export function partitionRails<T>(
  rails: RailConfig<T>[],
  initialExcludedIds?: Set<string> | Iterable<string>
): Record<string, T[]> {
  const globallySeen = new Set<string>();

  if (initialExcludedIds) {
    for (const id of initialExcludedIds) {
      if (id) globallySeen.add(id);
    }
  }

  const output: Record<string, T[]> = {};

  for (const rail of rails) {
    const targetCount = rail.maxCount ?? 12;
    const picked: T[] = [];

    // First pick from primary items
    const primaryItems = rail.items || [];
    for (const item of primaryItems) {
      if (!item) continue;
      const key = getCanonicalMediaId(item);
      if (!key || !globallySeen.has(key)) {
        if (key) globallySeen.add(key);
        picked.push(item);
        if (picked.length >= targetCount) break;
      }
    }

    // If rail needs more and has fallbacks, fill from fallbacks
    if (picked.length < targetCount && rail.fallbackItems && rail.fallbackItems.length > 0) {
      for (const fallback of rail.fallbackItems) {
        if (!fallback) continue;
        const key = getCanonicalMediaId(fallback);
        if (!key || !globallySeen.has(key)) {
          if (key) globallySeen.add(key);
          picked.push(fallback);
          if (picked.length >= targetCount) break;
        }
      }
    }

    output[rail.key] = picked;
  }

  return output;
}

/**
 * Filter out Hero StageSlider items from subsequent grids or carousels
 */
export function filterOutHeroItems<T>(heroItems: T[], gridItems: T[]): T[] {
  if (!heroItems || heroItems.length === 0) return gridItems || [];
  const heroKeys = new Set(heroItems.map(getCanonicalMediaId).filter(Boolean));
  return deduplicateList(gridItems, heroKeys);
}
